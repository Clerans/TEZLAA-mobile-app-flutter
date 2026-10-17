# TEZLAA — Project Status, Completed Verifications & Remaining To-Do
**Updated**: October 2026 | **Scope**: Backend, Flutteruser, Flutteradmin  
**Status**: Production Release Candidate 1 (RC1)

---

## 🏗️ SYSTEM ARCHITECTURE & SCOPE

**TEZLAA** is a full-stack production **Artisan Food & Café ecosystem** — real-time food ordering, payments, kitchen dispatch (KDS), and loyalty platform for a multi-branch café chain in Sri Lanka (LKR currency, PayHere gateway).

### Three Core Applications
| Application | Stack | Purpose | Deployment / Status |
|:---|:---|:---|:---|
| **Backend** | Node.js 20, Express, TypeScript, Prisma, PostgreSQL, Socket.IO | Layered REST API & WebSocket server | Live on Render + Supabase PostgreSQL |
| **Flutteruser** | Flutter 3.24+, Riverpod, GoRouter, Dio | Customer-facing ordering mobile app | Release APK built (56.22 MB) |
| **Flutteradmin** | Flutter 3.24+, Riverpod, GoRouter, Dio | Staff, Branch Management & KDS app | Release APK built (54.80 MB) |

**Live Production API**: `https://tezlaa-mobile-app-flutter.onrender.com/api/v1`

---

## ✅ WHAT HAS BEEN FULLY IMPLEMENTED & VERIFIED (COMPLETED)

All of the following items have been fully audited, implemented, and verified in the source code with passing automated test suites:

### 1. Payment State Machine & Financial Integrity
- [x] **PayHere 5-Status Webhook Handler** (`Backend/src/services/payment.service.ts`):
  - `2` (COMPLETED): Orders marked `CONFIRMED`, payment marked `COMPLETED`, coupon and loyalty reservations atomically consumed.
  - `0` (PENDING): Payment marked `PENDING`, reservations retained, order remains `PENDING`.
  - `-1` (CANCELLED): Payment marked `CANCELLED`, order cancelled, reservations released.
  - `-2` (FAILED): Payment marked `FAILED`, reservations released.
  - `-3` (CHARGEBACK): Payment marked `DISPUTED`, audit trail logged, awarded loyalty points reversed.
- [x] **Out-of-Order Webhook Protection**: Delayed failure or pending callbacks arriving after a payment has already completed are safely ignored without regressing state.
- [x] **Cancelled Order Payment Reconciliation**: If payment succeeds for an order that was previously cancelled, it is captured with `flaggedForReconciliation: true` while preserving `CANCELLED` status for refund auditing.
- [x] **PayHere MD5 Checksum**: Webhook notification signatures and checkout parameters verified against secret key hashes.
- [x] **Cart Preservation on Cancellation** (`Flutteruser/lib/screens/screens/checkout_screen.dart`): Cart items are preserved if the customer dismisses or cancels PayHere gateway; cart is cleared only upon verified `COMPLETED` or `PENDING` payment.

### 2. Server-Authoritative Pricing & Delivery Boundary
- [x] **Server-Authoritative Cart Validation** (`Backend/src/services/order.service.ts`): Pre-checkout `POST /orders/validate-cart` endpoint recalculates base product price, variant price, addon quantity limits, and discounts directly from PostgreSQL.
- [x] **Required Add-on Enforcement**: Backend rejects orders missing mandatory addons (e.g., choice of milk).
- [x] **Haversine Delivery Radius Boundary**: Delivery orders are verified against the branch's geographic coordinates and `deliveryRadiusKm`; addresses exceeding the radius are rejected.
- [x] **Server-Authoritative Delivery Fee in UI** (`Flutteruser/lib/screens/screens/checkout_screen.dart`): Checkout screen displays the server's calculated `deliveryFee` and `isFreeDelivery` flag.

### 3. Authentication, Security & Session Management
- [x] **OTP Purpose Separation** (`Backend/src/services/auth.service.ts`): Cryptographically secure OTP generation (`crypto.randomInt`), bcrypt hashed in database with strict prefixes (`REGISTER$`, `RESET_PASSWORD$`). Prevents cross-purpose replay attacks.
- [x] **Unverified Account Gate**: Users cannot log in or obtain JWT tokens until email verification is complete.
- [x] **60-Second Cooldown & 5-Attempt Lockout**: Database enforces resend cooldown and locks out brute-force attempts.
- [x] **Dedicated Verification UI** (`Flutteruser/lib/screens/auth/verify_account_screen.dart`): Dedicated screen with 6-digit OTP input, live resend cooldown timer, and error handling.
- [x] **Production CORS Assertion** (`Backend/src/config/env.ts`): Startup validation throws an error if `NODE_ENV=production` and `CORS_ORIGIN=*`.
- [x] **Session Refresh Parity** (`Flutteradmin` & `Flutteruser`):
  - `Flutteradmin/lib/services/storage_service.dart` stores both access and refresh tokens.
  - `Flutteradmin/lib/core/network/api_client.dart` features an automatic 401 refresh token interceptor that hits `POST /auth/refresh` to renew expired sessions silently.

