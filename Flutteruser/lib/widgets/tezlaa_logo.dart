import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class TezlaaLogo extends StatelessWidget {
  final double size;
  final Color? circleColor;
  final Color? textColor;
  final bool showArc;

  const TezlaaLogo({
    super.key,
    this.size = 100,
    this.circleColor,
    this.textColor,
    this.showArc = true,
  });

  @override
  Widget build(BuildContext context) {
    final bg = circleColor ?? AppColors.primary;
    final fg = textColor ?? Colors.white;

    return CustomPaint(
      size: Size(size, size),
      painter: _TezlaaLogoPainter(
        circleColor: bg,
        textColor: fg,
        showArc: showArc,
      ),
    );
  }
}

class _TezlaaLogoPainter extends CustomPainter {
  final Color circleColor;
  final Color textColor;
  final bool showArc;

  _TezlaaLogoPainter({
    required this.circleColor,
    required this.textColor,
    required this.showArc,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // 1. Draw circle background
    final circlePaint = Paint()
      ..color = circleColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, radius, circlePaint);

    // 2. Draw upper arc accent swoosh
    if (showArc) {
      final arcPaint = Paint()
        ..color = Colors.white.withValues(alpha: 0.85)
        ..style = PaintingStyle.stroke
        ..strokeWidth = size.width * 0.045
        ..strokeCap = StrokeCap.round;

      final rect = Rect.fromCircle(center: center, radius: radius * 0.84);
      canvas.drawArc(rect, -1.3, 1.2, false, arcPaint);
    }

    // 3. Draw text TEZLAA
    final fontSize = size.width * 0.23;
    final textPainter = TextPainter(
      text: TextSpan(
        text: 'TEZLAA',
        style: TextStyle(
          color: textColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          fontFamily: 'sans-serif',
          letterSpacing: size.width * 0.015,
        ),
      ),
      textDirection: TextDirection.ltr,
    );

    textPainter.layout();
    final textOffset = Offset(
      center.dx - textPainter.width / 2,
      center.dy - textPainter.height / 2,
    );
    textPainter.paint(canvas, textOffset);
  }

  @override
  bool shouldRepaint(covariant _TezlaaLogoPainter oldDelegate) {
    return oldDelegate.circleColor != circleColor ||
        oldDelegate.textColor != textColor ||
        oldDelegate.showArc != showArc;
  }
}
