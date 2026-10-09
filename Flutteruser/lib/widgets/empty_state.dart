import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import 'tezlaa_button.dart';

class EmptyState extends StatelessWidget {
  final String title;
  final String description;
  final String? actionTitle;
  final VoidCallback? onAction;
  final IconData? icon;

  const EmptyState({
    super.key,
    required this.title,
    required this.description,
    this.actionTitle,
    this.onAction,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: AppColors.primaryMuted,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(icon, size: 32, color: AppColors.primary),
                ),
              ),
              const SizedBox(height: 16),
            ],
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral800,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.neutral500,
                height: 1.45,
              ),
              textAlign: TextAlign.center,
            ),
            if (actionTitle != null && onAction != null) ...[
              const SizedBox(height: 24),
              TezlaaButton(
                title: actionTitle!,
                onPress: onAction,
                width: 190,
                size: TezlaaButtonSize.md,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
