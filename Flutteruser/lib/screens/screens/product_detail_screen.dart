import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/cart_item_model.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../widgets/tezlaa_button.dart';

final singleProductProvider = FutureProvider.family<ProductModel, String>((ref, id) async {
  final service = ref.watch(productServiceProvider);
  return await service.getProductById(id);
});

class ProductDetailScreen extends ConsumerStatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  ConsumerState<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends ConsumerState<ProductDetailScreen> {
  int _quantity = 1;
  ProductVariantModel? _selectedVariant;
  final Map<String, int> _selectedAddons = {}; // addonId -> quantity

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(singleProductProvider(widget.productId));
    final isFav = ref.watch(favoritesProvider).contains(widget.productId);

    return Scaffold(
      backgroundColor: Colors.white,
      body: productAsync.when(
        data: (product) {
          _selectedVariant ??= product.variants.isNotEmpty ? product.variants.first : null;

          final basePrice = _selectedVariant?.price ?? product.price;
          double addonsPrice = 0.0;
          for (final addon in product.addons) {
            final qty = _selectedAddons[addon.id] ?? 0;
            addonsPrice += addon.price * qty;
          }
          final totalPrice = (basePrice + addonsPrice) * _quantity;

          return Stack(
            children: [
              CustomScrollView(
                slivers: [
                  // Sliver App Bar with Image Hero
                  SliverAppBar(
                    expandedHeight: 280,
                    pinned: true,
                    backgroundColor: Colors.white,
                    leading: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: CircleAvatar(
                        backgroundColor: Colors.white,
                        child: IconButton(
                          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
                          onPressed: () => context.pop(),
                        ),
                      ),
                    ),
                    actions: [
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: CircleAvatar(
                          backgroundColor: Colors.white,
                          child: IconButton(
                            icon: Icon(
                              LucideIcons.heart,
                              color: isFav ? AppColors.red : AppColors.neutral900,
                            ),
                            onPressed: () => ref.read(favoritesProvider.notifier).toggleFavorite(product.id),
                          ),
                        ),
                      ),
                    ],
                    flexibleSpace: FlexibleSpaceBar(
                      background: CachedNetworkImage(
                        imageUrl: product.imageUrl,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(color: AppColors.neutral100),
                      ),
                    ),
                  ),
                  // Content
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  product.name,
                                  style: const TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'serif',
                                    color: AppColors.neutral900,
                                  ),
                                ),
                              ),
                              Text(
                                'Rs. ${basePrice.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            product.description,
                            style: const TextStyle(fontSize: 14, color: AppColors.neutral500, height: 1.45),
                          ),
                          const SizedBox(height: 16),
                          // Rating & Prep Time Pills
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.goldLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(LucideIcons.star, size: 14, color: AppColors.gold),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${product.rating.toStringAsFixed(1)} (${product.ratingCount})',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              if (product.preparationTime != null) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.neutral100,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(LucideIcons.clock, size: 14, color: AppColors.neutral600),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${product.preparationTime} mins',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.neutral700),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                          // Size Variants
                          if (product.variants.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            const Text(
                              'Choose Size',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 10,
                              children: product.variants.map((v) {
                                final isSelected = _selectedVariant?.id == v.id;
                                return ChoiceChip(
                                  label: Text('${v.name} (Rs. ${v.price.toStringAsFixed(0)})'),
                                  selected: isSelected,
                                  selectedColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    color: isSelected ? Colors.white : AppColors.neutral700,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  ),
                                  onSelected: (selected) {
                                    if (selected) setState(() => _selectedVariant = v);
                                  },
                                );
                              }).toList(),
                            ),
                          ],
                          // Add-ons
                          if (product.addons.isNotEmpty) ...[
                            const SizedBox(height: 24),
                            const Text(
                              'Custom Add-ons',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                            ),
                            const SizedBox(height: 10),
                            Column(
                              children: product.addons.map((addon) {
                                final currentQty = _selectedAddons[addon.id] ?? 0;
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppColors.neutral50,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: AppColors.neutral200),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(addon.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                                          Text('+ Rs. ${addon.price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w700)),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          if (currentQty > 0) ...[
                                            IconButton(
                                              icon: const Icon(LucideIcons.minusCircle, size: 22, color: AppColors.primary),
                                              onPressed: () => setState(() => _selectedAddons[addon.id] = currentQty - 1),
                                            ),
                                            Text('$currentQty', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                          ],
                                          IconButton(
                                            icon: const Icon(LucideIcons.plusCircle, size: 22, color: AppColors.primary),
                                            onPressed: () => setState(() => _selectedAddons[addon.id] = currentQty + 1),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                          const SizedBox(height: 120),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              // Bottom Floating Action Bar
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                    boxShadow: [
                      BoxShadow(
                        color: Color.fromRGBO(15, 23, 42, 0.08),
                        offset: Offset(0, -4),
                        blurRadius: 10,
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Quantity selector
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.neutral100,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(LucideIcons.minus, size: 16),
                              onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                            ),
                            Text('$_quantity', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                            IconButton(
                              icon: const Icon(LucideIcons.plus, size: 16),
                              onPressed: () => setState(() => _quantity++),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: TezlaaButton(
                          title: 'Add to Cart — Rs. ${totalPrice.toStringAsFixed(0)}',
                          size: TezlaaButtonSize.lg,
                          onPress: () {
                            final chosenAddons = <CartItemAddon>[];
                            for (final entry in _selectedAddons.entries) {
                              if (entry.value > 0) {
                                final matching = product.addons.firstWhere((a) => a.id == entry.key);
                                chosenAddons.add(CartItemAddon(
                                  id: matching.id,
                                  name: matching.name,
                                  price: matching.price,
                                  quantity: entry.value,
                                ));
                              }
                            }

                            ref.read(cartProvider.notifier).addItem(
                              product: product,
                              variant: _selectedVariant,
                              addons: chosenAddons,
                              quantity: _quantity,
                            );

                            context.pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('${product.name} added to cart!'),
                                backgroundColor: AppColors.neutral900,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (_, __) => const Center(child: Text('Product not found')),
      ),
    );
  }
}
