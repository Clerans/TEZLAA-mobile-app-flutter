import { z } from 'zod';

export const placeOrderSchema = z.object({
  body: z.object({
    orderType: z.enum(['DELIVERY', 'PICKUP']),
    branchId: z.string().min(1, 'Branch ID is required'),
    addressId: z.string().optional().nullable(),
    deliveryInstructions: z.string().max(500).optional().nullable(),
    customerNotes: z.string().max(500).optional().nullable(),
    couponCode: z.string().max(50).optional().nullable(),
    rewardId: z.string().optional().nullable(),
    paymentMethod: z.enum(['CARD', 'ONLINE_GATEWAY', 'CASH_ON_DELIVERY']),
    idempotencyKey: z.string().max(100).optional().nullable(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Invalid product ID'),
          variantId: z.string().optional().nullable(),
          addonIds: z.array(z.string()).optional(),
          quantity: z.number().int().min(1, 'Quantity must be at least 1'),
          specialInstructions: z.string().max(300).optional().nullable(),
        })
      )
      .min(1, 'Order must contain at least one item'),
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required'),
    subtotal: z.number().min(0, 'Subtotal must be a positive number'),
  }),
});

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Label is required (e.g. Home, Office)'),
    addressLine1: z.string().min(3, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deliveryNotes: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid address ID'),
  }),
  body: z.object({
    label: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deliveryNotes: z.string().optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum([
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'READY_FOR_PICKUP',
      'PICKED_UP',
      'CANCELLED',
    ]),
  }),
});
