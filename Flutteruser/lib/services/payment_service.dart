import '../core/constants/api_endpoints.dart';
import 'api_client.dart';

class PaymentService {
  final ApiClient _client = ApiClient();

  Future<Map<String, dynamic>> createPaymentIntent(String orderId) async {
    final res = await _client.post(ApiEndpoints.createPaymentIntent, data: {
      'orderId': orderId,
    });
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPaymentStatus(String orderId) async {
    final res = await _client.get('/payments/order/$orderId/status');
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> retryPayment(String orderId) async {
    final res = await _client.post('/payments/order/$orderId/retry');
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }
}
