import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_item_model.dart';
import '../models/product_model.dart';

class CartState {
  final List<CartItemModel> items;
  final double discount;
  final String? couponCode;

  CartState({
    this.items = const [],
    this.discount = 0.0,
    this.couponCode,
  });

  int get totalItemCount => items.fold(0, (sum, i) => sum + i.quantity);
  double get subtotal => items.fold(0.0, (sum, i) => sum + i.lineTotal);

  double getDeliveryFee(String orderType) {
    if (orderType == 'DELIVERY' && items.isNotEmpty) {
      return 350.0;
    }
    return 0.0;
  }

  double getGrandTotal(String orderType) {
    final fee = getDeliveryFee(orderType);
    final total = subtotal + fee - discount;
    return total > 0 ? total : 0.0;
  }

  CartState copyWith({
    List<CartItemModel>? items,
    double? discount,
    String? couponCode,
  }) {
    return CartState(
      items: items ?? this.items,
      discount: discount ?? this.discount,
      couponCode: couponCode ?? this.couponCode,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(CartState());

  void addItem({
    required ProductModel product,
    ProductVariantModel? variant,
    List<CartItemAddon> addons = const [],
    int quantity = 1,
  }) {
    final sortedAddonIds = (addons.map((a) => a.id).toList()..sort()).join('-');
    final lineId = '${product.id}-${variant?.id ?? 'base'}-${sortedAddonIds.isNotEmpty ? sortedAddonIds : 'noaddons'}';

    final existingIndex = state.items.indexWhere((i) => i.id == lineId);

    if (existingIndex >= 0) {
      final updated = List<CartItemModel>.from(state.items);
      final current = updated[existingIndex];
      updated[existingIndex] = current.copyWith(quantity: current.quantity + quantity);
      state = state.copyWith(items: updated);
    } else {
      final newItem = CartItemModel(
        id: lineId,
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        unitPrice: variant?.price ?? product.price,
        quantity: quantity,
        variantId: variant?.id,
        variantName: variant?.name,
        addons: addons,
      );
      state = state.copyWith(items: [...state.items, newItem]);
    }
  }

  void updateQuantity(String id, int quantity) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    final updated = state.items.map((i) {
      if (i.id == id) {
        return i.copyWith(quantity: quantity);
      }
      return i;
    }).toList();
    state = state.copyWith(items: updated);
  }

  void removeItem(String id) {
    state = state.copyWith(
      items: state.items.where((i) => i.id != id).toList(),
    );
  }

  void applyCoupon(String code, double discountAmount) {
    state = state.copyWith(
      couponCode: code,
      discount: discountAmount,
    );
  }

  void removeCoupon() {
    state = state.copyWith(
      couponCode: null,
      discount: 0.0,
    );
  }

  void clearCart() {
    state = CartState();
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});
