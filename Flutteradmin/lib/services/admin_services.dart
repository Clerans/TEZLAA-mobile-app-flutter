import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../core/network/api_client.dart';
import '../models/admin_models.dart';
import 'storage_service.dart';

class AdminAuthService {
  final AdminApiClient _client = AdminApiClient();
  final AdminStorageService _storage = AdminStorageService();

  Future<AdminUserModel> login(String email, String password) async {
    try {
      final response = await _client.dio.post('/auth/login', data: {
        'email': email.trim().toLowerCase(),
        'password': password,
      });

      final data = response.data['data'] ?? response.data;
      final token = data['tokens']?['accessToken'] ?? data['accessToken'] ?? data['token'] ?? '';
      final refreshToken = data['tokens']?['refreshToken'] ?? data['refreshToken'] ?? '';
      final userJson = data['user'] ?? data;

      final user = AdminUserModel.fromJson(userJson);
      await _storage.saveToken(token);
      if (refreshToken.toString().isNotEmpty) {
        await _storage.saveRefreshToken(refreshToken.toString());
      }
      await _storage.saveUserData(jsonEncode(userJson));

      return user;
    } catch (e) {
      debugPrint('AdminAuthService.login error: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storage.clear();
  }
}

class AdminOrderService {
  final AdminApiClient _client = AdminApiClient();

  Future<List<AdminOrderModel>> getOrders({String? status, String? branchId}) async {
    final response = await _client.dio.get('/admin/orders', queryParameters: {
      if (status != null && status != 'ALL') 'status': status,
      if (branchId != null) 'branchId': branchId,
    });

    final items = response.data['data']?['items'] ?? response.data['data'] ?? response.data['orders'] ?? [];
    return (items as List).map((i) => AdminOrderModel.fromJson(i)).toList();
  }

  Future<AdminOrderModel> getOrderById(String orderId) async {
    final response = await _client.dio.get('/admin/orders/$orderId');
    final data = response.data['data'] ?? response.data;
    return AdminOrderModel.fromJson(data);
  }

  Future<AdminOrderModel> updateOrderStatus(String orderId, String newStatus) async {
    final response = await _client.dio.patch('/orders/$orderId/status', data: {
      'status': newStatus,
    });
    final data = response.data['data'] ?? response.data;
    return AdminOrderModel.fromJson(data);
  }
}

class AdminProductService {
  final AdminApiClient _client = AdminApiClient();

  Future<List<AdminProductModel>> getProducts({String? categoryId, String? search}) async {
    final response = await _client.dio.get('/admin/products', queryParameters: {
      if (categoryId != null && categoryId != 'all') 'categoryId': categoryId,
      if (search != null && search.isNotEmpty) 'search': search,
    });

    final data = response.data['data'] ?? response.data;
    final List items = data is List ? data : (data['items'] as List? ?? []);
    return items.map((i) => AdminProductModel.fromJson(i as Map<String, dynamic>)).toList();
  }

  Future<void> toggleAvailability(String productId, bool isAvailable) async {
    try {
      await _client.dio.patch('/admin/products/$productId/availability', data: {
        'isAvailable': isAvailable,
      });
    } catch (e) {
      debugPrint('toggleAvailability error: $e');
      rethrow;
    }
  }

  Future<void> updateProduct(String productId, Map<String, dynamic> data) async {
    await _client.dio.put('/admin/products/$productId', data: data);
  }

  Future<void> createProduct(Map<String, dynamic> data) async {
    await _client.dio.post('/admin/products', data: data);
  }
}

class AdminCategoryService {
  final AdminApiClient _client = AdminApiClient();

  Future<List<AdminCategoryModel>> getCategories() async {
    final response = await _client.dio.get('/admin/categories');
    final data = response.data['data'] ?? response.data;
    final List items = data is List ? data : (data['items'] as List? ?? []);
    return items.map((i) => AdminCategoryModel.fromJson(i as Map<String, dynamic>)).toList();
  }
}

class AdminCustomerService {
  final AdminApiClient _client = AdminApiClient();

  Future<List<AdminCustomerModel>> getCustomers({String? search}) async {
    try {
      final response = await _client.dio.get('/admin/customers', queryParameters: {
        if (search != null && search.isNotEmpty) 'search': search,
      });
      final data = response.data['data'] ?? response.data;
      final List items = data is List ? data : (data['items'] as List? ?? data['customers'] as List? ?? []);
      return items.map((i) => AdminCustomerModel.fromJson(i as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('AdminCustomerService.getCustomers error: $e');
      rethrow;
    }
  }
}

class AdminAnalyticsService {
  final AdminApiClient _client = AdminApiClient();

  Future<AdminAnalyticsSummary> getSummary() async {
    try {
      final response = await _client.dio.get('/admin/dashboard');
      final data = response.data['data'] ?? response.data;
      return AdminAnalyticsSummary.fromJson(data);
    } catch (e) {
      debugPrint('AdminAnalyticsService.getSummary error: $e');
      rethrow;
    }
  }
}
