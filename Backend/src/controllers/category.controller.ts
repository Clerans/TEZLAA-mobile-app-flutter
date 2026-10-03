import { Request, Response } from 'express';
import categoryService from '../services/category.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CategoryController {
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getAllCategories();
    return ApiResponse.success(res, categories, 'Categories retrieved successfully');
  });

  getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryByIdOrSlug(id);
    return ApiResponse.success(res, category, 'Category retrieved successfully');
  });
}

export const categoryController = new CategoryController();
export default categoryController;
