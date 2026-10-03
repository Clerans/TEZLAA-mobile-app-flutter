class ApiEndpoints {
  ApiEndpoints._();

  static const String baseUrl = 'https://tezlaa-backend-production.up.railway.app/api/v1';
  static const String socketUrl = 'https://tezlaa-backend-production.up.railway.app';

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String forgotPassword = '/auth/forgot-password';
  static const String verifyOtp = '/auth/verify-otp';
  static const String resetPassword = '/auth/reset-password';
  static const String refreshToken = '/auth/refresh';
  static const String me = '/auth/me';
  static const String updateProfile = '/auth/profile';
  static const String changePassword = '/auth/change-password';

  // Catalog
  static const String categories = '/categories';
  static const String products = '/products';
  static const String freshToday = '/products/fresh-today';
  static String productDetail(String id) => '/products/$id';
  static const String branches = '/branches';
  static const String promotions = '/promotions';

  // Cart & Orders
  static const String validateCart = '/orders/validate-cart';
  static const String orders = '/orders';
  static String orderDetail(String id) => '/orders/$id';
  static String cancelOrder(String id) => '/orders/$id/cancel';
  static String reorder(String id) => '/orders/$id/reorder';

  // Coupons
  static const String validateCoupon = '/coupons/validate';

  // Addresses
  static const String addresses = '/addresses';
  static String addressDetail(String id) => '/addresses/$id';
  static String setDefaultAddress(String id) => '/addresses/$id/default';

  // Loyalty & Rewards
  static const String loyaltyAccount = '/loyalty/account';
  static const String loyaltyRewards = '/loyalty/rewards';
  static const String redeemReward = '/loyalty/redeem';

  // Favourites
  static const String favourites = '/favourites';
  static String toggleFavourite(String productId) => '/favourites/$productId/toggle';
  static String removeFavourite(String productId) => '/favourites/$productId';

  // Notifications
  static const String notifications = '/notifications';
  static String markNotificationRead(String id) => '/notifications/$id/read';
  static const String markAllNotificationsRead = '/notifications/read-all';

  // Payments
  static const String createPaymentIntent = '/payments/create-intent';
  static const String verifyPayment = '/payments/verify';
}