### 4. Real-Time WebSockets & Concurrency Hardening
- [x] **Database-Authoritative Socket Handshake** (`Backend/src/sockets/index.ts`): Socket connections re-verify the user's active status, current role, and branch assignment against PostgreSQL on every handshake.
- [x] **Branch Isolation**: `BRANCH_STAFF` is strictly restricted to `branch:{branchId}` and prohibited from joining `admin:orders`.
- [x] **Order Room Access Control**: Customers can only join their own orders; staff can only join orders belonging to their assigned branch; admins can join any order.
- [x] **WebSocket Debounce Protection** (Both Flutter Apps):
  - `Flutteruser/lib/providers/order_provider.dart`: Added a 300ms debounce timer to `orderDetailProvider` socket invalidation.
  - `Flutteradmin/lib/providers/admin_providers.dart`: Added a 300ms debounce timer to `kdsOrdersProvider` socket subscription. Eliminates API flooding and race conditions during order bursts.

### 5. UI/UX & Administrative Data Integrity
- [x] **Elimination of Silent Fallbacks** (`Flutteradmin/lib/services/admin_services.dart`): Removed silent `catch` fallbacks to customer catalog endpoints in `AdminProductService.getProducts()` and `AdminCategoryService.getCategories()`. Real typed errors are exposed so staff see actionable error states.
- [x] **Correction of Fabricated Analytics Data** (`Flutteradmin/lib/screens/analytics/admin_analytics_screen.dart`): Removed hardcoded `+18.4% compared to previous cycle` badge; replaced with authoritative live aggregated metric indicator.
- [x] **Interactive Order Tracking Error State** (`Flutteruser/lib/screens/screens/order_tracking_screen.dart`): Replaced static text with an error card containing the error message, a "Retry Live Tracking" button, and a navigation link to return to Home.
- [x] **Responsive Viewport Validation**: Form inputs, navigation, and KDS card grid verified across 6 viewports (375×812 phone up to 1920×1080 desktop/monitor) with 0 RenderFlex overflow issues.

---

## 🔴 WHAT NEEDS TO BE DEVELOPED (REMAINING ROADMAP)

The following items are the remaining development tasks for future feature enhancements and third-party production infrastructure integrations:

---

### 🟠 P1 — High Priority (Production Infrastructure & Integration)

#### [DEV-01] Real SMS Gateway Integration (Backend)
- **Current State**: `sms.service.ts` currently runs with `SMS_PROVIDER=mock`, which logs OTP codes to the console rather than dispatching real SMS messages.
- **What to Develop**:
  1. Integrate a Sri Lankan SMS gateway API (Dialog Axiata IdeaBiz, Mobitel, or Twilio).
  2. Map recipient phone format to Sri Lankan E.164 (`+947XXXXXXXX`).
  3. Configure production credentials (`SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID`) in Render environment variables.
- **Affected Files**: `Backend/src/services/sms.service.ts`, `Backend/src/config/env.ts`

#### [DEV-02] Customer Order Email Confirmations & Receipts (Backend)
- **Current State**: Brevo/Nodemailer service currently sends only OTP verification emails. Customers do not receive email confirmation when an order is confirmed or delivered.
- **What to Develop**:
  1. Create `sendOrderConfirmationEmail(order)` with formatted HTML receipt (items, subtotal, delivery fee, order number).
  2. Create `sendOrderStatusEmail(order, status)` for key milestones (`CONFIRMED`, `OUT_FOR_DELIVERY`, `DELIVERED`).
  3. Hook into `payment.service.ts` (upon status `2` COMPLETED) and `order.service.ts` (upon COD order placement).
- **Affected Files**: `Backend/src/services/email.service.ts`, `Backend/src/services/order.service.ts`, `Backend/src/services/payment.service.ts`

#### [DEV-03] In-App PayHere Checkout / Webview (Flutteruser)
- **Current State**: `checkout_screen.dart` uses `url_launcher` to open the PayHere payment gateway in the device's external browser.
- **What to Develop**:
  1. Upgrade to the official `payhere_mobilesdk_flutter` or an in-app secure Webview with a POST form bridge.
  2. Keep payment parameters private and eliminate URL query-parameter exposure in external browser history.
  3. Handle payment completion callback via deep link or Javascript channel to return directly to the app without manual verification modals.
- **Affected Files**: `Flutteruser/lib/screens/screens/checkout_screen.dart`, `Flutteruser/pubspec.yaml`

---

### 🟡 P2 — Medium Priority (Platform Enhancements)

