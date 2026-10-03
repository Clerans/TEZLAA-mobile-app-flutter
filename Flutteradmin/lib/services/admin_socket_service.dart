import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/constants/api_constants.dart';
import 'storage_service.dart';

class AdminSocketService {
  static final AdminSocketService _instance = AdminSocketService._internal();
  factory AdminSocketService() => _instance;
  AdminSocketService._internal();

  io.Socket? _socket;
  final StreamController<Map<String, dynamic>> _orderEventController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get orderEvents => _orderEventController.stream;
  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect({String? branchId}) async {
    if (_socket != null && _socket!.connected) return;

    final token = await AdminStorageService().getToken();

    _socket = io.io(
      ApiConstants.socketUrl,
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
      debugPrint('AdminSocketService: Connected to TEZLAA Live Socket');
      _socket?.emit('join_kds', {'branchId': branchId});
      _socket?.emit('join:kds', {'branchId': branchId});
    });

    _socket?.on('order:created', (data) {
      if (data is Map<String, dynamic>) {
        _orderEventController.add(data);
      }
    });

    _socket?.on('order:new', (data) {
      if (data is Map<String, dynamic>) {
        _orderEventController.add(data);
      }
    });

    _socket?.on('order:status_updated', (data) {
      if (data is Map<String, dynamic>) {
        _orderEventController.add(data);
      }
    });

    _socket?.on('order:updated', (data) {
      if (data is Map<String, dynamic>) {
        _orderEventController.add(data);
      }
    });

    _socket?.onDisconnect((_) {
      debugPrint('AdminSocketService: Disconnected from live socket');
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
