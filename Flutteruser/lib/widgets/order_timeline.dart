import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';

class OrderTimelineWidget extends StatelessWidget {
  final String status;
  final String orderType;

  const OrderTimelineWidget({
    super.key,
    required this.status,
    required this.orderType,
  });

  @override
  Widget build(BuildContext context) {
    final isDelivery = orderType == 'DELIVERY';
    final isCancelled = status == 'CANCELLED';

    if (isCancelled) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFEE2E2)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: Color(0xFFFEE2E2),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(LucideIcons.xCircle, size: 28, color: AppColors.red),
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order Cancelled',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.red,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'This order has been cancelled and is no longer being processed.',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF991B1B),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    int completedUpTo;
    int currentStep;

    switch (status) {
      case 'DELIVERED':
      case 'PICKED_UP':
        completedUpTo = 4;
        currentStep = 4;
        break;
      case 'OUT_FOR_DELIVERY':
      case 'READY_FOR_PICKUP':
      case 'READY':
        completedUpTo = 2;
        currentStep = 3;
        break;
      case 'PREPARING':
        completedUpTo = 1;
        currentStep = 2;
        break;
      case 'CONFIRMED':
        completedUpTo = 1;
        currentStep = 1;
        break;
      case 'PENDING':
      default:
        completedUpTo = 0;
        currentStep = 1;
        break;
    }

    final steps = [
      _TimelineStep(
        title: 'Order Placed',
        sub: 'Received & logged in café system',
        iconData: LucideIcons.fileCheck,
      ),
      _TimelineStep(
        title: 'Order Confirmed',
        sub: status == 'PENDING'
            ? 'Awaiting barista acceptance...'
            : 'Accepted & verified by café barista',
        iconData: status == 'PENDING' ? LucideIcons.clock : LucideIcons.checkCircle2,
      ),
      _TimelineStep(
        title: 'Artisan Kitchen Preparing',
        sub: 'Brewing espresso & baking fresh sourdough',
        iconData: LucideIcons.chefHat,
      ),
      _TimelineStep(
        title: isDelivery ? 'Out for Delivery' : 'Ready for Pickup',
        sub: isDelivery
            ? 'Rider dispatched to your doorstep'
            : 'Freshly packed at café counter',
        iconData: isDelivery ? LucideIcons.bike : LucideIcons.store,
      ),
      _TimelineStep(
        title: isDelivery ? 'Delivered to Doorstep' : 'Picked Up & Enjoyed',
        sub: 'Bon appétit from TEZLAA!',
        iconData: LucideIcons.home,
      ),
    ];

    return Column(
      children: List.generate(steps.length, (idx) {
        final step = steps[idx];
        final isDone = idx <= completedUpTo && !(status == 'PENDING' && idx == 1);
        final isCurrent = idx == currentStep;

        Color iconBg;
        Color iconColor;
        Border? border;

        if (isDone) {
          iconBg = AppColors.primary;
          iconColor = Colors.white;
        } else if (isCurrent) {
          iconBg = AppColors.primaryMuted;
          iconColor = AppColors.primary;
          border = Border.all(color: AppColors.primary, width: 2);
        } else {
          iconBg = AppColors.neutral100;
          iconColor = AppColors.neutral400;
          border = Border.all(color: AppColors.neutral300, width: 1.5);
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: iconBg,
                    shape: BoxShape.circle,
                    border: border,
                  ),
                  child: Center(
                    child: Icon(step.iconData, size: 16, color: iconColor),
                  ),
                ),
                if (idx < steps.length - 1)
                  Container(
                    width: 2,
                    height: 34,
                    color: idx < completedUpTo ? AppColors.primary : AppColors.neutral200,
                    margin: const EdgeInsets.symmetric(vertical: 3),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 3, bottom: 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          step.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isCurrent
                                ? FontWeight.w800
                                : isDone
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                            color: isCurrent
                                ? AppColors.primary
                                : isDone
                                    ? AppColors.neutral900
                                    : AppColors.neutral400,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (isCurrent && status == 'PENDING' && idx == 1)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Waiting Staff',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFFD97706),
                              ),
                            ),
                          ),
                        if (isDone && idx == 1)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'Confirmed',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF16A34A),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      step.sub,
                      style: TextStyle(
                        fontSize: 12,
                        color: isCurrent ? AppColors.neutral600 : AppColors.neutral400,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _TimelineStep {
  final String title;
  final String sub;
  final IconData iconData;

  _TimelineStep({
    required this.title,
    required this.sub,
    required this.iconData,
  });
}
