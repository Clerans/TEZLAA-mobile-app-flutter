import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    slug: z.string().optional(),
    description: z.string().optional().default(''),
    price: z.union([z.number().positive('Price must be positive'), z.string().regex(/^\d+(\.\d+)?$/)]),
    discountedPrice: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    categoryId: z.string().min(1, 'Category ID is required'),
    isVegetarian: z.boolean().optional().default(false),
    isAvailable: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    isRecommended: z.boolean().optional().default(false),
    isFreshToday: z.boolean().optional().default(false),
    preparationTime: z.union([z.number().int().min(1), z.string().regex(/^\d+$/)]).optional().default(15),
    calories: z.union([z.number().int().min(0), z.string().regex(/^\d+$/)]).optional().nullable(),
    allergens: z.array(z.string()).optional().default([]),
    ingredients: z.array(z.string()).optional().default([]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
    discountedPrice: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    categoryId: z.string().min(1).optional(),
    isVegetarian: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isRecommended: z.boolean().optional(),
    isFreshToday: z.boolean().optional(),
    preparationTime: z.union([z.number().int().min(1), z.string().regex(/^\d+$/)]).optional(),
    calories: z.union([z.number().int().min(0), z.string().regex(/^\d+$/)]).optional().nullable(),
    allergens: z.array(z.string()).optional(),
    ingredients: z.array(z.string()).optional(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    slug: z.string().optional(),
    description: z.string().optional().default(''),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
    displayOrder: z.union([z.number().int(), z.string().regex(/^\d+$/)]).optional().default(0),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().nullable(),
    displayOrder: z.union([z.number().int(), z.string().regex(/^\d+$/)]).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Branch name is required'),
    address: z.string().min(3, 'Address is required'),
    phone: z.string().min(6, 'Phone is required'),
    email: z.string().email('Invalid email').optional().nullable(),
    latitude: z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]).optional().default(6.9034),
    longitude: z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]).optional().default(79.9553),
    openingHours: z.string().optional().default('07:00 AM - 10:00 PM Daily'),
    isActive: z.boolean().optional().default(true),
    imageUrl: z.string().url('Invalid image URL').optional().nullable(),
  }),
});

export const updateBranchSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Branch ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    address: z.string().min(3).optional(),
    phone: z.string().min(6).optional(),
    email: z.string().email().optional().nullable(),
    latitude: z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]).optional(),
    longitude: z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/)]).optional(),
    openingHours: z.string().optional(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().url().optional().nullable(),
  }),
});

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
    description: z.string().optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).default('PERCENTAGE'),
    discountValue: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]),
    minOrderValue: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?$/)]).optional().default(0),
    maxDiscount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    validFrom: z.string().or(z.date()).optional(),
    validUntil: z.string().or(z.date()).optional(),
    usageLimit: z.union([z.number().int().min(0), z.string().regex(/^\d+$/)]).optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Coupon ID is required'),
  }),
  body: z.object({
    code: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']).optional(),
    discountValue: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
    minOrderValue: z.union([z.number().min(0), z.string().regex(/^\d+(\.\d+)?$/)]).optional(),
    maxDiscount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    validFrom: z.string().or(z.date()).optional(),
    validUntil: z.string().or(z.date()).optional(),
    usageLimit: z.union([z.number().int().min(0), z.string().regex(/^\d+$/)]).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const createRewardSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    pointsRequired: z.union([z.number().int().min(1), z.string().regex(/^\d+$/)]),
    rewardType: z.string().optional().default('DISCOUNT_VOUCHER'),
    discountValue: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateRewardSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Reward ID is required'),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    pointsRequired: z.union([z.number().int().min(1), z.string().regex(/^\d+$/)]).optional(),
    rewardType: z.string().optional(),
    discountValue: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const createPromotionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional().nullable(),
    bannerImageUrl: z.string().url('Invalid banner image URL'),
    discountPercentage: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    discountAmount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    promoCode: z.string().optional().nullable(),
    actionUrl: z.string().optional().nullable(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updatePromotionSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Promotion ID is required'),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    subtitle: z.string().optional().nullable(),
    bannerImageUrl: z.string().url().optional(),
    discountPercentage: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    discountAmount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]).optional().nullable(),
    promoCode: z.string().optional().nullable(),
    actionUrl: z.string().optional().nullable(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const adjustLoyaltySchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    points: z.union([z.number().int(), z.string().regex(/^-?\d+$/)]),
    reason: z.string().optional().default('Staff Adjustment'),
  }),
});
