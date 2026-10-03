import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/admin_models.dart';
import '../services/admin_services.dart';
import '../services/storage_service.dart';

class AdminAuthState {
  final AdminUserModel? user;
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  AdminAuthState({
    this.user,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AdminAuthState copyWith({
    AdminUserModel? user,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AdminAuthState(
      user: user ?? this.user,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AdminAuthNotifier extends StateNotifier<AdminAuthState> {
  final AdminAuthService _authService = AdminAuthService();
  final AdminStorageService _storage = AdminStorageService();

  AdminAuthNotifier() : super(AdminAuthState()) {
    _init();
  }

  Future<void> _init() async {
    final token = await _storage.getToken();
    final userJsonStr = await _storage.getUserData();

    if (token != null && token.isNotEmpty && userJsonStr != null) {
      try {
        final user = AdminUserModel.fromJson(jsonDecode(userJsonStr));
        state = state.copyWith(user: user, isAuthenticated: true);
      } catch (_) {}
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.login(email, password);
      if (user.role == 'CUSTOMER') {
        state = state.copyWith(
          isLoading: false,
          error: 'Access denied: Customer accounts cannot access the admin portal.',
        );
        return false;
      }
      state = state.copyWith(user: user, isAuthenticated: true, isLoading: false);
      return true;
    } catch (e) {
      String errorMessage = 'Invalid staff or admin credentials.';
      if (e is DioException) {
        if (e.response?.data != null && e.response?.data['message'] != null) {
          errorMessage = e.response?.data['message'].toString() ?? errorMessage;
        } else if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
          errorMessage = 'Unable to connect to backend server. Please check internet connection.';
        }
      }
      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AdminAuthState();
  }
}

final adminAuthProvider = StateNotifierProvider<AdminAuthNotifier, AdminAuthState>((ref) {
  return AdminAuthNotifier();
});

// KDS Orders Provider (Auto-refresh every 5 seconds)
final kdsOrdersProvider = StreamProvider.autoDispose<List<AdminOrderModel>>((ref) async* {
  final orderService = AdminOrderService();
  while (true) {
    try {
      final orders = await orderService.getOrders();
      // Only active kitchen statuses: PENDING, CONFIRMED, PREPARING, READY
      final active = orders.where((o) =>
          o.status == 'PENDING' ||
          o.status == 'CONFIRMED' ||
          o.status == 'PREPARING' ||
          o.status == 'READY' ||
          o.status == 'OUT_FOR_DELIVERY').toList();
      yield active;
    } catch (_) {
      yield [];
    }
    await Future.delayed(const Duration(seconds: 4));
  }
});

// All Orders Provider with Status Filter
final selectedStatusFilterProvider = StateProvider<String>((ref) => 'ALL');

final adminOrdersListProvider = FutureProvider.family<List<AdminOrderModel>, String>((ref, status) async {
  final orderService = AdminOrderService();
  return await orderService.getOrders(status: status == 'ALL' ? null : status);
});

// Products Inventory Provider
final adminProductsProvider = FutureProvider<List<AdminProductModel>>((ref) async {
  return await AdminProductService().getProducts();
});

// Categories Provider
final adminCategoriesProvider = FutureProvider<List<AdminCategoryModel>>((ref) async {
  return await AdminCategoryService().getCategories();
});

// Customers Provider
final adminCustomersProvider = FutureProvider.family<List<AdminCustomerModel>, String?>((ref, search) async {
  return await AdminCustomerService().getCustomers(search: search);
});

// Analytics Summary Provider
final adminAnalyticsProvider = FutureProvider<AdminAnalyticsSummary>((ref) async {
  return await AdminAnalyticsService().getSummary();
});
