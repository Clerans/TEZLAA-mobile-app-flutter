class ProductVariantModel {
  final String id;
  final String productId;
  final String name;
  final double price;
  final String? sku;
  final bool isAvailable;

  ProductVariantModel({
    required this.id,
    required this.productId,
    required this.name,
    required this.price,
    this.sku,
    this.isAvailable = true,
  });

  factory ProductVariantModel.fromJson(Map<String, dynamic> json) {
    return ProductVariantModel(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      sku: json['sku'],
      isAvailable: json['isAvailable'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'name': name,
      'price': price,
      'sku': sku,
      'isAvailable': isAvailable,
    };
  }
}

class ProductAddonModel {
  final String id;
  final String productId;
  final String name;
  final double price;
  final int maxQuantity;
  final bool isRequired;

  ProductAddonModel({
    required this.id,
    required this.productId,
    required this.name,
    required this.price,
    this.maxQuantity = 5,
    this.isRequired = false,
  });

  factory ProductAddonModel.fromJson(Map<String, dynamic> json) {
    return ProductAddonModel(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      name: json['name'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      maxQuantity: json['maxQuantity'] ?? 5,
      isRequired: json['isRequired'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'productId': productId,
      'name': name,
      'price': price,
      'maxQuantity': maxQuantity,
      'isRequired': isRequired,
    };
  }
}

class ProductModel {
  final String id;
  final String categoryId;
  final String name;
  final String slug;
  final String description;
  final double price;
  final double? discountedPrice;
  final String imageUrl;
  final bool isVegetarian;
  final bool isAvailable;
  final bool isFeatured;
  final bool isRecommended;
  final bool isFreshToday;
  final int? preparationTime;
  final int? calories;
  final List<String> allergens;
  final List<String> ingredients;
  final double rating;
  final int ratingCount;
  final int displayOrder;
  final String? categoryName;
  final List<ProductVariantModel> variants;
  final List<ProductAddonModel> addons;

  ProductModel({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.slug,
    required this.description,
    required this.price,
    this.discountedPrice,
    required this.imageUrl,
    this.isVegetarian = false,
    this.isAvailable = true,
    this.isFeatured = false,
    this.isRecommended = false,
    this.isFreshToday = false,
    this.preparationTime,
    this.calories,
    this.allergens = const [],
    this.ingredients = const [],
    this.rating = 4.8,
    this.ratingCount = 120,
    this.displayOrder = 0,
    this.categoryName,
    this.variants = const [],
    this.addons = const [],
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? '',
      categoryId: json['categoryId'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      discountedPrice: (json['discountedPrice'] as num?)?.toDouble(),
      imageUrl: json['imageUrl'] ?? '',
      isVegetarian: json['isVegetarian'] ?? false,
      isAvailable: json['isAvailable'] ?? true,
      isFeatured: json['isFeatured'] ?? false,
      isRecommended: json['isRecommended'] ?? false,
      isFreshToday: json['isFreshToday'] ?? false,
      preparationTime: json['preparationTime'],
      calories: json['calories'],
      allergens: List<String>.from(json['allergens'] ?? []),
      ingredients: List<String>.from(json['ingredients'] ?? []),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.8,
      ratingCount: json['ratingCount'] ?? 120,
      displayOrder: json['displayOrder'] ?? 0,
      categoryName: json['category']?['name'],
      variants: (json['variants'] as List<dynamic>?)
              ?.map((v) => ProductVariantModel.fromJson(v))
              .toList() ??
          [],
      addons: (json['addons'] as List<dynamic>?)
              ?.map((a) => ProductAddonModel.fromJson(a))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'categoryId': categoryId,
      'name': name,
      'slug': slug,
      'description': description,
      'price': price,
      'discountedPrice': discountedPrice,
      'imageUrl': imageUrl,
      'isVegetarian': isVegetarian,
      'isAvailable': isAvailable,
      'isFeatured': isFeatured,
      'isRecommended': isRecommended,
      'isFreshToday': isFreshToday,
      'preparationTime': preparationTime,
      'calories': calories,
      'allergens': allergens,
      'ingredients': ingredients,
      'rating': rating,
      'ratingCount': ratingCount,
      'displayOrder': displayOrder,
    };
  }
}
