import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/category_pill.dart';
import '../../widgets/product_card.dart';
import '../../widgets/empty_state.dart';

class MenuScreen extends ConsumerStatefulWidget {
  const MenuScreen({super.key});

  @override
  ConsumerState<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends ConsumerState<MenuScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final selectedCategoryId = ref.watch(selectedCategoryFilterProvider);
    final productsAsync = ref.watch(menuProductsProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.only(left: 22, right: 22, top: 10, bottom: 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Our Menu',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'serif',
                      color: AppColors.neutral900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Artisan recipes crafted fresh daily',
                    style: TextStyle(fontSize: 13, color: AppColors.neutral500),
                  ),
                ],
              ),
            ),
            // Search Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 8),
              child: Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.neutral100,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.neutral200, width: 1.2),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.search, size: 18, color: AppColors.neutral400),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          ref.read(searchQueryProvider.notifier).state = val.trim();
                        },
                        decoration: const InputDecoration(
                          hintText: 'Search coffee, pastries, mains...',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                    if (_searchController.text.isNotEmpty)
                      InkWell(
                        onTap: () {
                          _searchController.clear();
                          ref.read(searchQueryProvider.notifier).state = '';
                        },
                        child: const Icon(LucideIcons.x, size: 16, color: AppColors.neutral400),
                      ),
                  ],
                ),
              ),
            ),
            // Categories Horizontal Bar
            categoriesAsync.when(
              data: (categories) {
                final allCategories = [
                  CategoryPill(
                    title: 'All',
                    isSelected: selectedCategoryId == null,
                    onTap: () => ref.read(selectedCategoryFilterProvider.notifier).state = null,
                  ),
                  ...categories.map((c) => CategoryPill(
                        title: c.name,
                        isSelected: selectedCategoryId == c.id,
                        onTap: () => ref.read(selectedCategoryFilterProvider.notifier).state = c.id,
                      )),
                ];

                return SizedBox(
                  height: 42,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 22),
                    scrollDirection: Axis.horizontal,
                    itemCount: allCategories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, idx) => allCategories[idx],
                  ),
                );
              },
              loading: () => const SizedBox(height: 42),
              error: (_, __) => const SizedBox.shrink(),
            ),
            const SizedBox(height: 8),
            // Product List
            Expanded(
              child: Container(
                color: AppColors.neutral50,
                child: productsAsync.when(
                  data: (products) {
                    if (products.isEmpty) {
                      return EmptyState(
                        title: 'No Items Found',
                        description: _searchController.text.isNotEmpty
                            ? 'No results found for "${_searchController.text}". Try another search.'
                            : 'No items currently available in this category.',
                        actionTitle: _searchController.text.isNotEmpty || selectedCategoryId != null
                            ? 'Clear Filters'
                            : null,
                        onAction: () {
                          _searchController.clear();
                          ref.read(searchQueryProvider.notifier).state = '';
                          ref.read(selectedCategoryFilterProvider.notifier).state = null;
                        },
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
                      itemCount: products.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (context, idx) {
                        return ProductCard(
                          product: products[idx],
                          isListLayout: true,
                        );
                      },
                    );
                  },
                  loading: () => const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                  error: (_, __) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Unable to load menu items'),
                        const SizedBox(height: 10),
                        ElevatedButton(
                          onPressed: () => ref.invalidate(menuProductsProvider),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
