import productRepository, { ProductQueryFilters } from '../repositories/product.repository.js';
import { ApiError } from '../utils/apiError.js';

export class ProductService {
  async getProducts(filters: ProductQueryFilters) {
    return productRepository.findMany(filters);
  }

  async getProductByIdOrSlug(identifier: string) {
    let product = await productRepository.findById(identifier);
    if (!product) {
      product = await productRepository.findBySlug(identifier);
    }

    if (!product) {
      throw new ApiError(404, `Product not found with identifier: ${identifier}`);
    }

    return product;
  }

  async getFeaturedProducts(limit = 6) {
    return productRepository.findFeatured(limit);
  }

  async getFreshTodayProducts(limit = 6) {
    return productRepository.findFreshToday(limit);
  }
}

export const productService = new ProductService();
export default productService;
