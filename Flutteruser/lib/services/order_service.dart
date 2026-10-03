import 'package:dio/dio.dart';
import '../core/constants/api_endpoints.dart';
import '../models/order_model.dart';
import 'api_client.dart';

class OrderService {
  final ApiClient _client = ApiClient();

  Future<Map<String, dynamic>> validateCart({
    String? branchId,
    required String orderType,
    required List<Map<String, dynamic>> items,
  }) async {
    final res = await _client.post(ApiEndpoints.validateCart, data: {
      if (branchId != null) 'branchId': branchId,
      'orderType': orderType,
      'items': items,
    });
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }

  Future<OrderModel> placeOrder({
    required String orderType,
    required String branchId,
    String? addressId,
    String? deliveryInstructions,
    String? customerNotes,
    String? couponCode,
    String? rewardId,
    String? idempotencyKey,
    required String paymentMethod,
    required List<Map<String, dynamic>> items,
  }) async {
    final res = await _client.post(
      ApiEndpoints.orders,
      data: {
        'orderType': orderType,
        'branchId': branchId,
        if (addressId != null) 'addressId': addressId,
        if (deliveryInstructions != null) 'deliveryInstructions': deliveryInstructions,
        if (customerNotes != null) 'customerNotes': customerNotes,
        if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
        if (rewardId != null && rewardId.isNotEmpty) 'rewardId': rewardId,
        if (idempotencyKey != null && idempotencyKey.isNotEmpty) 'idempotencyKey': idempotencyKey,
        'paymentMethod': paymentMethod,
        'items': items,
      },
      options: idempotencyKey != null && idempotencyKey.isNotEmpty
          ? Options(headers: {'Idempotency-Key': idempotencyKey})
          : null,
    );
    final data = res.data['data'] ?? res.data;
    return OrderModel.fromJson(data);
  }

  Future<List<OrderModel>> getOrders({String? status}) async {
    final Map<String, dynamic> params = {};
    if (status != null && status.isNotEmpty && status != 'ALL') {
      params['status'] = status;
    }
    final res = await _client.get(ApiEndpoints.orders, queryParameters: params);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((o) => OrderModel.fromJson(o)).toList();
  }

  Future<OrderModel> getOrderById(String id) async {
    final res = await _client.get(ApiEndpoints.orderDetail(id));
    final data = res.data['data'] ?? res.data;
    return OrderModel.fromJson(data);
  }

  Future<OrderModel> cancelOrder(String id) async {
    final res = await _client.post(ApiEndpoints.cancelOrder(id));
    final data = res.data['data'] ?? res.data;
    return OrderModel.fromJson(data);
  }

  Future<Map<String, dynamic>> getReorderData(String id) async {
    final res = await _client.post(ApiEndpoints.reorder(id));
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }
}
