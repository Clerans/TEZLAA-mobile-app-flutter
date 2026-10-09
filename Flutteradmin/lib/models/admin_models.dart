class AdminUserModel {
  final String id;
  final String email;
  final String fullName;
  final String role; // 'ADMIN', 'STAFF', 'MANAGER'
  final String? branchId;
  final bool isActive;

  AdminUserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.branchId,
    this.isActive = true,
  });

  factory AdminUserModel.fromJson(Map<String, dynamic> json) {
    return AdminUserModel(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      fullName: json['fullName'] ?? json['name'] ?? 'Staff Member',
      role: json['role'] ?? 'STAFF',
      branchId: json['branchId']?.toString(),
      isActive: json['isActive'] ?? true,
    );
  }
}

class AdminOrderItemModel {
  final String id;
  final String name;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? variantName;
  final List<String> addons;

  AdminOrderItemModel({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.variantName,
    this.addons = const [],
  });

  factory AdminOrderItemModel.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>?;
    final variant = json['variant'] as Map<String, dynamic>?;
    final addonsList = (json['addons'] as List<dynamic>?)
            ?.map((a) => (a as Map<String, dynamic>)['name']?.toString() ?? '')
            .where((s) => s.isNotEmpty)
            .toList() ??
        [];

    return AdminOrderItemModel(
      id: json['id']?.toString() ?? '',
      name: product?['name'] ?? json['productName'] ?? 'Item',
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0.0,
      variantName: variant?['name'],
      addons: addonsList,
    );
  }
}

class AdminOrderModel {
  final String id;
  final String orderNumber;
  final String orderType; // 'DELIVERY', 'PICKUP', 'DINE_IN'
  final String status; // 'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
  final String paymentStatus;
  final String paymentMethod;
  final double subtotal;
  final double deliveryFee;
  final double discount;
  final double grandTotal;
  final String? customerNotes;
  final String? customerName;
  final String? customerPhone;
  final String? customerEmail;
  final String? deliveryAddress;
  final String? branchName;
  final DateTime createdAt;
  final List<AdminOrderItemModel> items;

  AdminOrderModel({
    required this.id,
    required this.orderNumber,
    required this.orderType,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.subtotal,
    required this.deliveryFee,
    required this.discount,
    required this.grandTotal,
    this.customerNotes,
    this.customerName,
    this.customerPhone,
    this.customerEmail,
    this.deliveryAddress,
    this.branchName,
    required this.createdAt,
    required this.items,
  });

  factory AdminOrderModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    final address = json['address'] as Map<String, dynamic>?;
    final branch = json['branch'] as Map<String, dynamic>?;
    final itemsJson = (json['items'] as List<dynamic>?) ?? [];

    String? fullAddress;
    if (address != null) {
      fullAddress = '${address['addressLine1'] ?? ''}, ${address['city'] ?? ''}';
    }

    return AdminOrderModel(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber'] ?? '',
      orderType: json['orderType'] ?? 'DELIVERY',
      status: json['status'] ?? 'PENDING',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      paymentMethod: json['paymentMethod'] ?? 'CASH_ON_DELIVERY',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0.0,
      customerNotes: json['customerNotes'],
      customerName: user?['fullName'] ?? user?['name'] ?? 'Guest Customer',
      customerPhone: user?['phone'] ?? address?['phone'],
      customerEmail: user?['email'],
      deliveryAddress: fullAddress,
      branchName: branch?['name'] ?? 'TEZLAA Flagship Café',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      items: itemsJson.map((i) => AdminOrderItemModel.fromJson(i)).toList(),
    );
  }
}

class AdminProductModel {
  final String id;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final String categoryId;
  final String categoryName;
  final bool isAvailable;
  final bool isFeatured;
  final int preparationTime;

  AdminProductModel({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.categoryId,
    required this.categoryName,
    required this.isAvailable,
    required this.isFeatured,
    required this.preparationTime,
  });

