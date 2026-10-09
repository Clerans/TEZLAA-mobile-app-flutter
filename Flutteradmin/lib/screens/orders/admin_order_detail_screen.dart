import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/admin_models.dart';
import '../../providers/admin_providers.dart';
import '../../services/admin_services.dart';

final adminSingleOrderProvider = FutureProvider.family<AdminOrderModel, String>((ref, id) async {
  return await AdminOrderService().getOrderById(id);
});

class AdminOrderDetailScreen extends ConsumerWidget {
  final String orderId;

  const AdminOrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(adminSingleOrderProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Order Details'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: orderAsync.when(
        data: (order) {
          final dateStr = DateFormat('MMM d, yyyy • h:mm a').format(order.createdAt);

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Overview Card
                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              order.orderNumber,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'serif',
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryMuted,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                order.status.replaceAll('_', ' '),
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(dateStr, style: const TextStyle(fontSize: 12, color: AppColors.neutral500)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Customer & Delivery Info
                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Customer & Fulfillment', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 10),
                        _buildRow('Customer Name', order.customerName ?? 'Guest'),
                        _buildRow('Customer Phone', order.customerPhone ?? 'Not specified'),
                        _buildRow('Order Type', order.orderType),
                        if (order.deliveryAddress != null)
                          _buildRow('Delivery Address', order.deliveryAddress!),
                        _buildRow('Payment Method', order.paymentMethod == 'CARD' ? 'Card (PayHere)' : 'Cash on Delivery'),
                        _buildRow('Payment Status', order.paymentStatus),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Items Card
                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Ordered Items', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 10),
                        ...order.items.map((item) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('${item.quantity}x ${item.name}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                      if (item.variantName != null)
                                        Text('Size: ${item.variantName}', style: const TextStyle(fontSize: 12, color: AppColors.neutral500)),
                                      if (item.addons.isNotEmpty)
                                        Text('+ ${item.addons.join(', ')}', style: const TextStyle(fontSize: 11, color: AppColors.neutral500)),
                                    ],
                                  ),
                                ),
                                Text('Rs. ${item.totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                              ],
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  // Financial Breakdown
                  _buildCard(
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal', style: TextStyle(color: AppColors.neutral500)),
                            Text('Rs. ${order.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Delivery Fee', style: TextStyle(color: AppColors.neutral500)),
                            Text('Rs. ${order.deliveryFee.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          ],
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Divider(height: 1, color: AppColors.neutral100),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Grand Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                            Text('Rs. ${order.grandTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Quick Status Change Actions
                  const Text('Update Order State', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildStatusBtn(context, ref, 'CONFIRMED', 'Accept (Confirmed)', AppColors.blue),
                      _buildStatusBtn(context, ref, 'PREPARING', 'In Prep / Brewing', AppColors.amber),
                      _buildStatusBtn(context, ref, 'READY', 'Mark Ready', AppColors.green),
                      if (order.orderType == 'DELIVERY') ...[
                        _buildStatusBtn(context, ref, 'OUT_FOR_DELIVERY', 'Dispatched', AppColors.purple),
                        _buildStatusBtn(context, ref, 'DELIVERED', 'Delivered', AppColors.greenDark),
                      ] else ...[
                        _buildStatusBtn(context, ref, 'READY_FOR_PICKUP', 'Ready for Pickup', AppColors.purple),
                        _buildStatusBtn(context, ref, 'PICKED_UP', 'Picked Up (Complete)', AppColors.greenDark),
                      ],
                      _buildStatusBtn(context, ref, 'CANCELLED', 'Cancel Order', AppColors.red),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (_, __) => const Center(child: Text('Failed to load order detail')),
      ),
    );
  }

  Widget _buildStatusBtn(BuildContext context, WidgetRef ref, String status, String label, Color color) {
    return ElevatedButton(
      onPressed: () async {
        try {
          await AdminOrderService().updateOrderStatus(orderId, status);
          ref.invalidate(adminSingleOrderProvider(orderId));
          ref.invalidate(adminOrdersListProvider);
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Order updated to $label'), backgroundColor: AppColors.green),
            );
          }
        } catch (e) {
          String msg = 'Failed to update order status';
          if (e is DioException && e.response?.data != null) {
            msg = e.response?.data['message']?.toString() ?? msg;
          }
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(msg), backgroundColor: AppColors.red),
            );
          }
        }
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.12),
        foregroundColor: color,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
    );
  }

  Widget _buildRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
          Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
