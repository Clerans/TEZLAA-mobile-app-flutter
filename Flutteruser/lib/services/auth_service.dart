import '../core/constants/api_endpoints.dart';
import '../models/user_model.dart';
import 'api_client.dart';
import 'storage_service.dart';

class AuthService {
  final ApiClient _client = ApiClient();
  final StorageService _storage = StorageService();

  Future<UserModel> login({required String email, required String password}) async {
    final res = await _client.post(ApiEndpoints.login, data: {
      'email': email.trim().toLowerCase(),
      'password': password,
    });

    final data = res.data['data'] ?? res.data;
    final token = data['token'] ?? data['accessToken'];
    final userJson = data['user'] ?? data;

    if (token != null) {
      await _storage.saveTokens(accessToken: token);
    }

    return UserModel.fromJson(userJson);
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    final res = await _client.post(ApiEndpoints.register, data: {
      'name': name.trim(),
      'email': email.trim().toLowerCase(),
      'password': password,
      if (phone != null && phone.isNotEmpty) 'phone': phone.trim(),
    });

    final data = res.data['data'] ?? res.data;
    final token = data['token'] ?? data['accessToken'];
    final userJson = data['user'] ?? data;

    if (token != null) {
      await _storage.saveTokens(accessToken: token);
    }

    return UserModel.fromJson(userJson);
  }

  Future<void> forgotPassword(String email) async {
    await _client.post(ApiEndpoints.forgotPassword, data: {
      'email': email.trim().toLowerCase(),
    });
  }

  Future<void> verifyOtp({required String email, required String otp}) async {
    await _client.post(ApiEndpoints.verifyOtp, data: {
      'email': email.trim().toLowerCase(),
      'otp': otp.trim(),
    });
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    await _client.post(ApiEndpoints.resetPassword, data: {
      'email': email.trim().toLowerCase(),
      'otp': otp.trim(),
      'password': newPassword,
    });
  }

  Future<UserModel> getCurrentUser() async {
    final res = await _client.get(ApiEndpoints.me);
    final data = res.data['data'] ?? res.data;
    return UserModel.fromJson(data);
  }

  Future<UserModel> updateProfile({String? name, String? phone}) async {
    final res = await _client.put(ApiEndpoints.updateProfile, data: {
      if (name != null) 'name': name.trim(),
      if (name != null) 'fullName': name.trim(),
      if (phone != null) 'phone': phone.trim(),
    });
    final data = res.data['data'] ?? res.data;
    return UserModel.fromJson(data);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _client.post(ApiEndpoints.changePassword, data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<void> logout() async {
    await _storage.clearTokens();
  }
}
