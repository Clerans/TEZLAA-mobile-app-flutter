import { Response } from 'express';
import adminService from '../services/admin.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';
import { OrderStatus } from '@prisma/client';

export class AdminController {
  // Dashboard
  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let targetBranchId: string | undefined = undefined;

    if (req.user?.role === 'ADMIN') {
      targetBranchId = req.query.branchId as string;
    } else if (req.user?.role === 'BRANCH_MANAGER' || req.user?.role === 'BRANCH_STAFF') {
      if (!req.user.branchId) {
        throw ApiError.forbidden('You are not assigned to any branch');
      }
      targetBranchId = req.user.branchId;
    }

    const data = await adminService.getDashboard(targetBranchId);
    return ApiResponse.success(res, data, 'Admin dashboard metrics retrieved successfully');
  });

  // Orders
  getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let targetBranchId: string | undefined = undefined;

    if (req.user?.role === 'ADMIN') {
      targetBranchId = req.query.branchId as string;
    } else if (req.user?.role === 'BRANCH_MANAGER' || req.user?.role === 'BRANCH_STAFF') {
      if (!req.user.branchId) {
        throw ApiError.forbidden('You are not assigned to any branch');
      }
      targetBranchId = req.user.branchId;
    }

    const { status, search, date, page, limit } = req.query;
    const orders = await adminService.getOrders({
      branchId: targetBranchId,
      status: status as OrderStatus,
      search: search as string,
      date: date ? new Date(date as string) : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return ApiResponse.success(res, orders, 'Orders retrieved successfully');
  });

  getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const order = await adminService.getOrderById(id);

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (req.user?.role === 'BRANCH_MANAGER' || req.user?.role === 'BRANCH_STAFF') {
      if (!req.user.branchId || order.branchId !== req.user.branchId) {
        throw ApiError.forbidden('You do not have permission to view orders from other branches');
      }
    }

    return ApiResponse.success(res, order, 'Order details retrieved successfully');
  });

  // Products
  getProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { search, categoryId, isAvailable, isFeatured } = req.query;
    const products = await adminService.getProducts({
      search: search as string,
      categoryId: categoryId as string,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
    });
    return ApiResponse.success(res, products, 'Products retrieved successfully');
  });

  createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const product = await adminService.createProduct(req.body);
    return ApiResponse.created(res, product, 'Product created successfully');
  });

  updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updated = await adminService.updateProduct(id, req.body);
    return ApiResponse.success(res, updated, 'Product updated successfully');
  });

  deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await adminService.deleteProduct(id);
    return ApiResponse.success(res, null, 'Product deleted successfully');
  });

  toggleProductAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { isAvailable } = req.body;
    const updated = await adminService.updateProductAvailability(id, Boolean(isAvailable));
    return ApiResponse.success(res, updated, 'Product availability updated successfully');
  });

  // Categories
  getCategories = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const categories = await adminService.getCategories();
    return ApiResponse.success(res, categories, 'Categories retrieved successfully');
  });

  createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const category = await adminService.createCategory(req.body);
    return ApiResponse.created(res, category, 'Category created successfully');
  });

  updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updated = await adminService.updateCategory(id, req.body);
    return ApiResponse.success(res, updated, 'Category updated successfully');
  });

  deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await adminService.deleteCategory(id);
    return ApiResponse.success(res, null, 'Category deleted successfully');
  });

  // Branches
  getBranches = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const branches = await adminService.getBranches();
    return ApiResponse.success(res, branches, 'Branches retrieved successfully');
  });

  createBranch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const branch = await adminService.createBranch(req.body);
    return ApiResponse.created(res, branch, 'Branch created successfully');
  });

  updateBranch = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (req.user?.role === 'BRANCH_MANAGER') {
      if (!req.user.branchId || req.user.branchId !== id) {
        throw ApiError.forbidden('You only have permission to manage your assigned branch');
      }
    }

    const updated = await adminService.updateBranch(id, req.body);
    return ApiResponse.success(res, updated, 'Branch updated successfully');
  });

  toggleBranchStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    if (req.user?.role === 'BRANCH_MANAGER') {
      if (!req.user.branchId || req.user.branchId !== id) {
        throw ApiError.forbidden('You only have permission to manage your assigned branch');
      }
    }

    const { isActive } = req.body;
    const updated = await adminService.updateBranchStatus(id, Boolean(isActive));
    return ApiResponse.success(res, updated, 'Branch status updated successfully');
  });

  // Customers
  getCustomers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { search, page, limit } = req.query;
    const customers = await adminService.getCustomers({
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    return ApiResponse.success(res, customers, 'Customers retrieved successfully');
  });

  getCustomerById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const customer = await adminService.getCustomerById(id);
    return ApiResponse.success(res, customer, 'Customer details retrieved successfully');
  });

  // Loyalty
  getLoyalty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { search } = req.query;
    const accounts = await adminService.getLoyaltyAccounts(search as string);
    return ApiResponse.success(res, accounts, 'Loyalty accounts retrieved successfully');
  });

  adjustLoyalty = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, points, reason } = req.body;
    const updated = await adminService.adjustLoyaltyPoints(
      userId,
      parseInt(points, 10),
      reason || 'Staff Adjustment'
    );
    return ApiResponse.success(res, updated, 'Loyalty points adjusted successfully');
  });

  // Rewards
  getRewards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const rewards = await adminService.getRewards();
    return ApiResponse.success(res, rewards, 'Rewards retrieved successfully');
  });

  createReward = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reward = await adminService.createReward(req.body);
    return ApiResponse.created(res, reward, 'Reward created successfully');
  });

  updateReward = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updated = await adminService.updateReward(id, req.body);
    return ApiResponse.success(res, updated, 'Reward updated successfully');
  });

  deleteReward = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await adminService.deleteReward(id);
    return ApiResponse.success(res, null, 'Reward deleted successfully');
  });

  // Promotions
  getPromotions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const promotions = await adminService.getPromotions();
    return ApiResponse.success(res, promotions, 'Promotions retrieved successfully');
  });

  createPromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const promo = await adminService.createPromotion(req.body);
    return ApiResponse.created(res, promo, 'Promotion created successfully');
  });

  updatePromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updated = await adminService.updatePromotion(id, req.body);
    return ApiResponse.success(res, updated, 'Promotion updated successfully');
  });

  deletePromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await adminService.deletePromotion(id);
    return ApiResponse.success(res, null, 'Promotion deleted successfully');
  });

  // Coupons
  getCoupons = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const coupons = await adminService.getCoupons();
    return ApiResponse.success(res, coupons, 'Coupons retrieved successfully');
  });

  createCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const coupon = await adminService.createCoupon(req.body);
    return ApiResponse.created(res, coupon, 'Coupon created successfully');
  });

  updateCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updated = await adminService.updateCoupon(id, req.body);
    return ApiResponse.success(res, updated, 'Coupon updated successfully');
  });

  deleteCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await adminService.deleteCoupon(id);
    return ApiResponse.success(res, null, 'Coupon deleted successfully');
  });

  // Notifications
  getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const notifications = await adminService.getNotifications();
    return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
  });
}

export const adminController = new AdminController();
export default adminController;
