# TEZLAA — Deep Project Analysis & CL To-Do
**Generated**: October 2026 | **Scope**: Backend, Flutteruser, Flutteradmin

---

## 🏗️ WHAT IS BEING BUILT

**TEZLAA** is a full-stack production **Artisan Food & Café ecosystem** — real-time food ordering, payment, kitchen dispatch (KDS), and loyalty platform for a multi-branch café chain in Sri Lanka (LKR currency, PayHere gateway).

### Three Applications
| App | Stack | Purpose |
|:----|:------|:--------|
| **Backend** | Node.js 20, Express, TypeScript, Prisma, PostgreSQL, Socket.IO | REST API + WebSocket server |
| **Flutteruser** | Flutter 3.24+, Riverpod, GoRouter, Dio | Customer mobile app |
| **Flutteradmin** | Flutter 3.24+, Riverpod, GoRouter, Dio | Staff / KDS tablet app |

**Live**: `https://tezlaa-mobile-app-flutter.onrender.com/api/v1` (Render + Supabase PostgreSQL)

---

## 🔬 ARCHITECTURE ANALYSIS

### Backend — Controller → Service → Repository

14 route modules: auth, categories, products, branches, promotions, orders, payments, addresses, coupons, notifications, loyalty, favourites, admin, health

**Core Services:**
- `auth.service.ts` — Register+OTP (`REGISTER$` prefix), Login (blocks unverified), JWT access+refresh, password reset (`RESET$` prefix)
- `order.service.ts` — Authoritative cart pricing, Order State Machine, UUID idempotency, IDOR protection
- `payment.service.ts` — PayHere MD5 checkout, webhook HMAC verify, all 5 codes (2=CONFIRMED, 0=PENDING, -1=CANCELLED, -2=FAILED, -3=CHARGEBACK)
- `loyalty.service.ts` — BRONZE/SILVER/GOLD/PLATINUM tiers (10%–20% earn rates), reservation/commit/release, chargeback reversal
- `reservation.service.ts` — Background worker every 5 min expires stale reservations >30 min
- `sockets/index.ts` — DB-authoritative JWT auth, room isolation

**WebSocket Rooms:**
| Room | Members | Events |
|:-----|:--------|:-------|
| `user:{userId}` | Every customer (auto-join) | `notification:new`, `order:status_updated` |
| `order:{orderId}` | Customer on tracking screen | `order:status_updated`, `order:updated` |
| `branch:{branchId}` | BRANCH_STAFF, BRANCH_MANAGER | `order:created`, `order:status_updated` |
| `admin:orders` | ADMIN only | All order events |

**Order State Machine:**
```
DELIVERY: PENDING→CONFIRMED→PREPARING→READY→OUT_FOR_DELIVERY→DELIVERED
PICKUP:   PENDING→CONFIRMED→PREPARING→READY→READY_FOR_PICKUP→PICKED_UP
Both:     PENDING→CANCELLED / CONFIRMED→CANCELLED
```

### Database (PostgreSQL / Prisma)
15+ models: User, Address, Branch, Category, Product, ProductVariant, ProductAddon, Order, OrderItem, Payment, LoyaltyAccount, LoyaltyTransaction, Reward, LoyaltyReservation, CouponReservation, LoyaltyAward, Coupon, Promotion, Favourite, Notification
10 enums: UserRole, OrderType, OrderStatus, PaymentMethod, PaymentStatus, ReservationStatus, LoyaltyTier, LoyaltyTxType, DiscountType, NotificationType

### Flutteruser (Customer App)
**Providers:** authProvider, cartProvider, appProvider (branch+orderType), catalogProvider, orderDetailProvider, loyaltyAccountProvider

**Screens:** Splash → Login/Register → VerifyAccount(OTP+60s timer) → Home/Menu/Cart/Loyalty/Profile tabs → ProductDetail → Checkout → OrderTracking → OrderHistory → Addresses → EditProfile → Favorites → Notifications → Support → Branch → Legal

