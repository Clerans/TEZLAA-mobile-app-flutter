import { randomBytes } from 'node:crypto';
import prisma from '../config/database.js';
import orderRepository, { CreateOrderItemInput } from '../repositories/order.repository.js';
import couponService from './coupon.service.js';
import paymentService from './payment.service.js';
import payHereProvider from './payhere.provider.js';
import notificationService from './notification.service.js';
import loyaltyService from './loyalty.service.js';
import deliveryService from './delivery.service.js';
import { emitOrderStatusUpdated, emitOrderCreated } from '../sockets/index.js';
import { ApiError } from '../utils/apiError.js';
import { roundMoney } from '../utils/money.js';
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface ValidateCartDTO {
  branchId?: string;
  orderType: OrderType;
  items: {
    productId: string;
    variantId?: string | null;
    addonIds?: string[];
    quantity: number;
    clientUnitPrice?: number;
  }[];
}

export interface PlaceOrderDTO {
  userId: string;
  orderType: OrderType;
  branchId: string;
  addressId?: string | null;
  deliveryInstructions?: string;
  customerNotes?: string;
  couponCode?: string | null;
  rewardId?: string | null;
  paymentMethod: PaymentMethod;
  idempotencyKey?: string | null;
  items: {
    productId: string;
    variantId?: string | null;
    addonIds?: string[];
    quantity: number;
    specialInstructions?: string;
  }[];
}

// Order Status State Machine Transition Rules
export const VALID_DELIVERY_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY],
  READY: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
  DELIVERED: [],
  READY_FOR_PICKUP: [],
  PICKED_UP: [],
  CANCELLED: [],
};

export const VALID_PICKUP_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.READY, OrderStatus.READY_FOR_PICKUP],
  READY: [OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP],
  READY_FOR_PICKUP: [OrderStatus.PICKED_UP],
  PICKED_UP: [],
  OUT_FOR_DELIVERY: [],
  DELIVERED: [],
  CANCELLED: [],
};

export class OrderService {
  async placeOrder(dto: PlaceOrderDTO) {
    if (!dto.items || dto.items.length === 0) {
      throw new ApiError(400, 'Your cart is empty. Please add items before placing an order.');
    }

    // 0. Verify user exists in database
    const user = await prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new ApiError(401, 'User account not found. Please log in again.');
    }

