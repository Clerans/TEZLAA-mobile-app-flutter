import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../../services/storage_service.dart';

class AdminApiClient {
  late final Dio dio;
  final AdminStorageService _storage = AdminStorageService();

  AdminApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            await _storage.clear();
          }
          return handler.next(error);
        },
      ),
    );
  }
}
