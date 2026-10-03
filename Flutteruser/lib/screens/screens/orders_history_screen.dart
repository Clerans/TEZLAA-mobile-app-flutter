import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/order_provider.dart';
import '../../widgets/empty_state.dart';

class OrdersHistoryScreen extends ConsumerWidget {
  const OrdersHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(userOrdersProvider(null));

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('My Orders'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: ordersAsync.when(
          data: (orders) {
            if (orders.isEmpty) {
              return EmptyState(
                title: 'No Orders Yet',
                description: 'Explore our artisan coffees and freshly baked sourdough treats.',
                actionTitle: 'Start Ordering',
                onAction: () => context.go('/menu'),
                icon: LucideIcons.shoppingBag,
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final order = orders[idx];
                final formattedDate = DateFormat('MMM d, yyyy • h:mm a').format(order.createdAt);

                Color statusColor;
                switch (order.status) {
                  case 'DELIVERED':
                  case 'PICKED_UP':
                    statusColor = AppColors.green;
                    break;
                  case 'CANCELLED':
                    statusColor = AppColors.red;
                    break;
                  case 'OUT_FOR_DELIVERY':
                  case 'READY':
                    statusColor = AppColors.blue;
                    break;
                  default:
                    statusColor = AppColors.primary;
                    break;
                }

                return InkWell(
                  onTap: () => context.push('/order-detail?id=${order.id}'),
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.neutral200),
                      boxShadow: const [
                        BoxShadow(
                          color: Color.fromRGBO(15, 23, 42, 0.04),
                          offset: Offset(0, 2),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order.orderNumber,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'serif',
                                color: AppColors.neutral900,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                order.status.replaceAll('_', ' '),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: statusColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formattedDate,
                          style: const TextStyle(fontSize: 12, color: AppColors.neutral500),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          order.items.map((i) => '${i.quantity}x ${i.product?.name ?? 'Item'}').join(', '),
                          style: const TextStyle(fontSize: 13, color: AppColors.neutral700),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Rs. ${order.grandTotal.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primary),
                            ),
                            const Row(
                              children: [
                                Text(
                                  'Details',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary),
                                ),
                                SizedBox(width: 2),
                                Icon(LucideIcons.chevronRight, size: 14, color: AppColors.primary),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (_, __) => const Center(child: Text('Failed to load orders')),
        ),
      ),
    );
  }
}
