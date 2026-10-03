import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/loyalty_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/loyalty_service.dart';
import '../../widgets/tezlaa_button.dart';

final loyaltyRewardsProvider = FutureProvider<List<LoyaltyRewardModel>>((ref) async {
  return await LoyaltyService().getRewards();
});

final loyaltyAccountProvider = FutureProvider<LoyaltyAccountModel>((ref) async {
  return await LoyaltyService().getAccount();
});

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final rewardsAsync = ref.watch(loyaltyRewardsProvider);
    final accountAsync = ref.watch(loyaltyAccountProvider);

    final points = accountAsync.asData?.value.points ?? user?.loyaltyPoints ?? 0;
    final tier = accountAsync.asData?.value.tier ?? user?.loyaltyTier ?? 'BRONZE';

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'TEZLAA Circle',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'serif',
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 2),
              const Text(
                'Earn points with every artisan sip & bite',
                style: TextStyle(fontSize: 13, color: AppColors.neutral500),
              ),
              const SizedBox(height: 18),
              // Loyalty Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: const [
                    BoxShadow(
                      color: Color.fromRGBO(15, 23, 42, 0.2),
                      offset: Offset(0, 8),
                      blurRadius: 18,
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(LucideIcons.sparkles, color: AppColors.gold, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              '$tier TIER MEMBER',
                              style: const TextStyle(
                                color: AppColors.gold,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            'VIP CLUB',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      '$points',
                      style: const TextStyle(
                        fontFamily: 'serif',
                        fontSize: 44,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const Text(
                      'Available Circle Points',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: (points % 500) / 500,
                        backgroundColor: Colors.white.withValues(alpha: 0.15),
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${500 - (points % 500)} points to unlock next Gold reward',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 26),
              // Rewards Section
              const Text(
                'Redeemable Rewards',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'serif',
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 14),
              rewardsAsync.when(
                data: (rewards) {
                  if (rewards.isEmpty) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Text('No active rewards currently. Check back soon!'),
                      ),
                    );
                  }

                  return Column(
                    children: rewards.map((r) {
                      final canRedeem = points >= r.pointsRequired;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.neutral50,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.neutral200),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: BoxDecoration(
                                color: canRedeem ? AppColors.primaryMuted : AppColors.neutral100,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Center(
                                child: Icon(
                                  LucideIcons.gift,
                                  size: 24,
                                  color: canRedeem ? AppColors.primary : AppColors.neutral400,
                                ),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r.title,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.neutral900,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    r.description,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.neutral500,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${r.pointsRequired} Points',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            TezlaaButton(
                              title: 'Redeem',
                              size: TezlaaButtonSize.sm,
                              disabled: !canRedeem,
                              onPress: () async {
                                try {
                                  await LoyaltyService().redeemReward(r.id);
                                  ref.read(authProvider.notifier).refreshProfile();
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('${r.title} voucher added to your account!'),
                                        backgroundColor: AppColors.green,
                                      ),
                                    );
                                  }
                                } catch (_) {}
                              },
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
                error: (_, __) => const Text('Unable to load rewards catalogue'),
              ),
              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }
}
