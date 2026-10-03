import 'package:flutter/material.dart';

class AppShadows {
  AppShadows._();

  static const List<BoxShadow> none = [];

  static const List<BoxShadow> sm = [
    BoxShadow(
      color: Color.fromRGBO(0, 0, 0, 0.05),
      offset: Offset(0, 1),
      blurRadius: 3,
    ),
  ];

  static const List<BoxShadow> card = [
    BoxShadow(
      color: Color.fromRGBO(15, 23, 42, 0.06),
      offset: Offset(0, 2),
      blurRadius: 8,
    ),
  ];

  static const List<BoxShadow> md = [
    BoxShadow(
      color: Color.fromRGBO(15, 23, 42, 0.08),
      offset: Offset(0, 4),
      blurRadius: 12,
    ),
  ];

  static const List<BoxShadow> lg = [
    BoxShadow(
      color: Color.fromRGBO(15, 23, 42, 0.12),
      offset: Offset(0, 8),
      blurRadius: 20,
    ),
  ];

  static const List<BoxShadow> brandGlow = [
    BoxShadow(
      color: Color.fromRGBO(242, 92, 39, 0.35),
      offset: Offset(0, 6),
      blurRadius: 14,
    ),
  ];
}
