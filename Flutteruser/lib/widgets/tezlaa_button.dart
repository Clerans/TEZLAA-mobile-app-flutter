import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';
import '../core/constants/app_radius.dart';

enum TezlaaButtonVariant { primary, secondary, outline, ghost, dark }
enum TezlaaButtonSize { sm, md, lg }

class TezlaaButton extends StatelessWidget {
  final String title;
  final VoidCallback? onPress;
  final TezlaaButtonVariant variant;
  final TezlaaButtonSize size;
  final bool loading;
  final bool disabled;
  final Widget? icon;
  final double? width;
  final EdgeInsetsGeometry? padding;

  const TezlaaButton({
    super.key,
    required this.title,
    required this.onPress,
    this.variant = TezlaaButtonVariant.primary,
    this.size = TezlaaButtonSize.md,
    this.loading = false,
    this.disabled = false,
    this.icon,
    this.width,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color textColor;
    BorderSide border = BorderSide.none;

    switch (variant) {
      case TezlaaButtonVariant.primary:
        bg = AppColors.primary;
        textColor = Colors.white;
        break;
      case TezlaaButtonVariant.secondary:
        bg = AppColors.primaryMuted;
        textColor = AppColors.primaryDark;
        break;
      case TezlaaButtonVariant.outline:
        bg = Colors.transparent;
        textColor = AppColors.primary;
        border = const BorderSide(color: AppColors.primary, width: 1.5);
        break;
      case TezlaaButtonVariant.dark:
        bg = AppColors.neutral900;
        textColor = Colors.white;
        break;
      case TezlaaButtonVariant.ghost:
        bg = Colors.transparent;
        textColor = AppColors.primary;
        break;
    }

    double verticalPadding;
    double horizontalPadding;
    double fontSize;
    double radiusVal;

    switch (size) {
      case TezlaaButtonSize.sm:
        verticalPadding = 8;
        horizontalPadding = 14;
        fontSize = 13;
        radiusVal = AppRadius.md;
        break;
      case TezlaaButtonSize.lg:
        verticalPadding = 16;
        horizontalPadding = 24;
        fontSize = 16;
        radiusVal = AppRadius.lg;
        break;
      case TezlaaButtonSize.md:
        verticalPadding = 12;
        horizontalPadding = 20;
        fontSize = 15;
        radiusVal = AppRadius.md;
        break;
    }

    return SizedBox(
      width: width,
      child: Material(
        color: disabled ? bg.withValues(alpha: 0.5) : bg,
        borderRadius: BorderRadius.circular(radiusVal),
        shape: border != BorderSide.none
            ? RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(radiusVal),
                side: border,
              )
            : null,
        child: InkWell(
          onTap: (disabled || loading) ? null : onPress,
          borderRadius: BorderRadius.circular(radiusVal),
          child: Padding(
            padding: padding ??
                EdgeInsets.symmetric(
                  vertical: verticalPadding,
                  horizontal: horizontalPadding,
                ),
            child: Row(
              mainAxisSize: width == null ? MainAxisSize.min : MainAxisSize.max,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (loading)
                  SizedBox(
                    width: fontSize + 4,
                    height: fontSize + 4,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        variant == TezlaaButtonVariant.primary ||
                                variant == TezlaaButtonVariant.dark
                            ? Colors.white
                            : AppColors.primary,
                      ),
                    ),
                  )
                else ...[
                  if (icon != null) ...[
                    icon!,
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: Text(
                      title,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: textColor,
                        fontSize: fontSize,
                        fontWeight: size == TezlaaButtonSize.lg
                            ? FontWeight.w700
                            : FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
