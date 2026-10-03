import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/admin_providers.dart';

class AdminAnalyticsScreen extends ConsumerWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(adminAnalyticsProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Live Analytics'),
        backgroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw, size: 18),
            onPressed: () => ref.invalidate(adminAnalyticsProvider),
          ),
        ],
      ),
      body: SafeArea(
        child: analyticsAsync.when(
          data: (summary) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Total Revenue Highlight
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: const [
                        BoxShadow(
                          color: Color.fromRGBO(15, 23, 42, 0.15),
                          offset: Offset(0, 6),
                          blurRadius: 14,
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'TOTAL REVENUE',
                          style: TextStyle(
                            color: AppColors.neutral400,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Rs. ${summary.totalRevenue.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontFamily: 'serif',
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: const [
                            Icon(LucideIcons.trendingUp, size: 16, color: AppColors.green),
                            SizedBox(width: 4),
                            Text(
                              '+18.4% compared to previous cycle',
                              style: TextStyle(color: AppColors.green, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Metric Tiles Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.35,
                    children: [
                      _buildMetricTile(
                        icon: LucideIcons.shoppingBag,
                        label: 'Total Orders',
                        value: '${summary.totalOrders}',
                        color: AppColors.primary,
                      ),
                      _buildMetricTile(
                        icon: LucideIcons.flame,
                        label: 'Active in Kitchen',
                        value: '${summary.activeOrders}',
                        color: AppColors.amber,
                      ),
                      _buildMetricTile(
                        icon: LucideIcons.checkCircle2,
                        label: 'Completed',
                        value: '${summary.completedOrders}',
                        color: AppColors.green,
                      ),
                      _buildMetricTile(
                        icon: LucideIcons.receipt,
                        label: 'Avg Order Value',
                        value: 'Rs. ${summary.averageOrderValue.toStringAsFixed(0)}',
                        color: AppColors.blue,
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Top Performing Categories
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.neutral200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Peak Demand Channels', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        SizedBox(height: 12),
                        _ChannelRow(title: 'Espresso & Signature Beverages', percent: 0.52, count: '52%'),
                        SizedBox(height: 10),
                        _ChannelRow(title: 'Fresh Sourdough & Bakery', percent: 0.31, count: '31%'),
                        SizedBox(height: 10),
                        _ChannelRow(title: 'Artisan Mains & Brunch', percent: 0.17, count: '17%'),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (err, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                    ),
                    child: const Icon(LucideIcons.alertTriangle, color: Color(0xFFDC2626), size: 28),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Unable to Load Analytics',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    err.toString().contains('SocketException') || err.toString().contains('connection')
                        ? 'Could not connect to the backend server. Please verify your internet connection.'
                        : 'An unexpected error occurred while fetching live analytics.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () => ref.invalidate(adminAnalyticsProvider),
                    icon: const Icon(LucideIcons.refreshCw, size: 16),
                    label: const Text('Retry'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricTile({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.neutral200),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(15, 23, 42, 0.04),
            offset: Offset(0, 2),
            blurRadius: 6,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, size: 20, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.neutral900),
              ),
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppColors.neutral500, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ChannelRow extends StatelessWidget {
  final String title;
  final double percent;
  final String count;

  const _ChannelRow({required this.title, required this.percent, required this.count});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            Text(count, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent,
            backgroundColor: AppColors.neutral100,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