**Checkout:** Local cart → `POST /orders/validate-cart` (server re-prices) → notices shown → COD or CARD → `POST /orders` → track or PayHere gateway → poll status

### Flutteradmin (Staff / KDS App)
**Providers:** adminAuthProvider (blocks CUSTOMER role), kdsOrdersProvider (socket + 25s heartbeat), adminOrdersListProvider, adminAnalyticsProvider

**Screens:** AdminLogin → KDS (dark theme, live cards, filter chips, one-tap status advance) → Orders → Analytics → Menu (availability toggle, CRUD) → Customers → ManagementHub

---

## ✅ COMPLETED

- Full Backend REST API (14 modules, all CRUD operations)
- JWT auth with access + refresh token pair
- OTP purpose separation (REGISTER$ / RESET$ prefix in DB)
- Server-authoritative cart pricing + pre-checkout validation endpoint
- Complete Order State Machine (delivery + pickup paths)
- PayHere: MD5 signed checkout params
- PayHere webhook: all 5 status codes (2, 0, -1, -2, -3) + chargeback loyalty point reversal
- Loyalty: earn points, tier upgrades, reservation, redemption
- Coupon: reservation / commit / release / expiry lifecycle
- Background reservation expiry worker (5-min interval)
- Socket.IO: DB-authoritative JWT auth middleware + room isolation
- KDS: real-time socket + 25s heartbeat fallback
- Flutteruser: all 14+ screens built
- VerifyAccountScreen with OTP input + 60s resend countdown timer
- Flutteradmin: KDS, Orders, Analytics, Menu, Customers screens
- Backend: 40 automated tests passing (5 suites)
- Flutter apps: 0 lint issues, all widget tests passing
- Release APKs built (User 56.22 MB, Admin 54.80 MB)
- Backend deployed live on Render


---

## 🔴 OPEN TO-DO — P0 Critical

#### [TODO-01] PayHere: Secure Checkout Launch (Flutteruser)
- **Problem**: `checkout_screen.dart` uses `url_launcher` GET URL — signed payment params are visible in browser history and server logs.
- **Fix**: Replace with the official PayHere Flutter SDK or a POST-based form submission.
- **File**: `Flutteruser/lib/screens/screens/checkout_screen.dart`

#### [TODO-02] PayHere: Preserve Cart on Cancellation (Flutteruser)
- **Problem**: Cart is cleared immediately after order placement. If the customer cancels the PayHere gateway they lose their cart with no retry path.
- **Fix**: Only call `clearCart()` after a verified `COMPLETED` payment webhook — never on order placement alone.
- **File**: `Flutteruser/lib/screens/screens/checkout_screen.dart`

#### [TODO-03] WebSocket: BRANCH_STAFF Room Isolation (Backend)
- **Problem**: `sockets/index.ts` places BRANCH_STAFF in `admin:orders`, violating branch isolation (staff at Branch A receives all-branch events).
- **Fix**: BRANCH_STAFF joins only `branch:{branchId}`. Only ADMIN joins `admin:orders`.
- **File**: `Backend/src/sockets/index.ts`

#### [TODO-04] WebSocket: Debounce Socket Event Triggers (Both Flutter Apps)
- **Problem**: Rapid successive socket events trigger immediate API re-fetches, causing duplicate calls and race conditions on the order tracking screen and KDS.
- **Fix**: Wrap socket event handlers with a 300ms debounce before calling `ref.invalidate()` or `fetchActive()`.
- **Files**: `Flutteruser/lib/providers/order_provider.dart`, `Flutteradmin/lib/providers/admin_providers.dart`

---

## 🟠 P1 — High Priority

#### [TODO-05] Admin: Remove Silent Fallbacks (Flutteradmin)
- **Problem**: `AdminProductService.getProducts()` silently falls back to public `/products` endpoint on admin failure — hides real errors from staff.
- **Fix**: Replace `catch → []` with typed errors. All screens must show Loading / Error+Retry / Empty / Data states — never silently show zero data.
- **File**: `Flutteradmin/lib/services/admin_services.dart`

