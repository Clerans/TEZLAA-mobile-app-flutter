import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/order_provider.dart';
import '../../widgets/order_timeline.dart';
import '../../widgets/tezlaa_button.dart';

class OrderTrackingScreen extends ConsumerWidget {
  final String orderId;
  final String? orderNumber;

  const OrderTrackingScreen({
    super.key,
    required this.orderId,
    this.orderNumber,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Live Order Tracking'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: orderAsync.when(
        data: (order) {
          final isDelivery = order.orderType == 'DELIVERY';
          final status = order.status;
          final isCompleted = status == 'DELIVERED' || status == 'PICKED_UP';

          String bannerTag;
          String bannerSub;

          switch (status) {
            case 'DELIVERED':
            case 'PICKED_UP':
              bannerTag = 'ORDER COMPLETED';
              bannerSub = 'Your order has been completed. Enjoy your meal!';
              break;
            case 'OUT_FOR_DELIVERY':
              bannerTag = 'OUT FOR DELIVERY';
              bannerSub = 'Rider is on the way to your doorstep!';
              break;
            case 'READY':
            case 'READY_FOR_PICKUP':
              bannerTag = isDelivery ? 'ORDER READY' : 'READY FOR PICKUP';
              bannerSub = isDelivery ? 'Packed and ready for rider dispatch' : 'Your order is ready at the café counter!';
              break;
            case 'PREPARING':
              bannerTag = 'KITCHEN PREPARING';
              bannerSub = 'Freshly brewing espresso & preparing meals';
              break;
            case 'CONFIRMED':
              bannerTag = 'ORDER CONFIRMED';
              bannerSub = 'Accepted by café barista! Preparing to craft...';
              break;
            case 'PENDING':
              bannerTag = 'ORDER PLACED';
              bannerSub = 'Waiting for café barista to confirm...';
              break;
            case 'CANCELLED':
              bannerTag = 'ORDER CANCELLED';
              bannerSub = 'This order has been cancelled.';
              break;
            default:
              bannerTag = 'LIVE ORDER TRACKING';
              bannerSub = 'Tracking live updates from TEZLAA kitchen';
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
                        // 1. Header Banner
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: AppColors.neutral900,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: const [
                              BoxShadow(
                                color: Color.fromRGBO(15, 23, 42, 0.15),
                                offset: Offset(0, 4),
                                blurRadius: 10,
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(LucideIcons.sparkles, size: 14, color: Colors.white),
                                    const SizedBox(width: 6),
                                    Text(
                                      bannerTag,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                order.orderNumber,
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'serif',
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                bannerSub,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF94A3B8),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        // 2. Live Progress Timeline Card
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Live Progress',
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.neutral900,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Row(
                                      children: const [
                                        CircleAvatar(radius: 3, backgroundColor: AppColors.green),
                                        SizedBox(width: 5),
                                        Text(
                                          'Live Sync',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.green,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              OrderTimelineWidget(
                                status: order.status,
                                orderType: order.orderType,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        // 3. Destination Info
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                isDelivery ? 'Delivery Address' : 'Pickup Location',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.neutral900,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Icon(
                                    isDelivery ? LucideIcons.mapPin : LucideIcons.building2,
                                    size: 18,
                                    color: AppColors.primary,
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          isDelivery
                                              ? (order.address?.label ?? 'Selected Address')
                                              : (order.branch?.name ?? 'TEZLAA Café'),
                                          style: const TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.neutral900,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          isDelivery
                                              ? '${order.address?.addressLine1 ?? ''}, ${order.address?.city ?? ''}'
                                              : (order.branch?.address ?? 'No 450, Kaduwela Road, Malabe'),
                                          style: const TextStyle(fontSize: 12, color: AppColors.neutral500),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        // 4. Cafe Contact
                        if (order.branch != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.neutral200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(LucideIcons.store, size: 18, color: AppColors.primary),
                                    const SizedBox(width: 8),
                                    Text(
                                      order.branch!.name,
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(order.branch!.address, style: const TextStyle(fontSize: 12, color: AppColors.neutral500)),
                                const SizedBox(height: 10),
                                InkWell(
                                  onTap: () => launchUrl(Uri.parse('tel:${order.branch!.phone}')),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryMuted,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(LucideIcons.phone, size: 14, color: AppColors.primary),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Call Café: ${order.branch!.phone}',
                                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 120),
                      ],
                    ),
                  ),
                ),
                // Sticky Bottom Actions
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
                      InkWell(
                        onTap: () => context.push('/order-detail?id=${order.id}'),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: AppColors.neutral100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(LucideIcons.receipt, size: 16, color: AppColors.neutral900),
                              SizedBox(width: 8),
                              Text(
                                'View Receipt & Summary',
                                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      TezlaaButton(
                        title: 'Back to Home',
                        onPress: () => context.go('/home'),
                        variant: isCompleted ? TezlaaButtonVariant.outline : TezlaaButtonVariant.primary,
                        size: TezlaaButtonSize.lg,
                        width: double.infinity,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (_, __) => const Center(child: Text('Order tracking unavailable')),
      ),
    );
  }
}
