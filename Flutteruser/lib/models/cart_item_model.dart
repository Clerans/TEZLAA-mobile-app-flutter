class CartItemAddon {
  final String id;
  final String name;
  final double price;
  final int quantity;

  CartItemAddon({
    required this.id,
    required this.name,
    required this.price,
    this.quantity = 1,
  });

  factory CartItemAddon.fromJson(Map<String, dynamic> json) {
    return CartItemAddon(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      quantity: json['quantity'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'price': price,
      'quantity': quantity,
    };
  }
}

class CartItemModel {
  final String id;
  final String productId;
  final String name;
  final String imageUrl;
  final double unitPrice;
  final int quantity;
  final String? variantId;
  final String? variantName;
  final List<CartItemAddon> addons;

  CartItemModel({
    required this.id,
    required this.productId,
    required this.name,
    required this.imageUrl,
    required this.unitPrice,
    required this.quantity,
    this.variantId,
    this.variantName,
    this.addons = const [],
  });

  double get addonsTotal => addons.fold(0.0, (sum, a) => sum + (a.price * a.quantity));
  double get lineUnitPrice => unitPrice + addonsTotal;
  double get lineTotal => lineUnitPrice * quantity;

  CartItemModel copyWith({
    String? id,
    String? productId,
    String? name,
    String? imageUrl,
    double? unitPrice,
    int? quantity,
    String? variantId,
    String? variantName,
    List<CartItemAddon>? addons,
  }) {
    return CartItemModel(
      id: id ?? this.id,
      productId: productId ?? this.productId,
      name: name ?? this.name,
      imageUrl: imageUrl ?? this.imageUrl,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      variantId: variantId ?? this.variantId,
      variantName: variantName ?? this.variantName,
      addons: addons ?? this.addons,
    );
  }

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      name: json['name'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      quantity: json['quantity'] ?? 1,
      variantId: json['variantId'],
      variantName: json['variantName'],
      addons: (json['addons'] as List<dynamic>?)
              ?.map((a) => CartItemAddon.fromJson(a))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'name': name,
      'imageUrl': imageUrl,
      'unitPrice': unitPrice,
      'quantity': quantity,
      'variantId': variantId,
      'variantName': variantName,
      'addons': addons.map((a) => a.toJson()).toList(),
    };
  }
}
