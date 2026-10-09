import 'product_model.dart';
import 'branch_model.dart';
import 'address_model.dart';

class OrderItemModel {
  final String id;
  final String orderId;
  final String productId;
  final String? variantId;
  final int quantity;
  final double unitPrice;
  final double totalPrice;
  final String? specialInstructions;
  final ProductModel? product;
  final ProductVariantModel? variant;
  final List<ProductAddonModel> addons;

  OrderItemModel({
    required this.id,
    required this.orderId,
    required this.productId,
    this.variantId,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.specialInstructions,
    this.product,
    this.variant,
    this.addons = const [],
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      productId: json['productId'] ?? '',
      variantId: json['variantId'],
      quantity: json['quantity'] ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['totalPrice'] as num?)?.toDouble() ?? 0.0,
      specialInstructions: json['specialInstructions'],
      product: json['product'] != null ? ProductModel.fromJson(json['product']) : null,
      variant: json['variant'] != null ? ProductVariantModel.fromJson(json['variant']) : null,
      addons: (json['addons'] as List<dynamic>?)
              ?.map((a) => ProductAddonModel.fromJson(a))
              .toList() ??
          [],
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String userId;
  final String branchId;
  final String? addressId;
  final String orderType; // DELIVERY, PICKUP
  final String status; // PENDING, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
  final double subtotal;
  final double deliveryFee;
  final double discount;
  final double loyaltyDiscount;
  final double grandTotal;
  final String? deliveryInstructions;
  final String? customerNotes;
  final String? couponCode;
  final String? estimatedDeliveryTime;
  final DateTime createdAt;
  final List<OrderItemModel> items;
  final BranchModel? branch;
  final AddressModel? address;
  final Map<String, dynamic>? payHereParams;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.userId,
    required this.branchId,
    this.addressId,
    required this.orderType,
    required this.status,
    required this.subtotal,
    required this.deliveryFee,
    required this.discount,
    required this.loyaltyDiscount,
    required this.grandTotal,
    this.deliveryInstructions,
    this.customerNotes,
    this.couponCode,
    this.estimatedDeliveryTime,
    required this.createdAt,
    this.items = const [],
    this.branch,
    this.address,
    this.payHereParams,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      userId: json['userId'] ?? '',
      branchId: json['branchId'] ?? '',
      addressId: json['addressId'],
      orderType: json['orderType'] ?? 'DELIVERY',
      status: json['status'] ?? 'PENDING',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      deliveryFee: (json['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      loyaltyDiscount: (json['loyaltyDiscount'] as num?)?.toDouble() ?? 0.0,
      grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0.0,
      deliveryInstructions: json['deliveryInstructions'],
      customerNotes: json['customerNotes'],
      couponCode: json['couponCode'],
      estimatedDeliveryTime: json['estimatedDeliveryTime'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      items: (json['items'] as List<dynamic>?)
              ?.map((i) => OrderItemModel.fromJson(i))
              .toList() ??
          [],
      branch: json['branch'] != null ? BranchModel.fromJson(json['branch']) : null,
      address: json['address'] != null ? AddressModel.fromJson(json['address']) : null,
      payHereParams: json['payHereParams'],
    );
  }
}