    // 1. Verify branch exists and is active
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [
          { id: dto.branchId },
          { slug: dto.branchId },
        ],
      },
    });
    if (!branch || !branch.isActive) {
      throw new ApiError(400, 'Selected branch is currently not accepting orders.');
    }

    // 2. If delivery, verify customer address ownership and delivery boundary
    let customerAddressObj = null;
    if (dto.orderType === OrderType.DELIVERY) {
      if (dto.addressId) {
        customerAddressObj = await prisma.address.findUnique({
          where: { id: dto.addressId },
        });

        if (!customerAddressObj || customerAddressObj.userId !== dto.userId) {
          throw ApiError.forbidden('Selected delivery address does not belong to your account');
        }
      } else {
        customerAddressObj = await prisma.address.findFirst({
          where: { userId: dto.userId },
          orderBy: { isDefault: 'desc' },
        });
      }

      if (!customerAddressObj) {
        throw new ApiError(400, 'A valid delivery address is required for delivery orders. Please select or add an address.');
      }

      // Explicit coordinate & radius validation
      const bLat = branch.latitude;
      const bLon = branch.longitude;
      const cLat = customerAddressObj.latitude;
      const cLon = customerAddressObj.longitude;
      const configuredRadius = branch.deliveryRadiusKm;

      if (
        bLat === null || bLat === undefined ||
        bLon === null || bLon === undefined ||
        cLat === null || cLat === undefined ||
        cLon === null || cLon === undefined ||
        configuredRadius === null || configuredRadius === undefined || configuredRadius <= 0
      ) {
        throw new ApiError(400, 'Branch and delivery address geographic coordinates and branch delivery radius are required for delivery validation.');
      }

      const R = 6371; // Earth radius in km
      const dLat = (cLat - bLat) * (Math.PI / 180);
      const dLon = (cLon - bLon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(bLat * (Math.PI / 180)) *
          Math.cos(cLat * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = R * c;

      if (distanceKm > configuredRadius) {
        throw new ApiError(
          400,
          `Delivery address is ${distanceKm.toFixed(1)} km away, which exceeds the branch's maximum delivery radius of ${configuredRadius.toFixed(1)} km.`
        );
      }
    }

    // 3. Authoritative Product, Variant, and Addon Validation & Price Calculation
    let calculatedSubtotal = 0;
    const validatedOrderItems: CreateOrderItemInput[] = [];

    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new ApiError(400, 'Item quantity must be greater than zero.');
      }

      // Fetch product from DB
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          variants: true,
          addons: true,
        },
      });

      if (!product || !product.isAvailable) {
        throw new ApiError(
          400,
          `The item "${product?.name || 'Selected product'}" is currently unavailable.`
        );
      }

      let baseUnitPrice = product.price;

      // Validate Variant if selected
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isAvailable) {
          throw new ApiError(
            400,
            `The selected size/variant for "${product.name}" is no longer available.`
          );
        }
        baseUnitPrice = variant.price;
      }

      // P1: Check for required addons
      const requiredAddons = product.addons.filter((a) => a.isRequired);
      for (const reqAddon of requiredAddons) {
        if (!item.addonIds || !item.addonIds.includes(reqAddon.id)) {
          throw new ApiError(
            400,
            `"${reqAddon.name}" is required for product "${product.name}".`
          );
        }
      }

      // Validate Addons if selected
      const itemAddons: { addonId?: string | null; name: string; price: number; quantity: number }[] = [];
      let addonsSum = 0;

      if (item.addonIds && item.addonIds.length > 0) {
        // Count occurrences of addon IDs to enforce maxQuantity
        const addonCounts: Record<string, number> = {};
        for (const addonId of item.addonIds) {
          addonCounts[addonId] = (addonCounts[addonId] || 0) + 1;
        }

        for (const [addonId, count] of Object.entries(addonCounts)) {
          const addon = product.addons.find((a) => a.id === addonId);
          if (!addon) {
            throw new ApiError(
              400,
              `An add-on selected for "${product.name}" is no longer available.`
            );
          }

          if (count > addon.maxQuantity) {
            throw new ApiError(
              400,
              `Maximum allowed quantity for "${addon.name}" is ${addon.maxQuantity}.`
            );
          }

          addonsSum += addon.price * count;
          itemAddons.push({
            addonId: addon.id,
            name: addon.name,
            price: addon.price,
            quantity: count,
          });
        }
      }

      const itemUnitPrice = roundMoney(baseUnitPrice + addonsSum);
      const itemTotalPrice = roundMoney(itemUnitPrice * item.quantity);
      calculatedSubtotal = roundMoney(calculatedSubtotal + itemTotalPrice);

      validatedOrderItems.push({
        productId: product.id,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: baseUnitPrice,
        totalPrice: itemTotalPrice,
        specialInstructions: item.specialInstructions,
        addons: itemAddons,
      });
    }

    // 4. Calculate Delivery Fee (Authoritative server-side calculation)
    const deliveryResult = deliveryService.calculateDeliveryFee({
      orderType: dto.orderType,
      branchId: dto.branchId,
      subtotal: calculatedSubtotal,
    });
    const deliveryFee = deliveryResult.deliveryFee;

    // 5. Authoritative Coupon Validation
    let discount = 0;
    let validatedCouponId: string | null = null;

    if (dto.couponCode && dto.couponCode.trim().length > 0) {
      const couponResult = await couponService.validateCoupon(
        dto.couponCode.trim(),
        calculatedSubtotal
      );
      discount = couponResult.discountAmount;
      validatedCouponId = couponResult.couponId;
    }

    // 6. Authoritative Loyalty Reward Validation
    let loyaltyDiscount = 0;
    if (dto.rewardId) {
      const reward = await prisma.reward.findUnique({
        where: { id: dto.rewardId },
      });
      if (!reward || !reward.isActive) {
        throw new ApiError(400, 'Selected loyalty reward is invalid or inactive');
      }

      const loyaltyAcc = await prisma.loyaltyAccount.findUnique({
        where: { userId: dto.userId },
      });
      const activeReservedPoints = await loyaltyService.getAccountDetails(dto.userId);

      if (!loyaltyAcc || activeReservedPoints.availablePoints < reward.pointsRequired) {
        throw new ApiError(400, 'Insufficient available loyalty points to redeem this reward');
      }

      loyaltyDiscount = reward.discountValue || 0;
    }

    const grandTotal = roundMoney(Math.max(0, calculatedSubtotal + deliveryFee - discount - loyaltyDiscount));

    // 7. Generate Collision-Safe Unique Order Number (Cryptographically Secure)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `TZL-${dateStr}-${randomHex}`;

    // Estimated preparation time: 30 mins from now
    const estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);

    const isOnlinePayment = dto.paymentMethod === 'CARD' || dto.paymentMethod === 'ONLINE_GATEWAY';
    const initialOrderStatus = isOnlinePayment ? OrderStatus.PENDING : OrderStatus.CONFIRMED;
    const initialPaymentStatus = PaymentStatus.PENDING;
    const gatewayProvider = isOnlinePayment ? 'PayHere' : 'CashOnDelivery';
    const transactionId = isOnlinePayment ? `INTENT-${orderNumber}` : `COD-${Date.now()}`;

    // 8. Atomic Order Creation (with transaction-level idempotency & reservation)
    const order = await orderRepository.createOrderTransaction({
      userId: dto.userId,
      orderNumber,
      idempotencyKey: dto.idempotencyKey,
      branchId: branch.id,
      addressId: dto.orderType === OrderType.DELIVERY ? customerAddressObj?.id : null,
      orderType: dto.orderType,
      status: initialOrderStatus,
      subtotal: calculatedSubtotal,
      deliveryFee,
      discount,
      loyaltyDiscount,
      grandTotal,
      deliveryInstructions: dto.deliveryInstructions,
      customerNotes: dto.customerNotes,
      couponCode: dto.couponCode?.trim() || null,
      couponId: validatedCouponId,
      rewardId: dto.rewardId || null,
      estimatedDeliveryTime,
      items: validatedOrderItems,
      paymentMethod: dto.paymentMethod,
      paymentStatus: initialPaymentStatus,
      gatewayProvider,
      transactionId,
    });

    // If Cash on Delivery, notify immediately
    if (!isOnlinePayment) {
      await notificationService.createOrderStatusNotification(
        dto.userId,
        order.orderNumber,
        'CONFIRMED',
        order.id
      );

      emitOrderCreated(order);
      emitOrderStatusUpdated(order.id, dto.userId, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
      }, order.branchId);
    }

    // 9. If Online Payment, generate PayHere Signed Checkout Payload
    let payHereParams = null;
    if (isOnlinePayment) {
      if (!user.email || !user.email.trim()) {
        throw new ApiError(400, 'A valid email is required on your profile for online payment.');
      }
      if (!user.phone || !user.phone.trim()) {
        throw new ApiError(400, 'A valid phone number is required on your profile for online payment.');
      }

      const nameParts = (user.fullName || '').trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const customerAddress = customerAddressObj?.addressLine1?.trim() || branch.address.trim();

      payHereParams = payHereProvider.createCheckoutPayload({
        orderNumber: order.orderNumber,
        amount: grandTotal,
        currency: 'LKR',
        customer: {
          firstName,
          lastName,
          email: user.email.trim(),
          phone: user.phone.trim(),
          address: customerAddress,
          city: customerAddressObj?.city?.trim() || 'Colombo',
          country: 'Sri Lanka',
        },
        itemsSummary: `TEZLAA Order #${order.orderNumber}`,
      });
    }

    return {
      ...order,
      payHereParams,
    };
  }

  async getUserOrders(userId: string, statusFilter?: string) {
    return orderRepository.findByUserId(userId, statusFilter);
  }

  async getOrderById(id: string, userId: string) {
    const order = await orderRepository.findById(id, userId);
    if (!order) {
      throw new ApiError(404, 'Order not found or unauthorized');
    }
    return order;
  }

  // Controlled State Machine Transition + Points Awarding on Completion
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorRole?: string,
    actorBranchId?: string | null
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Branch authorization: non-admin staff/managers can only modify orders of their assigned branch
    if (actorRole === 'BRANCH_STAFF' || actorRole === 'BRANCH_MANAGER') {
      if (!actorBranchId || actorBranchId !== order.branchId) {
        throw ApiError.forbidden('You do not have permission to update orders for another branch');
      }
    }

    const transitions =
      order.orderType === OrderType.DELIVERY
        ? VALID_DELIVERY_TRANSITIONS
        : VALID_PICKUP_TRANSITIONS;

    const allowedNextStatuses = transitions[order.status] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new ApiError(
        400,
        `Invalid status transition from ${order.status} to ${newStatus} for ${order.orderType} order.`
      );
    }

    const updatedOrder = await orderRepository.updateStatus(order.id, newStatus);

    // If order successfully completed, award TEZLAA Circle points idempotently
    if (newStatus === OrderStatus.DELIVERED || newStatus === OrderStatus.PICKED_UP) {
      try {
        await loyaltyService.awardPointsForOrder(updatedOrder);
      } catch (loyaltyErr) {
        console.error('Failed to award loyalty points for order:', loyaltyErr);
      }
    }

    // Automated Customer Notification
    await notificationService.createOrderStatusNotification(
      order.userId,
      order.orderNumber,
      newStatus,
      order.id
    );

    // Emit Real-Time Event via WebSocket
    emitOrderStatusUpdated(order.id, order.userId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: newStatus,
      updatedAt: updatedOrder.updatedAt,
    }, order.branchId);

    return updatedOrder;
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.getOrderById(id, userId);
    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new ApiError(
        400,
        'Orders that are already preparing, ready, or out for delivery cannot be cancelled.'
      );
    }

    const updated = await orderRepository.updateStatus(order.id, OrderStatus.CANCELLED);

    // Create Notification
    await notificationService.createOrderStatusNotification(
      userId,
      order.orderNumber,
      'CANCELLED',
      order.id
    );

    // Emit Real-Time Event
    emitOrderStatusUpdated(order.id, userId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: OrderStatus.CANCELLED,
      updatedAt: updated.updatedAt,
    }, order.branchId);

    return updated;
  }

  // Safe Reorder Helper — re-validates DB prices and availability
  async getReorderData(id: string, userId: string) {
    const order = await this.getOrderById(id, userId);
    const reorderItems: {
      productId: string;
      name: string;
      imageUrl: string;
      unitPrice: number;
      quantity: number;
      variantId?: string;
      variantName?: string;
      addons: { id: string; name: string; price: number; quantity: number }[];
      isAvailable: boolean;
      priceChanged: boolean;
    }[] = [];

    for (const item of order.items) {
      const currentProduct = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true, addons: true },
      });

      if (!currentProduct || !currentProduct.isAvailable) {
        continue;
      }

      let currentPrice = currentProduct.price;
      let variantName: string | undefined;

      if (item.variantId) {
        const variant = currentProduct.variants.find((v) => v.id === item.variantId);
        if (variant && variant.isAvailable) {
          currentPrice = variant.price;
          variantName = variant.name;
        }
      }

      const validAddons: { id: string; name: string; price: number; quantity: number }[] = [];
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) {
          const currentAddon = currentProduct.addons.find((a) => a.id === addon.addonId);
          if (currentAddon) {
            validAddons.push({
              id: currentAddon.id,
              name: currentAddon.name,
              price: currentAddon.price,
              quantity: addon.quantity,
            });
          }
        }
      }

      reorderItems.push({
        productId: currentProduct.id,
        name: currentProduct.name,
        imageUrl: currentProduct.imageUrl,
        unitPrice: currentPrice,
        quantity: item.quantity,
        variantId: item.variantId || undefined,
        variantName,
        addons: validAddons,
        isAvailable: true,
        priceChanged: currentPrice !== item.unitPrice,
      });
    }

    return {
      orderNumber: order.orderNumber,
      items: reorderItems,
    };
  }

  /**
   * Authoritative Cart Pre-Checkout Validation
   * Detects price changes, unavailable items, removed add-ons or invalid quantities.
   */
  async validateCart(dto: ValidateCartDTO) {
    let authoritativeSubtotal = 0;
    const notices: string[] = [];
    let hasUnavailableItems = false;
    let hasPriceChanges = false;

    const validatedItems = [];

    for (const item of dto.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true, addons: true },
      });

      if (!product || !product.isAvailable) {
        hasUnavailableItems = true;
        notices.push(`"${product?.name || 'An item'}" is currently out of stock or unavailable.`);
        continue;
      }

      let basePrice = product.price;
      let variantName: string | undefined;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isAvailable) {
          hasUnavailableItems = true;
          notices.push(`The selected size/variant for "${product.name}" is unavailable.`);
          continue;
        }
        basePrice = variant.price;
        variantName = variant.name;
      }

      let addonsSum = 0;
      const validAddons: { id: string; name: string; price: number; quantity: number }[] = [];

      if (item.addonIds && item.addonIds.length > 0) {
        const counts: Record<string, number> = {};
        for (const id of item.addonIds) {
          counts[id] = (counts[id] || 0) + 1;
        }

        for (const [addonId, count] of Object.entries(counts)) {
          const addon = product.addons.find((a) => a.id === addonId);
          if (!addon) {
            notices.push(`An add-on for "${product.name}" is no longer available and was removed.`);
            continue;
          }

          const appliedCount = Math.min(count, addon.maxQuantity);
          addonsSum += addon.price * appliedCount;
          validAddons.push({
            id: addon.id,
            name: addon.name,
            price: addon.price,
            quantity: appliedCount,
          });
        }
      }

      const authoritativeUnit = roundMoney(basePrice + addonsSum);
      const itemTotal = roundMoney(authoritativeUnit * item.quantity);
      authoritativeSubtotal = roundMoney(authoritativeSubtotal + itemTotal);

      if (item.clientUnitPrice !== undefined && item.clientUnitPrice !== authoritativeUnit) {
        hasPriceChanges = true;
        notices.push(`Price for "${product.name}" has updated to Rs. ${authoritativeUnit.toLocaleString()}.`);
      }

      validatedItems.push({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        variantId: item.variantId || null,
        variantName,
        addons: validAddons,
        unitPrice: authoritativeUnit,
        quantity: item.quantity,
        totalPrice: itemTotal,
        isAvailable: true,
      });
    }

    const deliveryResult = deliveryService.calculateDeliveryFee({
      orderType: dto.orderType,
      branchId: dto.branchId || '',
      subtotal: authoritativeSubtotal,
    });

    return {
      isValid: !hasUnavailableItems && validatedItems.length > 0,
      hasUnavailableItems,
      hasPriceChanges,
      notices,
      items: validatedItems,
      subtotal: authoritativeSubtotal,
      deliveryFee: deliveryResult.deliveryFee,
      isFreeDelivery: deliveryResult.isFreeDelivery,
      estimatedMinutes: deliveryResult.estimatedMinutes,
    };
  }
}

export const orderService = new OrderService();
export default orderService;
