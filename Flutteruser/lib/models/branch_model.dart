class BranchModel {
  final String id;
  final String name;
  final String address;
  final String phone;
  final String email;
  final double? latitude;
  final double? longitude;
  final String openingTime;
  final String closingTime;
  final bool isActive;
  final double deliveryRadiusKm;

  BranchModel({
    required this.id,
    required this.name,
    required this.address,
    required this.phone,
    required this.email,
    this.latitude,
    this.longitude,
    this.openingTime = '08:00',
    this.closingTime = '22:00',
    this.isActive = true,
    this.deliveryRadiusKm = 15.0,
  });

  factory BranchModel.fromJson(Map<String, dynamic> json) {
    return BranchModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      openingTime: json['openingTime'] ?? '08:00',
      closingTime: json['closingTime'] ?? '22:00',
      isActive: json['isActive'] ?? true,
      deliveryRadiusKm: (json['deliveryRadiusKm'] as num?)?.toDouble() ?? 15.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'phone': phone,
      'email': email,
      'latitude': latitude,
      'longitude': longitude,
      'openingTime': openingTime,
      'closingTime': closingTime,
      'isActive': isActive,
      'deliveryRadiusKm': deliveryRadiusKm,
    };
  }
}
