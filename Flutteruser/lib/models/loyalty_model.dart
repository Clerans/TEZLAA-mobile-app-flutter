class LoyaltyRewardModel {
  final String id;
  final String title;
  final String description;
  final int pointsRequired;
  final double discountAmount;
  final String? imageUrl;
  final bool isAvailable;

  LoyaltyRewardModel({
    required this.id,
    required this.title,
    required this.description,
    required this.pointsRequired,
    required this.discountAmount,
    this.imageUrl,
    this.isAvailable = true,
  });

  factory LoyaltyRewardModel.fromJson(Map<String, dynamic> json) {
    return LoyaltyRewardModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      pointsRequired: json['pointsRequired'] ?? 100,
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0.0,
      imageUrl: json['imageUrl'],
      isAvailable: json['isAvailable'] ?? true,
    );
  }
}

class LoyaltyAccountModel {
  final String id;
  final String userId;
  final int points;
  final String tier;
  final int lifetimePoints;

  LoyaltyAccountModel({
    required this.id,
    required this.userId,
    required this.points,
    required this.tier,
    required this.lifetimePoints,
  });

  factory LoyaltyAccountModel.fromJson(Map<String, dynamic> json) {
    return LoyaltyAccountModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      points: json['points'] ?? 0,
      tier: json['tier'] ?? 'BRONZE',
      lifetimePoints: json['lifetimePoints'] ?? 0,
    );
  }
}
