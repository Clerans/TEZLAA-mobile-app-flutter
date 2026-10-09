import favouriteRepository from '../repositories/favourite.repository.js';
import productRepository from '../repositories/product.repository.js';
import { ApiError } from '../utils/apiError.js';

export class FavouriteService {
  async getFavourites(userId: string) {
    const list = await favouriteRepository.getUserFavourites(userId);
    return list.map((f) => f.product);
  }

  async toggleFavourite(userId: string, productId: string) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const existing = await favouriteRepository.findFavourite(userId, productId);
    if (existing) {
      await favouriteRepository.removeFavourite(userId, productId);
      return { isFavourite: false, message: 'Removed from favorites' };
    } else {
      await favouriteRepository.addFavourite(userId, productId);
      return { isFavourite: true, message: 'Added to favorites' };
    }
  }

  async removeFavourite(userId: string, productId: string) {
    await favouriteRepository.removeFavourite(userId, productId);
    return { isFavourite: false, message: 'Removed from favorites' };
  }
}

export const favouriteService = new FavouriteService();
export default favouriteService;
