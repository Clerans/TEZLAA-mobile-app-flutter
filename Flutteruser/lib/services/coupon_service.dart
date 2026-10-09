import '../core/constants/api_endpoints.dart';
import 'api_client.dart';

class CouponService {
  final ApiClient _client = ApiClient();

  Future<Map<String, dynamic>> validateCoupon({
    required String code,
    required double subtotal,
  }) async {
    final res = await _client.post(ApiEndpoints.validateCoupon, data: {
      'code': code.trim(),
      'subtotal': subtotal,
    });
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }
}
