import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/order_provider.dart';
import '../../services/order_service.dart';
import '../../widgets/tezlaa_button.dart';

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Order Summary'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: orderAsync.when(
        data: (order) {
          final isCompleted = order.status == 'DELIVERED' || order.status == 'PICKED_UP';
          final isCancellable = order.status == 'PENDING' || order.status == 'CONFIRMED';
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
            case 'READY_FOR_PICKUP':
              statusColor = AppColors.blue;
              break;
            default:
              statusColor = AppColors.primary;
              break;
          }

          return SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                    child: Column(
                      children: [
                        // 1. Order Number & Status Card
                        _buildCard(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.orderNumber,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      fontFamily: 'serif',
                                      color: AppColors.neutral900,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Placed on $formattedDate',
                                    style: const TextStyle(fontSize: 12, color: AppColors.neutral500),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  order.status.replaceAll('_', ' '),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: statusColor,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        // 2. Items List
                        _buildCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Items Ordered',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                              ),
                              const SizedBox(height: 12),
                              ...order.items.map((item) {
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 6),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              '${item.quantity}x ${item.product?.name ?? 'Artisan Item'}',
                                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                                            ),
                                            if (item.variant != null)
                                              Text('Size: ${item.variant!.name}', style: const TextStyle(fontSize: 12, color: AppColors.neutral500)),
                                            if (item.addons.isNotEmpty)
                                              Text('+ ${item.addons.map((a) => a.name).join(', ')}', style: const TextStyle(fontSize: 11, color: AppColors.neutral500)),
                                          ],
                                        ),
                                      ),
                                      Text('Rs. ${item.totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        // 3. Payment Breakdown
                        _buildCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Payment Breakdown', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Subtotal', style: TextStyle(fontSize: 13, color: AppColors.neutral500)),
                                  Text('Rs. ${order.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Delivery Fee', style: TextStyle(fontSize: 13, color: AppColors.neutral500)),
                                  Text(order.deliveryFee == 0 ? 'FREE' : 'Rs. ${order.deliveryFee.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                ],
                              ),
                              if (order.discount > 0) ...[
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Discount (${order.couponCode ?? ''})', style: const TextStyle(fontSize: 13, color: AppColors.green)),
                                    Text('-Rs. ${order.discount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.green)),
                                  ],
                                ),
                              ],
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 10),
                                child: Divider(height: 1, color: AppColors.neutral100),
                              ),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total Amount', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                                  Text('Rs. ${order.grandTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 100),
                      ],
                    ),
                  ),
                ),
                // Bottom Actions
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                    boxShadow: [
                      BoxShadow(
                        color: Color.fromRGBO(15, 23, 42, 0.08),
                        offset: Offset(0, -4),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      if (!isCompleted && order.status != 'CANCELLED') ...[
                        TezlaaButton(
                          title: 'Track Live Order',
                          onPress: () => context.push('/order-tracking?orderId=${order.id}&orderNumber=${order.orderNumber}'),
                          size: TezlaaButtonSize.lg,
                          width: double.infinity,
                        ),
                        const SizedBox(height: 8),
                      ],
                      if (isCancellable) ...[
                        InkWell(
                          onTap: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (ctx) => AlertDialog(
                                title: const Text('Cancel Order'),
                                content: const Text('Are you sure you want to cancel this order?'),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
                                  TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Yes, Cancel', style: TextStyle(color: AppColors.red))),
                                ],
                              ),
                            );
                            if (confirm == true) {
                              try {
                                await OrderService().cancelOrder(order.id);
                                ref.invalidate(orderDetailProvider(order.id));
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Order cancelled successfully'), backgroundColor: AppColors.green),
                                  );
                                }
                              } catch (_) {
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Unable to cancel order at this stage'), backgroundColor: AppColors.red),
                                  );
                                }
                              }
                            }
                          },
                          child: const Padding(
                            padding: EdgeInsets.symmetric(vertical: 6),
                            child: Text('Cancel Order', style: TextStyle(color: AppColors.red, fontSize: 13, fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (_, __) => const Center(child: Text('Order summary unavailable')),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.neutral200),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(15, 23, 42, 0.04),
            offset: Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: child,
    );
  }
}
