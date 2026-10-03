import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;

    final name = user?.name ?? 'Guest Gourmet';
    final email = user?.email ?? 'Not logged in';

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Text(
                'My Profile',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'serif',
                  color: AppColors.neutral900,
                ),
              ),
              const SizedBox(height: 18),
              // User Card
              Container(
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
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        color: AppColors.primaryMuted,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'U',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppColors.neutral900,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            email,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.neutral500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    InkWell(
                      onTap: () => context.push('/edit-profile'),
                      child: const Icon(LucideIcons.edit2, size: 18, color: AppColors.primary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Menu Groups
              _buildSectionTitle('ACCOUNT & ORDERS'),
              _buildMenuCard([
                _MenuItem(
                  icon: LucideIcons.shoppingBag,
                  title: 'Order History',
                  onTap: () => context.push('/orders-history'),
                ),
                _MenuItem(
                  icon: LucideIcons.mapPin,
                  title: 'Saved Delivery Addresses',
                  onTap: () => context.push('/addresses'),
                ),
                _MenuItem(
                  icon: LucideIcons.heart,
                  title: 'My Favorites',
                  onTap: () => context.push('/favorites'),
                ),
                _MenuItem(
                  icon: LucideIcons.bell,
                  title: 'Notifications',
                  onTap: () => context.push('/notifications'),
                ),
              ]),
              const SizedBox(height: 20),
              _buildSectionTitle('HELP & LEGAL'),
              _buildMenuCard([
                _MenuItem(
                  icon: LucideIcons.headphones,
                  title: 'Customer Support & FAQs',
                  onTap: () => context.push('/support'),
                ),
                _MenuItem(
                  icon: LucideIcons.fileText,
                  title: 'Terms of Service',
                  onTap: () => context.push('/terms'),
                ),
                _MenuItem(
                  icon: LucideIcons.shield,
                  title: 'Privacy Policy',
                  onTap: () => context.push('/privacy'),
                ),
              ]),
              const SizedBox(height: 24),
              // Logout Button
              InkWell(
                onTap: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) {
                    context.go('/login');
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppColors.redLight,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Center(
                    child: Text(
                      'Log Out',
                      style: TextStyle(
                        color: AppColors.red,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 6, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: AppColors.neutral400,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildMenuCard(List<_MenuItem> items) {
    return Container(
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
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: List.generate(items.length, (idx) {
            final item = items[idx];
            return Column(
              children: [
                if (idx > 0) const Divider(height: 1, color: AppColors.neutral100),
                ListTile(
                  leading: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.neutral100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(child: Icon(item.icon, size: 18, color: AppColors.neutral700)),
                  ),
                  title: Text(
                    item.title,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral900),
                  ),
                  trailing: const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.neutral400),
                  onTap: item.onTap,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });
}
