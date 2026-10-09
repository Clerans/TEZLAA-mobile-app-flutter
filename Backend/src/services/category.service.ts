import categoryRepository from '../repositories/category.repository.js';
import { ApiError } from '../utils/apiError.js';

export class CategoryService {
  async getAllCategories() {
    return categoryRepository.findAllActive();
  }

  async getCategoryByIdOrSlug(identifier: string) {
    let category = await categoryRepository.findById(identifier);
    if (!category) {
      const bySlug = await categoryRepository.findBySlug(identifier);
      if (bySlug) {
        category = await categoryRepository.findById(bySlug.id);
      }
    }

    if (!category) {
      throw new ApiError(404, `Category not found with identifier: ${identifier}`);
    }

    return category;
  }
}

export const categoryService = new CategoryService();
export default categoryService;
