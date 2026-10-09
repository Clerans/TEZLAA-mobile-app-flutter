import prisma from '../config/database.js';
import { Promotion } from '@prisma/client';

export class PromotionRepository {
  async findActivePromotions(): Promise<Promotion[]> {
    const now = new Date();
    return prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Promotion | null> {
    return prisma.promotion.findUnique({
      where: { id },
    });
  }
}

export const promotionRepository = new PromotionRepository();
export default promotionRepository;
