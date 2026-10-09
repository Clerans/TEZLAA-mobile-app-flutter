import promotionRepository from '../repositories/promotion.repository.js';
import { ApiError } from '../utils/apiError.js';

export class PromotionService {
  async getActivePromotions() {
    return promotionRepository.findActivePromotions();
  }

  async getPromotionById(id: string) {
    const promo = await promotionRepository.findById(id);
    if (!promo) {
      throw new ApiError(404, `Promotion not found with ID: ${id}`);
    }
    return promo;
  }
}

export const promotionService = new PromotionService();
export default promotionService;
