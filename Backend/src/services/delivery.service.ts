import { OrderType } from '@prisma/client';

export interface DeliveryCalculationInput {
  orderType: OrderType;
  branchId: string;
  subtotal: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface DeliveryCalculationResult {
  deliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  estimatedMinutes: number;
  deliveryZone: string;
}

export class DeliveryService {
  // Standard TEZLAA delivery configuration
  private readonly STANDARD_DELIVERY_FEE = 350; // LKR
  private readonly FREE_DELIVERY_THRESHOLD = 5000; // LKR (Free delivery on orders >= Rs. 5,000)
  private readonly DEFAULT_PREP_MINUTES = 30;

  /**
   * Authoritatively calculates delivery fee and estimated delivery time
   */
  calculateDeliveryFee(input: DeliveryCalculationInput): DeliveryCalculationResult {
    // In-store pickup has 0 delivery fee
    if (input.orderType === OrderType.PICKUP) {
      return {
        deliveryFee: 0,
        isFreeDelivery: true,
        freeDeliveryThreshold: 0,
        estimatedMinutes: 20, // Pickup ready time: 20 mins
        deliveryZone: 'IN_STORE_PICKUP',
      };
    }

    // Free delivery promotion rule
    const isFreeDelivery = input.subtotal >= this.FREE_DELIVERY_THRESHOLD;
    const deliveryFee = isFreeDelivery ? 0 : this.STANDARD_DELIVERY_FEE;

    return {
      deliveryFee,
      isFreeDelivery,
      freeDeliveryThreshold: this.FREE_DELIVERY_THRESHOLD,
      estimatedMinutes: this.DEFAULT_PREP_MINUTES,
      deliveryZone: 'STANDARD_METRO_ZONE',
    };
  }
}

export const deliveryService = new DeliveryService();
export default deliveryService;
