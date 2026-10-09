import { Request, Response } from 'express';
import productService from '../services/product.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class ProductController {
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      categoryId,
      search,
      featured,
      recommended,
      freshToday,
      available,
      sort,
      page,
      limit,
    } = req.query as any;

    const result = await productService.getProducts({
      categorySlug: category,
      categoryId,
      search,
      isFeatured: featured,
      isRecommended: recommended,
      isFreshToday: freshToday,
      isAvailable: available,
      sort,
      page,
      limit,
    });

    return ApiResponse.success(
      res,
      result.items,
      'Products retrieved successfully',
      200,
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        totalPages: result.pagination.totalPages,
      }
    );
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await productService.getProductByIdOrSlug(id);
    return ApiResponse.success(res, product, 'Product details retrieved successfully');
  });

  getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const products = await productService.getFeaturedProducts(limit);
    return ApiResponse.success(res, products, 'Featured products retrieved successfully');
  });

  getFreshTodayProducts = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
    const products = await productService.getFreshTodayProducts(limit);
    return ApiResponse.success(res, products, 'Fresh Today products retrieved successfully');
  });
}

export const productController = new ProductController();
export default productController;
