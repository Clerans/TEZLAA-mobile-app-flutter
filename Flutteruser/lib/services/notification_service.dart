import '../core/constants/api_endpoints.dart';
import '../models/notification_model.dart';
import 'api_client.dart';

class NotificationService {
  final ApiClient _client = ApiClient();

  Future<List<NotificationModel>> getNotifications() async {
    final res = await _client.get(ApiEndpoints.notifications);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((n) => NotificationModel.fromJson(n)).toList();
  }

  Future<void> markAsRead(String id) async {
    await _client.patch(ApiEndpoints.markNotificationRead(id));
  }

  Future<void> markAllAsRead() async {
    await _client.patch(ApiEndpoints.markAllNotificationsRead);
  }
}
