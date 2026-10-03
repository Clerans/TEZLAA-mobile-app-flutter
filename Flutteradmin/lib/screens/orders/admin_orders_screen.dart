import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/admin_providers.dart';

class AdminOrdersScreen extends ConsumerStatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  ConsumerState<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends ConsumerState<AdminOrdersScreen> {
  String _selectedStatus = 'ALL';

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(adminOrdersListProvider(_selectedStatus));

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('All Orders'),
        backgroundColor: Colors.white,
        actions: [
          IconButton(
            tooltip: 'Live Kitchen Display (KDS)',
            icon: const Icon(LucideIcons.flame, size: 20, color: AppColors.primary),
            onPressed: () => context.push('/kds'),
          ),
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: () => ref.invalidate(adminOrdersListProvider(_selectedStatus)),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status Filter Scroll
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('ALL', 'All Orders'),
                    _buildFilterChip('PENDING', 'Pending'),
                    _buildFilterChip('CONFIRMED', 'Confirmed'),
                    _buildFilterChip('PREPARING', 'In Prep'),
                    _buildFilterChip('READY', 'Ready'),
                    _buildFilterChip('OUT_FOR_DELIVERY', 'Dispatched'),
                    _buildFilterChip('DELIVERED', 'Delivered'),
                    _buildFilterChip('CANCELLED', 'Cancelled'),
                  ],
                ),
              ),
            ),
            // Orders List
            Expanded(
              child: ordersAsync.when(
                data: (orders) {
                  if (orders.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(LucideIcons.shoppingBag, size: 40, color: AppColors.neutral400),
                          SizedBox(height: 10),
                          Text('No orders matching status filter', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.neutral600)),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: orders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, idx) {
                      final order = orders[idx];
                      final dateStr = DateFormat('MMM d, h:mm a').format(order.createdAt);

                      return InkWell(
                        onTap: () => context.push('/admin-order-detail?id=${order.id}'),
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.all(16),
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
                                      color: _getStatusColor(order.status).withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      order.status.replaceAll('_', ' '),
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: _getStatusColor(order.status),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(order.customerName ?? 'Guest', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                  Text(dateStr, style: const TextStyle(fontSize: 11, color: AppColors.neutral400)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                order.items.map((i) => '${i.quantity}x ${i.name}').join(', '),
                                style: const TextStyle(fontSize: 12, color: AppColors.neutral600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Rs. ${order.grandTotal.toStringAsFixed(0)}',
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primary),
                                  ),
                                  Row(
                                    children: [
                                      Text(order.orderType, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.neutral500)),
                                      const SizedBox(width: 4),
                                      const Icon(LucideIcons.chevronRight, size: 14, color: AppColors.neutral400),
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
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isSelected = _selectedStatus == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedStatus = key),
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.neutral100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.neutral700,
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'DELIVERED':
      case 'PICKED_UP':
        return AppColors.green;
      case 'CANCELLED':
        return AppColors.red;
      case 'OUT_FOR_DELIVERY':
      case 'READY':
        return AppColors.blue;
      case 'PREPARING':
        return AppColors.amber;
      default:
        return AppColors.primary;
    }
  }
}
