import adminRepository from '../repositories/admin.repository.js';
import { OrderStatus } from '@prisma/client';

export class AdminService {
  // Dashboard
  async getDashboard(branchId?: string) {
    return adminRepository.getDashboard(branchId);
  }

  // Orders
  async getOrders(filter?: {
    branchId?: string;
    status?: OrderStatus | string;
    search?: string;
    date?: Date;
    page?: number;
    limit?: number;
  }) {
    return adminRepository.getAllOrders(filter);
  }

  async getOrderById(orderId: string) {
    return adminRepository.getOrderById(orderId);
  }

  // Products
  async getProducts(filter?: {
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
  }) {
    return adminRepository.getProducts(filter);
  }

  async createProduct(data: any) {
    return adminRepository.createProduct(data);
  }

  async updateProduct(id: string, data: any) {
    return adminRepository.updateProduct(id, data);
  }

  async deleteProduct(id: string) {
    return adminRepository.deleteProduct(id);
  }

  async updateProductAvailability(productId: string, isAvailable: boolean) {
    return adminRepository.toggleProductAvailability(productId, isAvailable);
  }

  // Categories
  async getCategories() {
    return adminRepository.getCategories();
  }

  async createCategory(data: any) {
    return adminRepository.createCategory(data);
  }

  async updateCategory(id: string, data: any) {
    return adminRepository.updateCategory(id, data);
  }

  async deleteCategory(id: string) {
    return adminRepository.deleteCategory(id);
  }

  // Branches
  async getBranches() {
    return adminRepository.getBranches();
  }

  async createBranch(data: any) {
    return adminRepository.createBranch(data);
  }

  async updateBranch(id: string, data: any) {
    return adminRepository.updateBranch(id, data);
  }

  async updateBranchStatus(branchId: string, isActive: boolean) {
    return adminRepository.toggleBranchStatus(branchId, isActive);
  }

  // Customers
  async getCustomers(filter?: { search?: string; page?: number; limit?: number }) {
    return adminRepository.getCustomers(filter);
  }

  async getCustomerById(id: string) {
    return adminRepository.getCustomerById(id);
  }

  // Loyalty
  async getLoyaltyAccounts(search?: string) {
    return adminRepository.getLoyaltyAccounts(search);
  }

  async adjustLoyaltyPoints(userId: string, points: number, reason: string) {
    return adminRepository.adjustLoyaltyPoints(userId, points, reason);
  }

  // Rewards
  async getRewards() {
    return adminRepository.getRewards();
  }

  async createReward(data: any) {
    return adminRepository.createReward(data);
  }

  async updateReward(id: string, data: any) {
    return adminRepository.updateReward(id, data);
  }

  async deleteReward(id: string) {
    return adminRepository.deleteReward(id);
  }

  // Promotions
  async getPromotions() {
    return adminRepository.getPromotions();
  }

  async createPromotion(data: any) {
    return adminRepository.createPromotion(data);
  }

  async updatePromotion(id: string, data: any) {
    return adminRepository.updatePromotion(id, data);
  }

  async deletePromotion(id: string) {
    return adminRepository.deletePromotion(id);
  }

  // Coupons
  async getCoupons() {
    return adminRepository.getCoupons();
  }

  async createCoupon(data: any) {
    return adminRepository.createCoupon(data);
  }

  async updateCoupon(id: string, data: any) {
    return adminRepository.updateCoupon(id, data);
  }

  async deleteCoupon(id: string) {
    return adminRepository.deleteCoupon(id);
  }

  // Notifications
  async getNotifications(limit?: number) {
    return adminRepository.getNotifications(limit);
  }
}

export const adminService = new AdminService();
export default adminService;
