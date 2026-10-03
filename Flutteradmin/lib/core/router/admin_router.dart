import 'package:go_router/go_router.dart';
import '../../screens/auth/admin_login_screen.dart';
import '../../screens/admin_main_layout.dart';
import '../../screens/orders/admin_order_detail_screen.dart';

final adminRouter = GoRouter(
  initialLocation: '/admin-login',
  routes: [
    GoRoute(
      path: '/admin-login',
      builder: (context, state) => const AdminLoginScreen(),
    ),
    GoRoute(
      path: '/kds',
      builder: (context, state) => const AdminMainLayout(initialIndex: 0),
    ),
    GoRoute(
      path: '/admin-orders',
      builder: (context, state) => const AdminMainLayout(initialIndex: 1),
    ),
    GoRoute(
      path: '/admin-menu',
      builder: (context, state) => const AdminMainLayout(initialIndex: 2),
    ),
    GoRoute(
      path: '/admin-analytics',
      builder: (context, state) => const AdminMainLayout(initialIndex: 3),
    ),
    GoRoute(
      path: '/admin-settings',
      builder: (context, state) => const AdminMainLayout(initialIndex: 4),
    ),
    GoRoute(
      path: '/admin-order-detail',
      builder: (context, state) {
        final id = state.uri.queryParameters['id'] ?? '';
        return AdminOrderDetailScreen(orderId: id);
      },
    ),
  ],
);
