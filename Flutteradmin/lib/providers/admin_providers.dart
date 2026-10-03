import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/admin_models.dart';
import '../services/admin_services.dart';
import '../services/admin_socket_service.dart';
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

// KDS Orders Provider (Real-Time Socket-Driven with 25s Heartbeat Fallback)
final kdsOrdersProvider = StreamProvider.autoDispose<List<AdminOrderModel>>((ref) async* {
  final orderService = AdminOrderService();
  final socketService = AdminSocketService();
  await socketService.connect();

  List<AdminOrderModel> lastOrders = [];

  Future<List<AdminOrderModel>> fetchActive() async {
    final orders = await orderService.getOrders();
    return orders.where((o) =>
        o.status == 'PENDING' ||
        o.status == 'CONFIRMED' ||
        o.status == 'PREPARING' ||
        o.status == 'READY' ||
        o.status == 'READY_FOR_PICKUP' ||
        o.status == 'OUT_FOR_DELIVERY').toList();
  }

  // 1. Initial fetch
  try {
    lastOrders = await fetchActive();
    yield lastOrders;
  } catch (err) {
    debugPrint('Initial KDS fetch error: $err');
    rethrow;
  }

  // 2. Set up event stream listener + periodic heartbeat (25s fallback)
  final controller = StreamController<List<AdminOrderModel>>();

  final sub = socketService.orderEvents.listen((_) async {
    try {
      lastOrders = await fetchActive();
      if (!controller.isClosed) controller.add(lastOrders);
    } catch (e) {
      debugPrint('KDS real-time update error: $e');
    }
  });

  final timer = Timer.periodic(const Duration(seconds: 25), (_) async {
    try {
      lastOrders = await fetchActive();
      if (!controller.isClosed) controller.add(lastOrders);
    } catch (e) {
      debugPrint('KDS periodic heartbeat error: $e');
    }
  });

  ref.onDispose(() {
    sub.cancel();
    timer.cancel();
    controller.close();
  });

  yield* controller.stream;
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
