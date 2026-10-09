import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_provider.dart';

class BranchScreen extends ConsumerWidget {
  const BranchScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appState = ref.watch(appProvider);
    final branches = appState.branches;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Select Café Branch'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.all(18),
          itemCount: branches.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, idx) {
            final branch = branches[idx];
            final isSelected = appState.selectedBranch?.id == branch.id;

            return InkWell(
              onTap: () {
                ref.read(appProvider.notifier).setSelectedBranch(branch);
                context.pop();
              },
              borderRadius: BorderRadius.circular(18),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : AppColors.neutral200,
                    width: isSelected ? 1.8 : 1,
                  ),
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
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primaryMuted : AppColors.neutral100,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Icon(
                          LucideIcons.store,
                          size: 20,
                          color: isSelected ? AppColors.primary : AppColors.neutral600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            branch.name,
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            branch.address,
                            style: const TextStyle(fontSize: 12, color: AppColors.neutral500),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Open ${branch.openingTime} - ${branch.closingTime}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.green),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      const Icon(LucideIcons.checkCircle2, color: AppColors.primary, size: 20),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
