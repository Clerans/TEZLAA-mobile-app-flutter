import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/constants/api_endpoints.dart';
import 'storage_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    final token = await StorageService().getAccessToken();

    _socket = io.io(
      ApiEndpoints.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': token ?? ''})
          .setQuery({'token': token ?? ''})
          .setExtraHeaders(token != null ? {'Authorization': 'Bearer $token'} : {})
          .build(),
    );

    _socket?.connect();

    _socket?.onConnect((_) {
      // Connected to TEZLAA live socket
    });

    _socket?.onDisconnect((_) {
      // Disconnected
    });
  }

  void joinOrder(String orderId) {
    _socket?.emit('join_order_room', orderId);
    _socket?.emit('join:order', {'orderId': orderId});
  }

  void leaveOrder(String orderId) {
    _socket?.emit('leave_order_room', orderId);
    _socket?.emit('leave:order', {'orderId': orderId});
  }

  void onOrderStatusUpdated(Function(Map<String, dynamic>) callback) {
    _socket?.on('order:status_updated', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      }
    });
    _socket?.on('order:status-updated', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      }
    });
    _socket?.on('order:updated', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      }
    });
  }

  void offOrderStatusUpdated() {
    _socket?.off('order:status_updated');
    _socket?.off('order:status-updated');
    _socket?.off('order:updated');
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
