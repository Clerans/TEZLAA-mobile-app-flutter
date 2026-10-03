import prisma from '../config/database.js';
import { Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
  addons: {
    addonId?: string | null;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export interface CreateOrderInput {
  userId: string;
  orderNumber: string;
  idempotencyKey?: string | null;
  branchId: string;
  addressId?: string | null;
  orderType: OrderType;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  loyaltyDiscount: number;
  grandTotal: number;
  deliveryInstructions?: string | null;
  customerNotes?: string | null;
  couponCode?: string | null;
  couponId?: string | null;
  rewardId?: string | null;
  estimatedDeliveryTime?: Date | null;
  items: CreateOrderItemInput[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  gatewayProvider?: string;
  transactionId?: string;
}

export class OrderRepository {
  async createOrderTransaction(input: CreateOrderInput): Promise<Order> {
    return prisma.$transaction(async (tx) => {
      // 0. Idempotency Check: if idempotency key is provided, return existing order
      if (input.idempotencyKey) {
        const existingOrder = await tx.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
                addons: true,
              },
            },
            payments: true,
            branch: true,
            address: true,
          },
        });

        if (existingOrder) {
          return existingOrder;
        }
      }

      // 1. If coupon used, atomically check and reserve or consume with Row-Level Lock
      let couponToReserve: { id: string; code: string } | null = null;
      if (input.couponId) {
        const lockedCoupons: any[] = await tx.$queryRaw`
          SELECT * FROM "Coupon" WHERE id = ${input.couponId} FOR UPDATE
        `;
        const coupon = lockedCoupons[0];

        if (!coupon || !coupon.isActive) {
          throw new ApiError(400, 'Applied coupon is invalid or inactive');
        }

        const now = new Date();
        if (new Date(coupon.validFrom) > now || new Date(coupon.validUntil) < now) {
          throw new ApiError(400, 'This coupon is not valid at this time');
        }

        if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
          const activeReservations = await tx.couponReservation.count({
            where: { couponId: coupon.id, status: 'RESERVED' },
          });
          if (coupon.usageCount + activeReservations >= coupon.usageLimit) {
            throw new ApiError(400, 'This coupon has reached its maximum redemption limit');
          }
        }

        couponToReserve = { id: coupon.id, code: coupon.code };

        if (input.status === OrderStatus.CONFIRMED) {
          await tx.coupon.update({
            where: { id: input.couponId },
            data: {
              usageCount: { increment: 1 },
            },
          });
        }
      }

      // 2. If loyalty reward used, atomically verify (and deduct if CONFIRMED) with Row-Level Lock
      let rewardDeductedPoints = 0;
      let loyaltyAccountId: string | null = null;
      let rewardTitle = '';
      let rewardToReserve: { id: string; points: number } | null = null;

      if (input.rewardId) {
        const lockedRewards: any[] = await tx.$queryRaw`
          SELECT * FROM "Reward" WHERE id = ${input.rewardId} FOR UPDATE
        `;
        const reward = lockedRewards[0];

        if (!reward || !reward.isActive) {
          throw new ApiError(400, 'Selected loyalty reward is invalid or inactive');
        }

        const lockedAccounts: any[] = await tx.$queryRaw`
          SELECT * FROM "LoyaltyAccount" WHERE "userId" = ${input.userId} FOR UPDATE
        `;
        const account = lockedAccounts[0];

        if (!account) {
          throw new ApiError(400, 'Loyalty account not found');
        }

        const activeReservations = await tx.loyaltyReservation.findMany({
          where: { userId: input.userId, status: 'RESERVED' },
          select: { points: true },
        });
        const reservedSum = activeReservations.reduce((s, r) => s + r.points, 0);
        const availablePoints = account.points - reservedSum;

        if (availablePoints < reward.pointsRequired) {
          throw new ApiError(400, 'Insufficient available loyalty points to redeem this reward');
        }

        rewardDeductedPoints = reward.pointsRequired;
        rewardTitle = reward.title;
        loyaltyAccountId = account.id;
        rewardToReserve = { id: reward.id, points: reward.pointsRequired };

        if (input.status === OrderStatus.CONFIRMED) {
          await tx.loyaltyAccount.update({
            where: { id: account.id },
            data: {
              points: { decrement: reward.pointsRequired },
            },
          });
        }
      }

      // 3. Create the Order
      const order = await tx.order.create({
        data: {
          orderNumber: input.orderNumber,
          idempotencyKey: input.idempotencyKey || null,
          userId: input.userId,
          branchId: input.branchId,
          addressId: input.addressId,
          orderType: input.orderType,
          status: input.status,
          subtotal: input.subtotal,
          deliveryFee: input.deliveryFee,
          discount: input.discount,
          loyaltyDiscount: input.loyaltyDiscount,
          grandTotal: input.grandTotal,
          deliveryInstructions: input.deliveryInstructions,
          customerNotes: input.customerNotes,
          couponCode: input.couponCode,
          estimatedDeliveryTime: input.estimatedDeliveryTime,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              specialInstructions: item.specialInstructions,
              addons: {
                create: item.addons.map((addon) => ({
                  addonId: addon.addonId,
                  name: addon.name,
                  price: addon.price,
                  quantity: addon.quantity,
                })),
              },
            })),
          },
          payments: {
            create: {
              paymentMethod: input.paymentMethod,
              status: input.paymentStatus,
              amount: input.grandTotal,
              currency: 'LKR',
              gatewayProvider: input.gatewayProvider || (input.paymentMethod === 'CARD' ? 'PayHere' : 'Cash'),
              transactionId: input.transactionId || `TXN-${Date.now()}`,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
              addons: true,
            },
          },
          payments: true,
          branch: true,
          address: true,
        },
      });

      // 4. Create Reservations
      if (couponToReserve) {
        await tx.couponReservation.create({
          data: {
            userId: input.userId,
            orderId: order.id,
            couponId: couponToReserve.id,
            couponCode: couponToReserve.code,
            status: input.status === OrderStatus.CONFIRMED ? 'CONSUMED' : 'RESERVED',
            consumedAt: input.status === OrderStatus.CONFIRMED ? new Date() : null,
          },
        });
      }

      if (rewardToReserve) {
        await tx.loyaltyReservation.create({
          data: {
            userId: input.userId,
            orderId: order.id,
            rewardId: rewardToReserve.id,
            points: rewardToReserve.points,
            status: input.status === OrderStatus.CONFIRMED ? 'CONSUMED' : 'RESERVED',
            consumedAt: input.status === OrderStatus.CONFIRMED ? new Date() : null,
          },
        });
      }

      // 5. Record loyalty transaction record inside transaction (if confirmed)
      if (input.status === OrderStatus.CONFIRMED && loyaltyAccountId && rewardDeductedPoints > 0) {
        await tx.loyaltyTransaction.create({
          data: {
            loyaltyAccountId,
            orderId: order.id,
            points: -rewardDeductedPoints,
            type: 'REDEEMED',
            description: `Redeemed ${rewardTitle} for Order #${order.orderNumber}`,
          },
        });
      }

      return order;
    }, { timeout: 20000, maxWait: 10000 });
  }

  async findByUserId(userId: string, statusFilter?: string) {
    const where: Prisma.OrderWhereInput = { userId };
    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        where.status = {
          in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.READY,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.READY_FOR_PICKUP,
          ],
        };
      } else if (statusFilter === 'COMPLETED') {
        where.status = {
          in: [OrderStatus.DELIVERED, OrderStatus.PICKED_UP],
        };
      } else if (statusFilter === 'CANCELLED') {
        where.status = OrderStatus.CANCELLED;
      }
    }

    return prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true, price: true },
            },
            variant: true,
            addons: true,
          },
        },
        branch: {
          select: { id: true, name: true, address: true, phone: true },
        },
        address: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId?: string) {
    return prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        ...(userId && { userId }),
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
            addons: true,
          },
        },
        branch: true,
        address: true,
        payments: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    return prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
        payments: true,
      },
    });
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;
