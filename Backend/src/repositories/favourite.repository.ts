import prisma from '../config/database.js';
import { Favourite } from '@prisma/client';

export class FavouriteRepository {
  async getUserFavourites(userId: string) {
    return prisma.favourite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            variants: true,
            addons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findFavourite(userId: string, productId: string): Promise<Favourite | null> {
    return prisma.favourite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });
  }

  async addFavourite(userId: string, productId: string): Promise<Favourite> {
    return prisma.favourite.create({
      data: {
        userId,
        productId,
      },
    });
  }

  async removeFavourite(userId: string, productId: string): Promise<void> {
    await prisma.favourite.deleteMany({
      where: {
        userId,
        productId,
      },
    });
  }
}

export const favouriteRepository = new FavouriteRepository();
export default favouriteRepository;
