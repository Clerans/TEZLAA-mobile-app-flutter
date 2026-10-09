import prisma from '../config/database.js';
import { OrderStatus, LoyaltyTxType, UserRole } from '@prisma/client';

export class AdminRepository {
  // 1. Dashboard & Live Metrics
  async getDashboard(branchId?: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const baseWhere: any = branchId && branchId !== 'all' ? { branchId } : {};

    const [
      todayOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      cancelledOrders,
      todayRevenueAgg,
      weekRevenueAgg,
      monthRevenueAgg,
      activeCustomers,
      activeBranches,
      recentOrders,
    ] = await Promise.all([
      prisma.order.count({
        where: { ...baseWhere, createdAt: { gte: startOfToday } },
      }),
      prisma.order.count({
        where: { ...baseWhere, status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED] } },
      }),
      prisma.order.count({
        where: { ...baseWhere, status: OrderStatus.PREPARING },
      }),
      prisma.order.count({
        where: {
          ...baseWhere,
          status: { in: [OrderStatus.READY, OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY] },
        },
      }),
      prisma.order.count({
        where: {
          ...baseWhere,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.PICKED_UP] },
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.order.count({
        where: { ...baseWhere, status: OrderStatus.CANCELLED, createdAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.PICKED_UP] },
          createdAt: { gte: startOfToday },
        },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.PICKED_UP] },
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: {
          ...baseWhere,
          status: { in: [OrderStatus.DELIVERED, OrderStatus.PICKED_UP] },
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { grandTotal: true },
      }),
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      prisma.branch.count({ where: { isActive: true } }),
      prisma.order.findMany({
        where: baseWhere,
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, phone: true } },
          branch: { select: { name: true } },
          items: {
            include: { product: { select: { name: true } }, variant: true, addons: true },
          },
          payments: true,
        },
      }),
    ]);

    return {
      metrics: {
        todayOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        completedOrders,
        cancelledOrders,
        todayRevenue: todayRevenueAgg._sum.grandTotal || 0,
        weekRevenue: weekRevenueAgg._sum.grandTotal || 0,
        monthRevenue: monthRevenueAgg._sum.grandTotal || 0,
        activeCustomers,
        activeBranches,
      },
      recentOrders,
    };
  }

  // 2. Orders List & Filters
  async getAllOrders(filter?: {
    branchId?: string;
    status?: OrderStatus | string;
    search?: string;
    date?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filter?.branchId && filter.branchId !== 'all') {
      where.branchId = filter.branchId;
    }

    if (filter?.status && (filter.status as any) !== 'ALL') {
      const s = String(filter.status).toUpperCase();
      if (s === 'ACTIVE') {
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
      } else if (s === 'COMPLETED') {
        where.status = {
          in: [OrderStatus.DELIVERED, OrderStatus.PICKED_UP],
        };
      } else if (s === 'CANCELLED') {
        where.status = OrderStatus.CANCELLED;
      } else if (Object.values(OrderStatus).includes(filter.status as any)) {
        where.status = filter.status;
      }
    }

    if (filter?.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { user: { fullName: { contains: filter.search, mode: 'insensitive' } } },
        { user: { phone: { contains: filter.search, mode: 'insensitive' } } },
      ];
    }

    if (filter?.date) {
      const startOfDay = new Date(filter.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filter.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              fullName: true,
              phone: true,
              email: true,
            },
          },
          branch: {
            select: {
              name: true,
              address: true,
            },
          },
          address: true,
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true,
                },
              },
              variant: true,
              addons: true,
            },
          },
          payments: true,
        },
      }),
    ]);

    return { total, page, limit, items };
  }

  async getOrderById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        branch: true,
        address: true,
        items: {
          include: {
            product: true,
            variant: true,
            addons: true,
          },
        },
        payments: true,
      },
    });
  }

  // 3. Products Management
  async getProducts(filter?: {
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
  }) {
    const where: any = {};

    if (filter?.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    if (filter?.categoryId && filter.categoryId !== 'all') {
      where.categoryId = filter.categoryId;
    }

    if (filter?.isAvailable !== undefined) {
      where.isAvailable = filter.isAvailable;
    }

    if (filter?.isFeatured !== undefined) {
      where.isFeatured = filter.isFeatured;
    }

    return prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        variants: true,
        addons: true,
      },
    });
  }

  async createProduct(data: any) {
    const slug =
      data.slug ||
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    return prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description || '',
        price: parseFloat(data.price),
        discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        isVegetarian: Boolean(data.isVegetarian),
        isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
        isFeatured: Boolean(data.isFeatured),
        isRecommended: Boolean(data.isRecommended),
        isFreshToday: Boolean(data.isFreshToday),
        preparationTime: data.preparationTime ? parseInt(data.preparationTime, 10) : 15,
        calories: data.calories ? parseInt(data.calories, 10) : null,
        allergens: data.allergens || [],
        ingredients: data.ingredients || [],
      },
      include: {
        category: true,
        variants: true,
        addons: true,
      },
    });
  }

  async updateProduct(id: string, data: any) {
    return prisma.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: parseFloat(data.price) }),
        ...(data.discountedPrice !== undefined && {
          discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
        }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.isVegetarian !== undefined && { isVegetarian: Boolean(data.isVegetarian) }),
        ...(data.isAvailable !== undefined && { isAvailable: Boolean(data.isAvailable) }),
        ...(data.isFeatured !== undefined && { isFeatured: Boolean(data.isFeatured) }),
        ...(data.isRecommended !== undefined && { isRecommended: Boolean(data.isRecommended) }),
        ...(data.isFreshToday !== undefined && { isFreshToday: Boolean(data.isFreshToday) }),
        ...(data.preparationTime !== undefined && {
          preparationTime: parseInt(data.preparationTime, 10),
        }),
        ...(data.calories !== undefined && { calories: parseInt(data.calories, 10) }),
        ...(data.allergens && { allergens: data.allergens }),
        ...(data.ingredients && { ingredients: data.ingredients }),
      },
      include: {
        category: true,
        variants: true,
        addons: true,
      },
    });
  }

  async deleteProduct(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  async toggleProductAvailability(productId: string, isAvailable: boolean) {
    return prisma.product.update({
      where: { id: productId },
      data: { isAvailable },
    });
  }

  // 4. Categories Management
  async getCategories() {
    return prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async createCategory(data: any) {
    const slug =
      data.slug ||
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || '',
        imageUrl: data.imageUrl,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateCategory(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.displayOrder !== undefined && { displayOrder: parseInt(data.displayOrder, 10) }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deleteCategory(id: string) {
    return prisma.category.delete({ where: { id } });
  }

  // 5. Branches Management
  async getBranches() {
    return prisma.branch.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
  }

  async createBranch(data: any) {
    const slug =
      data.slug ||
      data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

    return prisma.branch.create({
      data: {
        name: data.name,
        slug,
        address: data.address,
        phone: data.phone,
        email: data.email || null,
        latitude: parseFloat(data.latitude || 6.9034),
        longitude: parseFloat(data.longitude || 79.9553),
        openingHours: data.openingHours || '07:00 AM - 10:00 PM Daily',
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        imageUrl: data.imageUrl,
      },
    });
  }

  async updateBranch(id: string, data: any) {
    return prisma.branch.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.openingHours && { openingHours: data.openingHours }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
  }

  async toggleBranchStatus(branchId: string, isActive: boolean) {
    return prisma.branch.update({
      where: { id: branchId },
      data: { isActive },
    });
  }

  // 6. Customers Management
  async getCustomers(filter?: { search?: string; page?: number; limit?: number }) {
    const where: any = { role: UserRole.CUSTOMER };

    if (filter?.search) {
      where.OR = [
        { fullName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          createdAt: true,
          loyaltyAccount: {
            select: {
              points: true,
              lifetimePoints: true,
              tier: true,
            },
          },
          _count: {
            select: { orders: true },
          },
        },
      }),
    ]);

    return { total, page, limit, items };
  }

  async getCustomerById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        birthday: true,
        createdAt: true,
        addresses: true,
        loyaltyAccount: {
          include: {
            transactions: {
              take: 20,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        orders: {
          take: 15,
          orderBy: { createdAt: 'desc' },
          include: {
            branch: { select: { name: true } },
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });
  }

  // 7. Loyalty & TEZLAA Circle
  async getLoyaltyAccounts(search?: string) {
    const where: any = {};
    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return prisma.loyaltyAccount.findMany({
      where,
      orderBy: { points: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        transactions: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async adjustLoyaltyPoints(userId: string, pointsDelta: number, reason: string) {
    return prisma.$transaction(async (tx) => {
      let account = await tx.loyaltyAccount.findUnique({ where: { userId } });

      if (!account) {
        account = await tx.loyaltyAccount.create({
          data: { userId, points: 0, lifetimePoints: 0 },
        });
      }

      const newPoints = Math.max(0, account.points + pointsDelta);
      const newLifetime =
        pointsDelta > 0 ? account.lifetimePoints + pointsDelta : account.lifetimePoints;

      const updatedAccount = await tx.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: newPoints,
          lifetimePoints: newLifetime,
        },
      });

      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          points: pointsDelta,
          type: pointsDelta >= 0 ? LoyaltyTxType.BONUS : LoyaltyTxType.REDEEMED,
          description: `Staff Adjustment: ${reason}`,
        },
      });

      return updatedAccount;
    });
  }

  // 8. Rewards Management
  async getRewards() {
    return prisma.reward.findMany({ orderBy: { pointsRequired: 'asc' } });
  }

  async createReward(data: any) {
    return prisma.reward.create({
      data: {
        title: data.title,
        description: data.description,
        pointsRequired: parseInt(data.pointsRequired, 10),
        rewardType: data.rewardType || 'DISCOUNT_VOUCHER',
        discountValue: data.discountValue ? parseFloat(data.discountValue) : null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateReward(id: string, data: any) {
    return prisma.reward.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.pointsRequired !== undefined && {
          pointsRequired: parseInt(data.pointsRequired, 10),
        }),
        ...(data.rewardType && { rewardType: data.rewardType }),
        ...(data.discountValue !== undefined && {
          discountValue: data.discountValue ? parseFloat(data.discountValue) : null,
        }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deleteReward(id: string) {
    return prisma.reward.delete({ where: { id } });
  }

  // 9. Promotions Management
  async getPromotions() {
    return prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createPromotion(data: any) {
    return prisma.promotion.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        bannerImageUrl: data.bannerImageUrl,
        discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : null,
        discountAmount: data.discountAmount ? parseFloat(data.discountAmount) : null,
        promoCode: data.promoCode || null,
        actionUrl: data.actionUrl || null,
        startDate: new Date(data.startDate || Date.now()),
        endDate: new Date(data.endDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updatePromotion(id: string, data: any) {
    return prisma.promotion.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle }),
        ...(data.bannerImageUrl && { bannerImageUrl: data.bannerImageUrl }),
        ...(data.discountPercentage !== undefined && {
          discountPercentage: data.discountPercentage ? parseFloat(data.discountPercentage) : null,
        }),
        ...(data.discountAmount !== undefined && {
          discountAmount: data.discountAmount ? parseFloat(data.discountAmount) : null,
        }),
        ...(data.promoCode !== undefined && { promoCode: data.promoCode }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deletePromotion(id: string) {
    return prisma.promotion.delete({ where: { id } });
  }

  // 10. Coupons Management
  async getCoupons() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createCoupon(data: any) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discountType: data.discountType || 'PERCENTAGE',
        discountValue: parseFloat(data.discountValue),
        minOrderValue: data.minOrderValue ? parseFloat(data.minOrderValue) : 0,
        maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        validFrom: new Date(data.validFrom || Date.now()),
        validUntil: new Date(data.validUntil || Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      },
    });
  }

  async updateCoupon(id: string, data: any) {
    return prisma.coupon.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.discountType && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: parseFloat(data.discountValue) }),
        ...(data.minOrderValue !== undefined && {
          minOrderValue: parseFloat(data.minOrderValue),
        }),
        ...(data.maxDiscount !== undefined && {
          maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
        }),
        ...(data.validFrom && { validFrom: new Date(data.validFrom) }),
        ...(data.validUntil && { validUntil: new Date(data.validUntil) }),
        ...(data.usageLimit !== undefined && {
          usageLimit: data.usageLimit ? parseInt(data.usageLimit, 10) : null,
        }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });
  }

  async deleteCoupon(id: string) {
    return prisma.coupon.delete({ where: { id } });
  }

  // 11. Staff Notifications Feed
  async getNotifications(limit = 50) {
    return prisma.notification.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });
  }
}

export const adminRepository = new AdminRepository();
export default adminRepository;
