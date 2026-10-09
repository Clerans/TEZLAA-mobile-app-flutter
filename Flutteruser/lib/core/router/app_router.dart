import 'package:go_router/go_router.dart';
import '../../screens/auth/splash_screen.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/auth/register_screen.dart';
import '../../screens/auth/forgot_password_screen.dart';
import '../../screens/auth/verify_otp_screen.dart';
import '../../screens/auth/verify_account_screen.dart';
import '../../screens/tabs/main_tab_layout.dart';
import '../../screens/screens/product_detail_screen.dart';
import '../../screens/screens/checkout_screen.dart';
import '../../screens/screens/order_tracking_screen.dart';
import '../../screens/screens/order_detail_screen.dart';
import '../../screens/screens/orders_history_screen.dart';
import '../../screens/screens/addresses_screen.dart';
import '../../screens/screens/edit_profile_screen.dart';
import '../../screens/screens/favorites_screen.dart';
import '../../screens/screens/notifications_screen.dart';
import '../../screens/screens/support_screen.dart';
import '../../screens/screens/legal_screen.dart';
import '../../screens/screens/branch_screen.dart';

import '../../services/storage_service.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final token = await StorageService().getAccessToken();
    final isAuthenticated = token != null && token.isNotEmpty;

    const protectedPrefixes = [
      '/checkout',
      '/orders-history',
      '/order-detail',
      '/order-tracking',
      '/addresses',
      '/edit-profile',
      '/favorites',
      '/notifications',
    ];

    final isProtected = protectedPrefixes.any((p) => state.uri.path.startsWith(p));

    if (!isAuthenticated && isProtected) {
      return '/login';
    }

    if (isAuthenticated && (state.uri.path == '/login' || state.uri.path == '/register')) {
      return '/home';
    }

    return null;
  },
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/verify-otp',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        return VerifyOtpScreen(email: email);
      },
    ),
    GoRoute(
      path: '/verify-account',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        return VerifyAccountScreen(email: email);
      },
    ),
    // Main Tabs
    GoRoute(
      path: '/home',
      builder: (context, state) => const MainTabLayout(initialIndex: 0),
    ),
    GoRoute(
      path: '/menu',
      builder: (context, state) => const MainTabLayout(initialIndex: 1),
    ),
    GoRoute(
      path: '/cart',
      builder: (context, state) => const MainTabLayout(initialIndex: 2),
    ),
    GoRoute(
      path: '/loyalty',
      builder: (context, state) => const MainTabLayout(initialIndex: 3),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const MainTabLayout(initialIndex: 4),
    ),
    // Sub-screens
    GoRoute(
      path: '/product/:id',
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        return ProductDetailScreen(productId: id);
      },
    ),
    GoRoute(
      path: '/checkout',
      builder: (context, state) => const CheckoutScreen(),
    ),
    GoRoute(
      path: '/order-tracking',
      builder: (context, state) {
        final orderId = state.uri.queryParameters['orderId'] ?? '';
        final orderNumber = state.uri.queryParameters['orderNumber'];
        return OrderTrackingScreen(orderId: orderId, orderNumber: orderNumber);
      },
    ),
    GoRoute(
      path: '/order-detail',
      builder: (context, state) {
        final id = state.uri.queryParameters['id'] ?? '';
        return OrderDetailScreen(orderId: id);
      },
    ),
    GoRoute(
      path: '/orders-history',
      builder: (context, state) => const OrdersHistoryScreen(),
    ),
    GoRoute(
      path: '/addresses',
      builder: (context, state) => const AddressesScreen(),
    ),
    GoRoute(
      path: '/edit-profile',
      builder: (context, state) => const EditProfileScreen(),
    ),
    GoRoute(
      path: '/favorites',
      builder: (context, state) => const FavoritesScreen(),
    ),
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/support',
      builder: (context, state) => const SupportScreen(),
    ),
    GoRoute(
      path: '/branch',
      builder: (context, state) => const BranchScreen(),
    ),
    GoRoute(
      path: '/terms',
      builder: (context, state) => const LegalScreen(
        title: 'Terms of Service',
        content: 'Welcome to TEZLAA Artisan Café. By placing orders or accessing our digital platforms, you agree to comply with our customer terms, payment agreements, and order fulfillment policies.',
      ),
    ),
    GoRoute(
      path: '/privacy',
      builder: (context, state) => const LegalScreen(
        title: 'Privacy Policy',
        content: 'Your privacy is paramount. TEZLAA securely stores delivery coordinates and customer profile credentials in accordance with global data protection protocols. We never sell your personal information.',
      ),
    ),
  ],
);
