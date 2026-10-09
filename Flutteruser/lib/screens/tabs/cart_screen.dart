import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/app_provider.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/tezlaa_button.dart';
import '../../widgets/empty_state.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final appState = ref.watch(appProvider);
    final deliveryFee = cart.getDeliveryFee(appState.orderType);
    final grandTotal = cart.getGrandTotal(appState.orderType);

    if (cart.items.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: EmptyState(
            title: 'Your Cart is Empty',
            description: 'Explore our freshly brewed coffees, artisan sourdoughs, and handcrafted pastries.',
            actionTitle: 'Browse Menu',
            onAction: () => context.push('/menu'),
            icon: LucideIcons.shoppingBag,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        const Text(
                          'Your Cart',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'serif',
                            color: AppColors.neutral900,
                          ),
                        ),
                        Text(
                          '${cart.totalItemCount} items',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Items List Card
                    Container(
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
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      child: Column(
                        children: List.generate(cart.items.length, (idx) {
                          final item = cart.items[idx];
                          return Column(
                            children: [
                              if (idx > 0)
                                const Divider(height: 1, color: AppColors.neutral100),
                              Padding(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: SizedBox(
                                        width: 78,
                                        height: 78,
                                        child: CachedNetworkImage(
                                          imageUrl: item.imageUrl,
                                          fit: BoxFit.cover,
                                          placeholder: (_, __) => Container(color: AppColors.neutral100),
                                          errorWidget: (_, __, ___) => Container(
                                            color: AppColors.neutral100,
                                            child: const Icon(LucideIcons.image, color: AppColors.neutral400),
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  item.name,
                                                  style: const TextStyle(
                                                    fontSize: 15,
                                                    fontWeight: FontWeight.w700,
                                                    color: AppColors.neutral900,
                                                  ),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ),
                                              InkWell(
                                                onTap: () => ref.read(cartProvider.notifier).removeItem(item.id),
                                                child: const Icon(LucideIcons.trash2, size: 16, color: AppColors.red),
                                              ),
                                            ],
                                          ),
                                          if (item.variantName != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              'Size: ${item.variantName}',
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: AppColors.primary,
                                              ),
                                            ),
                                          ],
                                          if (item.addons.isNotEmpty) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              '+ ${item.addons.map((a) => a.name).join(', ')}',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppColors.neutral500,
                                              ),
                                            ),
                                          ],
                                          const SizedBox(height: 10),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                'Rs. ${item.lineTotal.toStringAsFixed(0)}',
                                                style: const TextStyle(
                                                  fontSize: 15,
                                                  fontWeight: FontWeight.w800,
                                                  color: AppColors.neutral900,
                                                ),
                                              ),
                                              Container(
                                                decoration: BoxDecoration(
                                                  color: AppColors.neutral100,
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                padding: const EdgeInsets.all(3),
                                                child: Row(
                                                  children: [
                                                    InkWell(
                                                      onTap: () => ref.read(cartProvider.notifier).updateQuantity(item.id, item.quantity - 1),
                                                      borderRadius: BorderRadius.circular(8),
                                                      child: Container(
                                                        width: 26,
                                                        height: 26,
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius: BorderRadius.circular(8),
                                                        ),
                                                        child: const Center(
                                                          child: Icon(LucideIcons.minus, size: 14, color: AppColors.neutral900),
                                                        ),
                                                      ),
                                                    ),
                                                    Padding(
                                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                                      child: Text(
                                                        '${item.quantity}',
                                                        style: const TextStyle(
                                                          fontSize: 13,
                                                          fontWeight: FontWeight.w700,
                                                          color: AppColors.neutral900,
                                                        ),
                                                      ),
                                                    ),
                                                    InkWell(
                                                      onTap: () => ref.read(cartProvider.notifier).updateQuantity(item.id, item.quantity + 1),
                                                      borderRadius: BorderRadius.circular(8),
                                                      child: Container(
                                                        width: 26,
                                                        height: 26,
                                                        decoration: BoxDecoration(
                                                          color: Colors.white,
                                                          borderRadius: BorderRadius.circular(8),
                                                        ),
                                                        child: const Center(
                                                          child: Icon(LucideIcons.plus, size: 14, color: AppColors.neutral900),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        }),
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Bill Summary Card
                    Container(
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
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Bill Summary',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.neutral900,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Items Subtotal', style: TextStyle(fontSize: 13, color: AppColors.neutral500)),
                              Text('Rs. ${cart.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral900)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(appState.orderType == 'DELIVERY' ? 'Standard Delivery Fee' : 'Store Pickup', style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
                              Text(deliveryFee == 0 ? 'FREE' : 'Rs. ${deliveryFee.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.neutral900)),
                            ],
                          ),
                          if (cart.discount > 0) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Promotion Discount', style: TextStyle(fontSize: 13, color: AppColors.green)),
                                Text('-Rs. ${cart.discount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.green)),
                              ],
                            ),
                          ],
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Divider(height: 1, color: AppColors.neutral100),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Total Payable', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                              Text('Rs. ${grandTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
            // Bottom Sticky Checkout Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
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
              child: TezlaaButton(
                title: 'Proceed to Checkout — Rs. ${grandTotal.toStringAsFixed(0)}',
                onPress: () => context.push('/checkout'),
                size: TezlaaButtonSize.lg,
                width: double.infinity,
                icon: const Icon(LucideIcons.arrowRight, size: 18, color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
