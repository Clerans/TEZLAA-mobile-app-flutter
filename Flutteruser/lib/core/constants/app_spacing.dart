import 'package:flutter/material.dart';

/// TEZLAA Spacing Tokens
/// Exact 1:1 match to UserFrontend/constants/spacing.ts
class AppSpacing {
  AppSpacing._();

  static const double none = 0.0;
  static const double xs = 4.0;
  static const double sm = 8.0;
  static const double md = 12.0;
  static const double lg = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;
  static const double x4l = 40.0;
  static const double x5l = 48.0;
  static const double x6l = 64.0;

  // Convenient EdgeInsets
  static const EdgeInsets paddingScreen = EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0);
  static const EdgeInsets paddingCard = EdgeInsets.all(16.0);
  static const EdgeInsets paddingInput = EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0);
  static const EdgeInsets paddingButton = EdgeInsets.symmetric(horizontal: 20.0, vertical: 14.0);
}