  factory AdminProductModel.fromJson(Map<String, dynamic> json) {
    final category = json['category'] as Map<String, dynamic>?;
    return AdminProductModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      imageUrl: json['imageUrl'] ?? 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
      categoryId: json['categoryId']?.toString() ?? '',
      categoryName: category?['name'] ?? 'Category',
      isAvailable: json['isAvailable'] ?? true,
      isFeatured: json['isFeatured'] ?? false,
      preparationTime: json['preparationTime'] ?? 10,
    );
  }
}

class AdminAnalyticsSummary {
  final double totalRevenue;
  final int totalOrders;
  final int activeOrders;
  final int completedOrders;
  final double averageOrderValue;

  AdminAnalyticsSummary({
    required this.totalRevenue,
    required this.totalOrders,
    required this.activeOrders,
    required this.completedOrders,
    required this.averageOrderValue,
  });

  factory AdminAnalyticsSummary.fromJson(Map<String, dynamic> json) {
    final metrics = (json['metrics'] as Map<String, dynamic>?) ?? json;
    final totalRev = (metrics['monthRevenue'] ?? metrics['todayRevenue'] ?? metrics['totalRevenue'] as num?)?.toDouble() ?? 0.0;
    final totalOrd = (metrics['todayOrders'] ?? metrics['totalOrders']) ?? 0;
    final activeOrd = (metrics['activeOrders'] ??
        ((metrics['pendingOrders'] ?? 0) +
            (metrics['preparingOrders'] ?? 0) +
            (metrics['readyOrders'] ?? 0))) ??
        0;
    final completedOrd = (metrics['completedOrders']) ?? 0;
    final avgVal = (metrics['averageOrderValue'] as num?)?.toDouble() ??
        (totalOrd > 0 ? (totalRev / (totalOrd is int ? totalOrd : 1)) : 0.0);

    return AdminAnalyticsSummary(
      totalRevenue: totalRev,
      totalOrders: totalOrd is int ? totalOrd : int.tryParse(totalOrd.toString()) ?? 0,
      activeOrders: activeOrd is int ? activeOrd : int.tryParse(activeOrd.toString()) ?? 0,
      completedOrders: completedOrd is int ? completedOrd : int.tryParse(completedOrd.toString()) ?? 0,
      averageOrderValue: avgVal,
    );
  }
}

class AdminCustomerModel {
  final String id;
  final String fullName;
  final String email;
  final String phone;
  final int orderCount;
  final int loyaltyPoints;
  final String tier;

  AdminCustomerModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.orderCount,
    required this.loyaltyPoints,
    required this.tier,
  });

  factory AdminCustomerModel.fromJson(Map<String, dynamic> json) {
    final user = (json['user'] as Map<String, dynamic>?) ?? json;
    final loyalty = (json['loyalty'] as Map<String, dynamic>?) ?? (user['loyalty'] as Map<String, dynamic>?);
    final count = json['_count']?['orders'] ?? json['orderCount'] ?? user['_count']?['orders'] ?? 0;
    final pts = loyalty?['points'] ?? json['points'] ?? user['loyaltyPoints'] ?? 0;
    final tierName = loyalty?['tier'] ?? json['tier'] ?? 'BRONZE';

    return AdminCustomerModel(
      id: user['id']?.toString() ?? '',
      fullName: user['fullName'] ?? user['name'] ?? 'Guest Customer',
      email: user['email'] ?? '',
      phone: user['phone'] ?? '+94 77 000 0000',
      orderCount: count is int ? count : int.tryParse(count.toString()) ?? 0,
      loyaltyPoints: pts is int ? pts : int.tryParse(pts.toString()) ?? 0,
      tier: tierName.toString().toUpperCase(),
    );
  }
}

class AdminCategoryModel {
  final String id;
  final String name;
  final String slug;

  AdminCategoryModel({
    required this.id,
    required this.name,
    required this.slug,
  });

  factory AdminCategoryModel.fromJson(Map<String, dynamic> json) {
    return AdminCategoryModel(
      id: json['id']?.toString() ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
    );
  }
}
