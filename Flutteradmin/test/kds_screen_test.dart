import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tezlaa_admin_flutter/models/admin_models.dart';
import 'package:tezlaa_admin_flutter/providers/admin_providers.dart';
import 'package:tezlaa_admin_flutter/screens/kds/kds_screen.dart';

void main() {
  testWidgets('KdsScreen shows empty state when no active orders', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          kdsOrdersProvider.overrideWith((ref) => Stream.value(<AdminOrderModel>[])),
        ],
        child: const MaterialApp(
          home: KdsScreen(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('KDS LIVE TERMINAL'), findsOneWidget);
    expect(find.text('All Orders Clear!'), findsOneWidget);
    expect(find.text('Waiting for new orders from TEZLAA Cloud...'), findsOneWidget);
  });

  testWidgets('KdsScreen shows error & retry UI when stream emits error', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          kdsOrdersProvider.overrideWith((ref) => Stream.error(Exception('Network timeout'))),
        ],
        child: const MaterialApp(
          home: KdsScreen(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('KDS Connection Interrupted'), findsOneWidget);
    expect(find.text('Retry Connection'), findsOneWidget);
  });
}