#### [TODO-06] Admin Analytics: Remove Hardcoded Growth Badge (Flutteradmin)
- **Problem**: `admin_analytics_screen.dart` shows hardcoded `'+18.4% compared to previous cycle'` — fake data presented as real analytics.
- **Fix**: Compute real period-over-period from the API, or remove the badge.
- **File**: `Flutteradmin/lib/screens/analytics/admin_analytics_screen.dart`

#### [TODO-07] Checkout: Server-Authoritative Delivery Fee (Flutteruser)
- **Problem**: `cart_provider.dart` hardcodes `350.0` delivery fee. The server's `validate-cart` already returns `deliveryFee` and `isFreeDelivery` — the UI ignores them.
- **Fix**: Read and display `_serverCartData['deliveryFee']` in CheckoutScreen instead of the hardcoded value.
- **Files**: `Flutteruser/lib/providers/cart_provider.dart`, `Flutteruser/lib/screens/screens/checkout_screen.dart`

#### [TODO-08] CORS: Production Origin Guard (Backend)
- **Problem**: Risk that `CORS_ORIGIN=*` is deployed to production on Render.
- **Fix**: Add a startup assertion in `env.ts` that throws if `NODE_ENV=production && CORS_ORIGIN=*`. Set an explicit origin list on Render.
- **File**: `Backend/src/config/env.ts`

#### [TODO-09] JWT TTL: Reduce Access Token Lifetime (Backend)
- **Problem**: `JWT_EXPIRES_IN=7d` — a compromised access token remains valid for a full 7 days in a payment application. The refresh token flow exists but the long access TTL negates its security benefit.
- **Fix**: Reduce to `15m` or `1h`. Ensure Flutter apps actively use the refresh token to silently re-authenticate without logging the user out.
- **Files**: `Backend/src/services/auth.service.ts`, `Flutteruser/lib/services/api_client.dart`

#### [TODO-10] Order Tracking: Error Retry State (Flutteruser)
- **Problem**: The error state on `order_tracking_screen.dart` shows only static text with no retry button — the user is permanently stuck and must leave the screen.
- **Fix**: Replace the text-only error widget with an error card showing the error message and a Retry button that calls `ref.invalidate(orderDetailProvider(orderId))`.
- **File**: `Flutteruser/lib/screens/screens/order_tracking_screen.dart`

---

## 🟡 P2 — Medium Priority

#### [TODO-11] Responsive Layout Testing (Both Flutter Apps)
- Validate all screens across: 375×812 (iPhone SE) → 390×844 (iPhone 14) → 768×1024 (iPad) → 1920×1080 (desktop/web)
- Focus areas: KDS card grid on wide tablets, checkout form on small phones

#### [TODO-12] Push Notifications: FCM Integration (Not Started)
- **Problem**: All notifications are in-app only — customers receive no background push when the app is closed.
- **Fix**: Add FCM token registration on login. Call FCM from `notification.service.ts` on key order status transitions.
- **Files**: `Backend/src/services/notification.service.ts`, `Flutteruser/lib/main.dart`, `Flutteradmin/lib/main.dart`

#### [TODO-13] Cloudinary: Image Upload Endpoint (Not Started)
- **Problem**: Admin product create/edit has no image upload UI. Cloudinary credentials are configured but no upload endpoint exists.
- **Fix**: Add `POST /admin/products/upload-image` using Cloudinary SDK. Add image picker + upload in `admin_menu_screen.dart`.
- **Files**: Backend controllers/routes, `Flutteradmin/lib/screens/menu/admin_menu_screen.dart`

