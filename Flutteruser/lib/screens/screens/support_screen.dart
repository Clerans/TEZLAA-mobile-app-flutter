import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Customer Support'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.neutral900,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'How can we help you?',
                      style: TextStyle(fontFamily: 'serif', fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Our café concierge is available daily from 8:00 AM to 10:00 PM.',
                      style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              _buildContactOption(
                icon: LucideIcons.phone,
                title: 'Call Café Direct',
                subtitle: '+94 11 234 5678',
                onTap: () => launchUrl(Uri.parse('tel:+94112345678')),
              ),
              const SizedBox(height: 12),
              _buildContactOption(
                icon: LucideIcons.mail,
                title: 'Email Support',
                subtitle: 'support@tezlaa.com',
                onTap: () => launchUrl(Uri.parse('mailto:support@tezlaa.com')),
              ),
              const SizedBox(height: 24),
              const Text(
                'Frequently Asked Questions',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, fontFamily: 'serif'),
              ),
              const SizedBox(height: 12),
              _buildFaqItem(
                question: 'What are your delivery hours?',
                answer: 'We deliver fresh orders between 8:00 AM and 9:30 PM across Malabe and Greater Colombo.',
              ),
              const SizedBox(height: 10),
              _buildFaqItem(
                question: 'How do I redeem TEZLAA Circle points?',
                answer: 'Navigate to the Circle tab and choose your preferred voucher or drink discount.',
              ),
              const SizedBox(height: 10),
              _buildFaqItem(
                question: 'Can I customize my sourdough or coffee?',
                answer: 'Yes! Tap any customizable item to select milk options, espresso roast, or sourdough fillings.',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContactOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.neutral200),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: const BoxDecoration(
                color: AppColors.primaryMuted,
                shape: BoxShape.circle,
              ),
              child: Center(child: Icon(icon, size: 20, color: AppColors.primary)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, size: 16, color: AppColors.neutral400),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqItem({required String question, required String answer}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(question, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
          const SizedBox(height: 6),
          Text(answer, style: const TextStyle(fontSize: 13, color: AppColors.neutral600, height: 1.35)),
        ],
      ),
    );
  }
}
