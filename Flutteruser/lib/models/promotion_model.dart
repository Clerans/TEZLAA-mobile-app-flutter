class PromotionModel {
  final String id;
  final String title;
  final String subtitle;
  final String? code;
  final String? discountText;
  final String imageUrl;
  final String? actionUrl;
  final bool isActive;

  PromotionModel({
    required this.id,
    required this.title,
    required this.subtitle,
    this.code,
    this.discountText,
    required this.imageUrl,
    this.actionUrl,
    this.isActive = true,
  });

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    return PromotionModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      subtitle: json['subtitle'] ?? json['description'] ?? '',
      code: json['code'],
      discountText: json['discountText'],
      imageUrl: json['imageUrl'] ?? json['bannerUrl'] ?? '',
      actionUrl: json['actionUrl'],
      isActive: json['isActive'] ?? true,
    );
  }
}