#### [TODO-14] Brevo Email: Order Confirmation + Status Update Emails (Backend)
- **Problem**: Only OTP emails are sent today. No order confirmation or status update emails dispatched to customers.
- **Fix**: Add `sendOrderConfirmationEmail()` in `order.service.ts` and `sendOrderStatusUpdateEmail()` in `payment.service.ts`.
- **File**: `Backend/src/services/email.service.ts`

#### [TODO-16] SMS Gateway: Integrate Real Provider (Backend)
- **Problem**: `sms.service.ts` runs with `SMS_PROVIDER=mock` — OTP SMS messages are never actually sent to customers in production; the mock just logs to console.
- **Fix**: Integrate a real Sri Lankan SMS provider (Dialog Axiata API, Mobitel, or Twilio). Configure `SMS_PROVIDER` and credentials on Render.
- **File**: `Backend/src/services/sms.service.ts`

#### [TODO-17] Playwright E2E Test Suite (Not Started)
- **Customer path**: register → OTP verify → browse menu → add to cart → checkout (COD) → track order
- **Admin path**: login → KDS → advance order status
- **Reference**: TASKS.md Phase 12–16


---

## 📊 COMPLETION ESTIMATE

| Area | Done | Remaining Gaps |
|:-----|:-----|:---------------|
| Backend API & Services | ~95% | SMS provider, email confirmations |
| Backend Security | ~90% | BRANCH_STAFF socket isolation, production CORS assertion |
| Flutteruser Screens | ~90% | Secure PayHere launch, cart-on-cancel, error retry states |
| Flutteradmin Screens | ~75% | Management hub CRUD screens, silent fallback removal |
| Real-time / Sockets | ~85% | 300ms debounce, BRANCH_STAFF isolation |
| Testing | ~80% | Playwright E2E suite |
| Production Infrastructure | ~85% | FCM push, Cloudinary upload endpoint |

---

## 🗂️ KEY FILE LOCATIONS

```
FLUTTER/
├── README.md, RULES.md, TASKS.md
├── docs/ — PRD, ARCHITECTURE, DESIGN, SECURITY, API_CONTRACTS,
│           TEST_PLAN, DECISIONS, MEMORY, PRODUCTION_READINESS
├── Backend/
│   ├── src/
│   │   ├── app.ts, server.ts
│   │   ├── config/ (database.ts, env.ts)
│   │   ├── controllers/ (14 files)
│   │   ├── services/ (15 files — core business logic)
│   │   ├── repositories/ (14 files — Prisma data access)
│   │   ├── routes/ (14 files + index.ts)
│   │   ├── middleware/ (authMiddleware, errorHandler, validate)
│   │   ├── sockets/index.ts     ← WebSocket rooms + auth middleware
│   │   ├── validators/ (zod schemas)
│   │   ├── utils/ (apiError, apiResponse, money, password)
│   │   └── __tests__/ (5 suites, 40 tests)
│   └── prisma/ (schema.prisma, seed.ts, migrations/)
├── Flutteruser/lib/
│   ├── main.dart, core/ (constants, router, theme)
│   ├── models/ (9 models), providers/ (6 providers)
│   ├── screens/auth/, screens/tabs/, screens/screens/
│   ├── services/ (12 services)
│   └── widgets/ (7 reusable widgets)
└── Flutteradmin/lib/
    ├── main.dart, core/ (constants, network, router)
    ├── models/admin_models.dart
    ├── providers/admin_providers.dart
    ├── screens/ (kds, analytics, orders, menu, customers, more, settings)
    └── services/ (admin_services, admin_socket_service, storage_service)
```

---

## 🔑 KEY TECHNICAL DECISIONS

