import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/order_model.dart';
import '../services/order_service.dart';
import '../services/socket_service.dart';

final orderServiceProvider = Provider<OrderService>((ref) => OrderService());

final userOrdersProvider = FutureProvider.family<List<OrderModel>, String?>((ref, status) async {
  final service = ref.watch(orderServiceProvider);
  return await service.getOrders(status: status);
});

final orderDetailProvider = FutureProvider.family<OrderModel, String>((ref, id) async {
  final service = ref.watch(orderServiceProvider);
  final socket = SocketService();

  await socket.connect();
  socket.joinOrder(id);
  final unbind = socket.onOrderStatusUpdated((payload) {
    if (payload['orderId'] == id || payload['orderNumber'] == id) {
      ref.invalidateSelf();
    }
  });

  ref.onDispose(() {
    unbind();
    socket.leaveOrder(id);
  });

  return await service.getOrderById(id);
});
