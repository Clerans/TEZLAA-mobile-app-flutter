class AddressModel {
  final String id;
  final String userId;
  final String label;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String? postalCode;
  final double? latitude;
  final double? longitude;
  final String? deliveryInstructions;
  final bool isDefault;

  AddressModel({
    required this.id,
    required this.userId,
    required this.label,
    required this.addressLine1,
    this.addressLine2,
    this.city = 'Colombo',
    this.postalCode,
    this.latitude,
    this.longitude,
    this.deliveryInstructions,
    this.isDefault = false,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      label: json['label'] ?? 'Home',
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'],
      city: json['city'] ?? 'Colombo',
      postalCode: json['postalCode'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      deliveryInstructions: json['deliveryInstructions'],
      isDefault: json['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'label': label,
      'addressLine1': addressLine1,
      'addressLine2': addressLine2,
      'city': city,
      'postalCode': postalCode,
      'latitude': latitude,
      'longitude': longitude,
      'deliveryInstructions': deliveryInstructions,
      'isDefault': isDefault,
    };
  }
}