1. **No client-side pricing trust** — server re-validates all prices at checkout; client prices are advisory hints only
2. **PayHere over Stripe** — dominant Sri Lanka payment gateway; LKR-native
3. **Prisma over raw SQL** — type safety, migration history, Supabase compatibility
4. **Riverpod over Bloc** — concise, composable, testable state without boilerplate
5. **GoRouter** — declarative routing, deep links, auth redirect guards built-in
6. **Socket.IO over raw WebSocket** — auto-reconnect, room abstractions, fallback polling
7. **25s heartbeat** — stays well under 200 req/15 min rate limit (~36 req/15 min max from heartbeat)
8. **Reservation pattern** — loyalty points + coupons reserved at checkout, consumed only on confirmed payment; prevents double-spend without distributed locks
9. **bcrypt OTP hashing** — OTPs never stored in plaintext; stored as `PURPOSE$bcryptHash` to prevent cross-purpose reuse attacks
10. **LoyaltyAward idempotency guard** — `LoyaltyAward` model acts as a deduplication record so points are never awarded twice for the same order

#### [TODO-16] SMS Gateway: Integrate Real Provider (Backend)
- **Problem**: `sms.service.ts` runs `SMS_PROVIDER=mock` — OTPs are never actually sent via SMS in production.
- **Fix**: Integrate Dialog Axiata API, Mobitel, or Twilio. Configure `SMS_PROVIDER` on Render.
- **File**: `Backend/src/services/sms.service.ts`

#### [TODO-17] Playwright E2E Test Suite (Not Started)
- Customer path: register → OTP verify → browse menu → add to cart → checkout (COD) → track order
- Admin path: login → KDS → advance order status
- Reference: TASKS.md Phase 12-16


- **Problem**: `JWT_EXPIRES_IN=7d` — a compromised token is valid for 7 full days in a payment application.
- **Fix**: Reduce to `15m` or `1h`. Ensure Flutter apps use the refresh token flow to silently re-authenticate.
- **Files**: `Backend/src/services/auth.service.ts`, `Flutteruser/lib/services/api_client.dart`

#### [TODO-10] Order Tracking: Error Retry State (Flutteruser)
- **Problem**: Error state shows only static text with no retry button — user is permanently stuck.
- **Fix**: Show an error card with message and a Retry button calling `ref.invalidate(orderDetailProvider(orderId))`.
- **File**: `Flutteruser/lib/screens/screens/order_tracking_screen.dart`


- **Problem**: `sockets/index.ts` places BRANCH_STAFF in `admin:orders`, violating branch isolation (receives all-branch events).
- **Fix**: BRANCH_STAFF joins only `branch:{branchId}`. Only ADMIN joins `admin:orders`.
- **File**: `Backend/src/sockets/index.ts`

#### [TODO-04] WebSocket: Debounce Socket Event Triggers (Both Flutter Apps)
- **Problem**: Rapid successive socket events trigger immediate API re-fetches — no debounce, causing duplicate calls and race conditions.
- **Fix**: 300ms debounce before `ref.invalidate()` or `fetchActive()`.
- **Files**: `Flutteruser/lib/providers/order_provider.dart`, `Flutteradmin/lib/providers/admin_providers.dart`


- Full Backend REST API (14 modules, all CRUD)
- JWT auth: access + refresh token pair
- OTP purpose separation (REGISTER$ / RESET$ prefix)
- Server-authoritative cart pricing + pre-checkout validation
- Full Order State Machine (delivery + pickup)
- PayHere: MD5 signed checkout params
- PayHere: all 5 webhook status codes (2, 0, -1, -2, -3) + chargeback loyalty reversal
- Loyalty: earn, tier upgrades, reservation, redemption
- Coupon: reservation / commit / release / expiry
- Background reservation expiry worker (5-min interval)
- Socket.IO: DB-authoritative auth middleware + room isolation
- KDS: real-time socket + 25s heartbeat fallback
- Flutteruser: all 14+ screens built
- VerifyAccountScreen: OTP input + 60s resend timer
- Flutteradmin: KDS, Orders, Analytics, Menu, Customers
- 40 backend tests passing (5 suites)
- Flutter: 0 lint issues, all widget tests passing
- Release APKs built (User 56.22 MB, Admin 54.80 MB)
- Backend deployed live on Render

---
