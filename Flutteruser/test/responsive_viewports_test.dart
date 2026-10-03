import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tezlaa_user_flutter/screens/auth/login_screen.dart';
import 'package:tezlaa_user_flutter/screens/auth/verify_account_screen.dart';

void main() {
  final viewports = <String, Size>{
    '375x812 (iPhone Small)': const Size(375, 812),
    '390x844 (iPhone Standard)': const Size(390, 844),
    '768x1024 (Tablet Portrait)': const Size(768, 1024),
    '1024x768 (Tablet Landscape)': const Size(1024, 768),
    '1440x900 (Laptop)': const Size(1440, 900),
    '1920x1080 (Desktop FHD)': const Size(1920, 1080),
  };

  group('Customer Responsive Viewport Validation', () {
    for (final entry in viewports.entries) {
      testWidgets('VerifyAccountScreen renders without overflow on ${entry.key}', (tester) async {
        tester.view.physicalSize = entry.value;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          const ProviderScope(
            child: MaterialApp(
              home: VerifyAccountScreen(email: 'vip@tezlaa.com'),
            ),
          ),
        );
        await tester.pump();

        expect(find.text('Verify Your Account'), findsOneWidget);
        expect(tester.takeException(), isNull);
      });

      testWidgets('LoginScreen renders without overflow on ${entry.key}', (tester) async {
        tester.view.physicalSize = entry.value;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });

        await tester.pumpWidget(
          const ProviderScope(
            child: MaterialApp(
              home: LoginScreen(),
            ),
          ),
        );
        await tester.pump();

        expect(find.text('Welcome Back'), findsOneWidget);
        expect(tester.takeException(), isNull);
      });
    }
  });
}
