class UserModel {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String role;
  final bool isEmailVerified;
  final int loyaltyPoints;
  final String loyaltyTier;
  final String? defaultBranchId;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatarUrl,
    required this.role,
    this.isEmailVerified = false,
    this.loyaltyPoints = 0,
    this.loyaltyTier = 'BRONZE',
    this.defaultBranchId,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final loyalty = (json['loyalty'] as Map<String, dynamic>?) ??
        (json['loyaltyAccount'] as Map<String, dynamic>?);
    final pts = json['loyaltyPoints'] ?? loyalty?['points'] ?? 0;
    final tier = json['loyaltyTier'] ?? loyalty?['tier'] ?? 'BRONZE';

    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['fullName'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      avatarUrl: json['avatarUrl'],
      role: json['role'] ?? 'CUSTOMER',
      isEmailVerified: json['isVerified'] ?? json['isEmailVerified'] ?? false,
      loyaltyPoints: pts is int ? pts : int.tryParse(pts.toString()) ?? 0,
      loyaltyTier: tier.toString().toUpperCase(),
      defaultBranchId: json['defaultBranchId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'role': role,
      'isEmailVerified': isEmailVerified,
      'loyaltyPoints': loyaltyPoints,
      'loyaltyTier': loyaltyTier,
      'defaultBranchId': defaultBranchId,
    };
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? avatarUrl,
    String? role,
    bool? isEmailVerified,
    int? loyaltyPoints,
    String? loyaltyTier,
    String? defaultBranchId,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      loyaltyPoints: loyaltyPoints ?? this.loyaltyPoints,
      loyaltyTier: loyaltyTier ?? this.loyaltyTier,
      defaultBranchId: defaultBranchId ?? this.defaultBranchId,
    );
  }
}
