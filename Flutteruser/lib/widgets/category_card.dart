import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../core/constants/app_colors.dart';
import '../models/category_model.dart';

IconData getCategoryIcon(String slug) {
  final s = slug.toLowerCase();
  if (s.contains('hot-coffee') || s.contains('espresso') || s.contains('coffee')) return LucideIcons.coffee;
  if (s.contains('cold-coffee') || s.contains('iced')) return LucideIcons.cupSoda;
  if (s.contains('matcha')) return LucideIcons.sparkles;
  if (s.contains('pastry') || s.contains('croissant') || s.contains('bagel') || s.contains('bakery')) return LucideIcons.cake;
  if (s.contains('sourdough') || s.contains('toast')) return LucideIcons.utensils;
  if (s.contains('mocktail') || s.contains('mojito') || s.contains('drink')) return LucideIcons.glassWater;
  if (s.contains('burger') || s.contains('sandwich')) return LucideIcons.flame;
  if (s.contains('rice') || s.contains('pasta') || s.contains('meal') || s.contains('mains')) return LucideIcons.utensilsCrossed;
  return LucideIcons.coffee;
}

class CategoryCard extends StatelessWidget {
  final CategoryModel category;
  final bool isSelected;
  final VoidCallback? onTap;

  const CategoryCard({
    super.key,
    required this.category,
    this.isSelected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final iconData = getCategoryIcon(category.slug);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: 66,
            height: 66,
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary : Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
                width: 1.2,
              ),
              boxShadow: isSelected
                  ? const [
                      BoxShadow(
                        color: Color.fromRGBO(242, 92, 39, 0.3),
                        offset: Offset(0, 4),
                        blurRadius: 10,
                      ),
                    ]
                  : const [
                      BoxShadow(
                        color: Color.fromRGBO(15, 23, 42, 0.04),
                        offset: Offset(0, 3),
                        blurRadius: 8,
                      ),
                    ],
            ),
            child: Center(
              child: Icon(
                iconData,
                size: 26,
                color: isSelected ? Colors.white : AppColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 72,
            child: Text(
              category.name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? AppColors.primary : const Color(0xFF334155),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
