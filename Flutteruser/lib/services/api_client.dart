import 'package:dio/dio.dart';
import '../core/constants/api_endpoints.dart';
import 'storage_service.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
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
          final token = await StorageService().getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException e, handler) async {
          final isAuthEndpoint = e.requestOptions.path.contains('/auth/login') ||
              e.requestOptions.path.contains('/auth/refresh') ||
              e.requestOptions.path.contains('/auth/register');

          final alreadyRetried = e.requestOptions.extra['retry_count'] != null;

          if (e.response?.statusCode == 401 && !isAuthEndpoint && !alreadyRetried) {
            final storage = StorageService();
            final refreshToken = await storage.getRefreshToken();

            if (refreshToken != null && refreshToken.isNotEmpty) {
              try {
                // Use a bare Dio instance to prevent infinite recursive interception
                final refreshDio = Dio(BaseOptions(baseUrl: ApiEndpoints.baseUrl));
                final refreshRes = await refreshDio.post(
                  ApiEndpoints.refreshToken,
                  data: {'refreshToken': refreshToken},
                );

                final data = refreshRes.data['data'] ?? refreshRes.data;
                final newAccessToken = data['accessToken'] ?? data['token'];
                final newRefreshToken = data['refreshToken'] ?? refreshToken;

                if (newAccessToken != null && newAccessToken.toString().isNotEmpty) {
                  await storage.saveTokens(
                    accessToken: newAccessToken.toString(),
                    refreshToken: newRefreshToken.toString(),
                  );

                  // Update failed request headers and retry
                  final requestOptions = e.requestOptions;
                  requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
                  requestOptions.extra['retry_count'] = 1;

                  final retryResponse = await dio.fetch(requestOptions);
                  return handler.resolve(retryResponse);
                }
              } catch (_) {
                await storage.clearTokens();
              }
            } else {
              await storage.clearTokens();
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.get(path, queryParameters: queryParameters, options: options);
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.post(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.patch(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.put(path, data: data, queryParameters: queryParameters, options: options);
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await dio.delete(path, data: data, queryParameters: queryParameters, options: options);
  }
}