#### [DEV-04] Push Notifications via Firebase Cloud Messaging (Backend + Flutter)
- **Current State**: Notifications are received in real-time via Socket.IO only while the app is actively open in the foreground. No push notifications are received when the app is closed or backgrounded.
- **What to Develop**:
  1. Add `fcmToken` column to `User` model in `schema.prisma`.
  2. Create `POST /users/fcm-token` endpoint in backend to store and update device push tokens.
  3. Implement Firebase Admin SDK in `Backend/src/services/notification.service.ts` to dispatch background push alerts on order status changes.
  4. Initialize `firebase_messaging` in `Flutteruser/lib/main.dart` and `Flutteradmin/lib/main.dart`.
- **Affected Files**: `Backend/prisma/schema.prisma`, `Backend/src/services/notification.service.ts`, `Flutteruser/lib/main.dart`

#### [DEV-05] Cloudinary Product Image Upload Endpoint & Admin UI
- **Current State**: Products require entering an image URL string manually. Cloudinary credentials exist in `env.ts`, but there is no direct image upload endpoint or UI picker.
- **What to Develop**:
  1. Add `multer` or direct streaming upload route: `POST /api/v1/admin/products/upload-image`.
  2. Upload incoming image buffer to Cloudinary and return optimized URL.
  3. Add image picker button and thumbnail preview in `Flutteradmin/lib/screens/menu/admin_menu_screen.dart`.
- **Affected Files**: `Backend/src/controllers/admin.controller.ts`, `Backend/src/routes/admin.routes.ts`, `Flutteradmin/lib/screens/menu/admin_menu_screen.dart`

#### [DEV-06] Playwright End-to-End Automated Testing Suite
- **Current State**: Unit tests (Jest: 45 tests) and Flutter widget tests (Flutter Test: 23 tests) are complete, but no automated browser-based E2E pipeline exists.
- **What to Develop**:
  1. Set up a Playwright test runner simulating the full customer path:
     - Register → Verify OTP → Browse Menu → Add to Cart → Validate Cart → Checkout COD → Track Order.
  2. Simulate the staff path:
     - Staff Login → Open KDS → Receive Order via Socket → Advance Status to `PREPARING` → Advance to `READY` → Verify Customer Tracking updates live.
- **Affected Files**: `e2e/playwright.config.ts`, `e2e/customer_journey.spec.ts`, `e2e/kds_journey.spec.ts`

---

## 📊 COMPLETION STATUS BREAKDOWN

| Functional Area | Current Completion | Remaining Tasks |
|:---|:---:|:---|
| **Backend REST API** | **95%** | Cloudinary upload route, order confirmation emails |
| **Backend Security & Sockets** | **100%** | Fully verified (branch isolation, DB auth, CORS guard) |
| **Payment & Financial State Machine** | **100%** | Fully verified (all 5 status codes, MD5 signature, reservations) |
| **Flutter Customer App (`Flutteruser`)** | **95%** | In-app PayHere webview / SDK integration |
| **Flutter Admin / KDS (`Flutteradmin`)** | **95%** | Product image upload UI picker |
| **Testing & Verification** | **90%** | Jest & Flutter widget tests 100% pass; E2E browser tests remaining |
| **External Integrations** | **70%** | Production SMS gateway & FCM background push |

---

## 🗂️ REPOSITORY ARCHITECTURE MAP

```
FLUTTER/
├── AUDIT_REPORT.md             ← Comprehensive multi-phase senior engineering audit
├── QA_TEST_MATRIX.md           ← Complete QA test cases and execution status
├── UI_UX_AUDIT.md              ← Screen-by-screen usability, interaction & accessibility
├── SECURITY_FINDINGS.md        ← Threat model, PayHere verification & OWASP audit
├── IMPLEMENTATION_PLAN.md      ← File-level remediation log and diff tracking
├── TEST_RESULTS.md             ← Automated test outcomes and execution logs
├── TASKS.md                    ← Production acceptance checklist
├── CL to do.md                 ← Master analysis & roadmap (this document)
├── Backend/
│   ├── src/
│   │   ├── app.ts, server.ts
│   │   ├── config/ (database.ts, env.ts)
│   │   ├── controllers/ (14 controllers)
│   │   ├── services/ (15 services — core business logic)
│   │   ├── repositories/ (14 repositories — Prisma data access)
│   │   ├── routes/ (14 routes + index.ts)
│   │   ├── sockets/index.ts    ← WebSocket rooms, handshake auth, branch isolation
│   │   └── __tests__/ (6 test suites, 45 automated tests — 100% PASS)
│   └── prisma/ (schema.prisma, migrations/)
├── Flutteruser/lib/
│   ├── main.dart
│   ├── providers/              ← Riverpod state (orderDetailProvider debounced)
│   ├── screens/                ← Auth, Tabs, Checkout, OrderTracking (with retry)
│   └── services/               ← Dio API client with 401 token refresh
└── Flutteradmin/lib/
    ├── main.dart
    ├── providers/              ← Riverpod state (kdsOrdersProvider debounced)
    ├── screens/                ← KDS, Analytics (clean), Orders, Menu, Customers
    └── services/               ← Admin API client with 401 token refresh interceptor
```
