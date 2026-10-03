import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/admin_providers.dart';
import '../settings/admin_settings_screen.dart';

class AdminManagementHubScreen extends ConsumerWidget {
  const AdminManagementHubScreen({super.key});

  void _showComingSoon(BuildContext context, String feature) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(feature, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
        content: Text(
          'Manage $feature rules, campaigns, and configurations dynamically via TEZLAA Cloud Operations.',
          style: const TextStyle(fontSize: 13, color: AppColors.neutral600),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header
              const Text(
                'Management Hub',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 18),
              // 2. Section: Marketing & Loyalty
              _buildSectionTitle('MARKETING & LOYALTY PROGRAM'),
              _buildMenuCard([
                _HubItem(
                  icon: LucideIcons.award,
                  iconColor: const Color(0xFFD97706),
                  iconBg: const Color(0xFFFEF3C7),
                  title: 'TEZLAA Circle Loyalty',
                  subtitle: 'Customer point balances & manual adjustments',
                  onTap: () => _showComingSoon(context, 'TEZLAA Circle Loyalty'),
                ),
                _HubItem(
                  icon: LucideIcons.gift,
                  iconColor: const Color(0xFF10B981),
                  iconBg: const Color(0xFFD1FAE5),
                  title: 'Rewards Catalog',
                  subtitle: 'Configure redeemable vouchers & complimentary items',
                  onTap: () => _showComingSoon(context, 'Rewards Catalog'),
                ),
                _HubItem(
                  icon: LucideIcons.tag,
                  iconColor: const Color(0xFF8B5CF6),
                  iconBg: const Color(0xFFEDE9FE),
                  title: 'Promotions & Banners',
                  subtitle: 'Manage seasonal discounts & campaign banners',
                  onTap: () => _showComingSoon(context, 'Promotions & Banners'),
                ),
                _HubItem(
                  icon: LucideIcons.ticket,
                  iconColor: const Color(0xFFEC4899),
                  iconBg: const Color(0xFFFCE7F3),
                  title: 'Coupons & Promo Codes',
                  subtitle: 'Create discount codes, limits & expiry dates',
                  onTap: () => _showComingSoon(context, 'Coupons & Promo Codes'),
                ),
              ]),
              const SizedBox(height: 20),
              // 3. Section: System & Communications
              _buildSectionTitle('SYSTEM & COMMUNICATIONS'),
              _buildMenuCard([
                _HubItem(
                  icon: LucideIcons.bell,
                  iconColor: const Color(0xFF0284C7),
                  iconBg: const Color(0xFFE0F2FE),
                  title: 'Notifications Feed',
                  subtitle: 'View customer and operational notification stream',
                  onTap: () => _showComingSoon(context, 'Notifications Feed'),
                ),
                _HubItem(
                  icon: LucideIcons.settings,
                  iconColor: const Color(0xFF475569),
                  iconBg: const Color(0xFFF1F5F9),
                  title: 'Terminal Settings',
                  subtitle: 'App preferences, sound chimes & staff profile',
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AdminSettingsScreen()),
                    );
                  },
                ),
              ]),
              const SizedBox(height: 24),
              // 4. Red Sign Out Button
              InkWell(
                onTap: () async {
                  await ref.read(adminAuthProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/admin-login');
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFECEB),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: const [
                      Icon(LucideIcons.logOut, size: 18, color: Color(0xFFEF4444)),
                      SizedBox(width: 8),
                      Text(
                        'Sign Out of Admin Terminal',
                        style: TextStyle(
                          color: Color(0xFFEF4444),
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Center(
                child: Text(
                  'TEZLAA Admin Mobile OS v1.0.0 • Production Build',
                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: Color(0xFF94A3B8),
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildMenuCard(List<_HubItem> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(15, 23, 42, 0.04),
            offset: Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: List.generate(items.length, (idx) {
            final item = items[idx];
            return Column(
              children: [
                if (idx > 0) const Divider(height: 1, color: Color(0xFFF1F5F9)),
                ListTile(
                  leading: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: item.iconBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Icon(item.icon, size: 20, color: item.iconColor),
                    ),
                  ),
                  title: Text(
                    item.title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  subtitle: Text(
                    item.subtitle,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  trailing: const Icon(LucideIcons.chevronRight, size: 16, color: Color(0xFFCBD5E1)),
                  onTap: item.onTap,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _HubItem {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _HubItem({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });
}
