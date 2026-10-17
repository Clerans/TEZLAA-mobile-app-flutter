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
          final isAuthEndpoint = error.requestOptions.path.contains('/auth/login') ||
              error.requestOptions.path.contains('/auth/refresh');
          final alreadyRetried = error.requestOptions.extra['retry_count'] != null;

          if (error.response?.statusCode == 401 && !isAuthEndpoint && !alreadyRetried) {
            final refreshToken = await _storage.getRefreshToken();
            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                final refreshDio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
                final refreshRes = await refreshDio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                final data = refreshRes.data['data'] ?? refreshRes.data;
                final newAccessToken = data['accessToken'] ?? data['token'];
                final newRefreshToken = data['refreshToken'] ?? refreshToken;

                if (newAccessToken != null && newAccessToken.toString().isNotEmpty) {
                  await _storage.saveToken(newAccessToken.toString());
                  await _storage.saveRefreshToken(newRefreshToken.toString());

                  final requestOptions = error.requestOptions;
                  requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                  requestOptions.extra['retry_count'] = 1;

                  final retryResponse = await dio.fetch(requestOptions);
                  return handler.resolve(retryResponse);
                }
              } catch (_) {
                await _storage.clear();
              }
            } else {
              await _storage.clear();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }
}
