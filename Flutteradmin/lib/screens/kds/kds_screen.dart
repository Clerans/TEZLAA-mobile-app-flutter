import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/admin_models.dart';
import '../../providers/admin_providers.dart';
import '../../services/admin_services.dart';

class KdsScreen extends ConsumerStatefulWidget {
  const KdsScreen({super.key});

  @override
  ConsumerState<KdsScreen> createState() => _KdsScreenState();
}

class _KdsScreenState extends ConsumerState<KdsScreen> {
  String _filter = 'ALL'; // ALL, PENDING, CONFIRMED, PREPARING, READY

  Future<void> _updateStatus(String orderId, String nextStatus) async {
    try {
      await AdminOrderService().updateOrderStatus(orderId, nextStatus);
      ref.invalidate(kdsOrdersProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order updated to ${nextStatus.replaceAll('_', ' ')}'),
            backgroundColor: AppColors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      String msg = 'Failed to update status';
      if (e is DioException && e.response?.data != null) {
        msg = e.response?.data['message']?.toString() ?? msg;
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg), backgroundColor: AppColors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final kdsAsync = ref.watch(kdsOrdersProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(LucideIcons.flame, size: 16, color: Colors.white),
            ),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'KDS LIVE TERMINAL',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, color: Colors.white, size: 18),
            onPressed: () => ref.invalidate(kdsOrdersProvider),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status Filter Tabs
            Container(
              color: const Color(0xFF1E293B),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('ALL', 'All Live'),
                    _buildFilterChip('PENDING', 'New (Pending)'),
                    _buildFilterChip('CONFIRMED', 'Accepted'),
                    _buildFilterChip('PREPARING', 'In Kitchen'),
                    _buildFilterChip('READY', 'Ready for Pickup'),
                  ],
                ),
              ),
            ),
            // Orders Grid / List
            Expanded(
              child: kdsAsync.when(
                data: (orders) {
                  final filtered = _filter == 'ALL'
                      ? orders
                      : orders.where((o) => o.status == _filter).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(LucideIcons.checkCircle2, size: 48, color: AppColors.green),
                          SizedBox(height: 12),
                          Text(
                            'All Orders Clear!',
                            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Waiting for new orders from TEZLAA Cloud...',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(14),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, idx) {
                      final order = filtered[idx];
                      return _buildKdsCard(order);
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                error: (err, __) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.alertTriangle, size: 48, color: AppColors.amber),
                      const SizedBox(height: 12),
                      const Text(
                        'KDS Connection Interrupted',
                        style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        err.toString().contains('429')
                            ? 'Rate limit exceeded. Automatic reconnect in progress...'
                            : 'Unable to reach TEZLAA Cloud. Reconnecting...',
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => ref.invalidate(kdsOrdersProvider),
                        icon: const Icon(LucideIcons.refreshCw, size: 16),
                        label: const Text('Retry Connection'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _filter == key;
    return GestureDetector(
      onTap: () => setState(() => _filter = key),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFF334155),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildKdsCard(AdminOrderModel order) {
    Color headerBg;
    Color headerText = Colors.white;
    String actionTitle = '';
    String nextStatus = '';

    switch (order.status) {
      case 'PENDING':
        headerBg = const Color(0xFFD97706); // Amber
        actionTitle = 'Accept & Confirm Order';
        nextStatus = 'CONFIRMED';
        break;
      case 'CONFIRMED':
        headerBg = const Color(0xFF2563EB); // Blue
        actionTitle = 'Start Brewing / Kitchen';
        nextStatus = 'PREPARING';
        break;
      case 'PREPARING':
        headerBg = const Color(0xFFEA580C); // Orange
        actionTitle = order.orderType == 'PICKUP' ? 'Mark Ready for Pickup' : 'Mark Order Ready';
        nextStatus = 'READY';
        break;
      case 'READY':
        headerBg = const Color(0xFF16A34A); // Green
        actionTitle = order.orderType == 'DELIVERY'
            ? 'Hand to Courier / Dispatch'
            : 'Customer Picked Up';
        nextStatus = order.orderType == 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'PICKED_UP';
        break;
      case 'READY_FOR_PICKUP':
        headerBg = const Color(0xFF059669); // Emerald
        actionTitle = 'Complete Handover (Picked Up)';
        nextStatus = 'PICKED_UP';
        break;
      case 'OUT_FOR_DELIVERY':
        headerBg = const Color(0xFF7C3AED); // Purple
        actionTitle = 'Mark Order Delivered';
        nextStatus = 'DELIVERED';
        break;
      default:
        headerBg = const Color(0xFF475569);
        actionTitle = order.orderType == 'DELIVERY' ? 'Complete Delivery' : 'Complete Pickup';
        nextStatus = order.orderType == 'DELIVERY' ? 'DELIVERED' : 'PICKED_UP';
        break;
    }

    final minutesAgo = DateTime.now().difference(order.createdAt).inMinutes;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF334155)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(0, 0, 0, 0.25),
            offset: Offset(0, 4),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: headerBg,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(17)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      order.orderNumber,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: headerText,
                        fontFamily: 'serif',
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        order.orderType,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    const Icon(LucideIcons.clock, size: 14, color: Colors.white),
                    const SizedBox(width: 4),
                    Text(
                      '${minutesAgo}m ago',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Customer & Destination
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.customerName ?? 'Guest Gourmet',
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                ),
                Text(
                  order.paymentMethod == 'CARD' ? 'PAID (ONLINE)' : 'COD (PAY AT DOOR)',
                  style: TextStyle(
                    color: order.paymentMethod == 'CARD' ? AppColors.green : const Color(0xFFFBBF24),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF334155)),
          // Items List
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: order.items.map((item) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                          child: Text(
                            '${item.quantity}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700),
                            ),
                            if (item.variantName != null)
                              Text(
                                'Size: ${item.variantName}',
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                              ),
                            if (item.addons.isNotEmpty)
                              Text(
                                '+ ${item.addons.join(', ')}',
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          if (order.customerNotes != null && order.customerNotes!.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.alertCircle, size: 14, color: AppColors.amber),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'Note: ${order.customerNotes}',
                        style: const TextStyle(color: Color(0xFFFDE68A), fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 8),
          // Action Button
          Padding(
            padding: const EdgeInsets.all(14),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => _updateStatus(order.id, nextStatus),
                style: ElevatedButton.styleFrom(
                  backgroundColor: headerBg,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                child: Text(
                  actionTitle,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
