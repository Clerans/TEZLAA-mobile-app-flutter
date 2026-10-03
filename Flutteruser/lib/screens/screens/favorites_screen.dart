import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/product_card.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favoriteIds = ref.watch(favoritesProvider);
    final allProductsAsync = ref.watch(menuProductsProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('My Favorites'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: allProductsAsync.when(
          data: (allProducts) {
            final favoriteProducts = allProducts.where((p) => favoriteIds.contains(p.id)).toList();

            if (favoriteProducts.isEmpty) {
              return EmptyState(
                title: 'No Favorites Yet',
                description: 'Tap the heart on any coffee or dish to save it here for quick re-ordering.',
                actionTitle: 'Explore Menu',
                onAction: () => context.go('/menu'),
                icon: LucideIcons.heart,
              );
            }

            return GridView.builder(
              padding: const EdgeInsets.all(18),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.65,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: favoriteProducts.length,
              itemBuilder: (context, idx) {
                return ProductCard(product: favoriteProducts[idx]);
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (_, __) => const Center(child: Text('Unable to load favorites')),
        ),
      ),
    );
  }
}
