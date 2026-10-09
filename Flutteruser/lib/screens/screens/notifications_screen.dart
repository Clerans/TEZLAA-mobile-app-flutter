import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/notification_model.dart';
import '../../services/notification_service.dart';
import '../../widgets/empty_state.dart';

final notificationsListProvider = FutureProvider<List<NotificationModel>>((ref) async {
  return await NotificationService().getNotifications();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsListProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              try {
                await NotificationService().markAllAsRead();
                ref.invalidate(notificationsListProvider);
              } catch (_) {}
            },
            child: const Text('Mark all read', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      body: SafeArea(
        child: notificationsAsync.when(
          data: (notifications) {
            if (notifications.isEmpty) {
              return EmptyState(
                title: 'No Notifications',
                description: 'We will notify you here about order status updates and fresh daily specials.',
                icon: LucideIcons.bell,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(18),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final notif = notifications[idx];
                final formattedDate = DateFormat('MMM d, h:mm a').format(notif.createdAt);

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: notif.isRead ? Colors.white : AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: notif.isRead ? AppColors.neutral200 : AppColors.primaryLight),
                    boxShadow: const [
                      BoxShadow(
                        color: Color.fromRGBO(15, 23, 42, 0.04),
                        offset: Offset(0, 2),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: notif.isRead ? AppColors.neutral100 : AppColors.primaryMuted,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            notif.type == 'ORDER' ? LucideIcons.shoppingBag : LucideIcons.bell,
                            size: 18,
                            color: notif.isRead ? AppColors.neutral600 : AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    notif.title,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.w800,
                                      color: AppColors.neutral900,
                                    ),
                                  ),
                                ),
                                Text(
                                  formattedDate,
                                  style: const TextStyle(fontSize: 11, color: AppColors.neutral400),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              notif.message,
                              style: const TextStyle(fontSize: 13, color: AppColors.neutral600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (_, __) => const Center(child: Text('Failed to load notifications')),
        ),
      ),
    );
  }
}
