import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tezlaa_user_flutter/screens/auth/verify_account_screen.dart';

void main() {
  testWidgets('VerifyAccountScreen renders email, otp fields, and validates input', (WidgetTester tester) async {
    // Set a standard mobile screen size (390x844)
    tester.view.physicalSize = const Size(390 * 2.0, 844 * 2.0);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: VerifyAccountScreen(email: 'customer@tezlaa.com'),
        ),
      ),
    );

    // Initial pump
    await tester.pump();

    // Verify header and email are displayed
    expect(find.text('Verify Your Account'), findsOneWidget);
    expect(find.text('customer@tezlaa.com'), findsOneWidget);
    expect(find.text('Verify & Activate Account'), findsOneWidget);

    // Attempt verify with empty input
    await tester.tap(find.text('Verify & Activate Account'));
    await tester.pump();

    // Expect validation error
    expect(find.text('Please enter the full 6-digit verification code.'), findsOneWidget);

    // Verify resend cooldown message exists
    expect(find.textContaining('Resend in'), findsOneWidget);
  });
}
