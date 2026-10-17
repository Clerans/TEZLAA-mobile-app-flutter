# TEZLAA — Senior QA, UI/UX & Software Engineering Audit Report

**Date**: October 2026  
**Auditor**: Multidisciplinary Senior Engineering Team (Senior QA, UI/UX Designer, Senior Flutter Engineer, Senior Backend Engineer, Senior Security Engineer, Senior Architect, DevOps/Release)  
**Scope**: Backend (Express / TypeScript / Prisma / Socket.IO), Customer App (`Flutteruser`), Admin / KDS App (`Flutteradmin`)  
**Repository**: `Clerans/TEZLAA-mobile-app-flutter`

---

## 1. Executive Summary

A comprehensive multi-phase engineering, security, usability, and architecture audit was performed across all three TEZLAA applications. Every finding and claimed behavior was cross-referenced against authoritative source code, database schemas, test suites, and operational configurations.

### Key Audit Conclusions:
1. **Financial & Payment Integrity**: The payment state machine in `Backend/src/services/payment.service.ts` correctly verifies PayHere MD5 signatures, isolates currency to LKR, handles all 5 PayHere status codes (`2` COMPLETED, `0` PENDING, `-1` CANCELLED, `-2` FAILED, `-3` CHARGEBACK), guards against out-of-order/delayed callbacks, flags captured payments on cancelled orders for refund reconciliation, and atomically manages coupon and loyalty reservations.
2. **Server-Authoritative Pricing**: Cart calculations are never trusted from the client. `Backend/src/services/order.service.ts` recalculates product prices, variant prices, required addons, addon quantities, delivery fees (via Haversine distance checks), and discounts in database transactions.
3. **Authentication & Session Lifecycle**: OTP purpose separation (`REGISTER$`, `RESET$`) is strictly enforced via bcrypt hashing. Unverified accounts are barred from obtaining session tokens. The access/refresh token pair is integrated with automatic 401 retry handling across both Flutter applications (`Flutteruser` and `Flutteradmin`).
4. **Real-Time WebSocket & Branch Isolation**: Sockets authenticate against fresh, authoritative PostgreSQL user records on every connection. `BRANCH_STAFF` is strictly confined to `branch:{branchId}` and forbidden from `admin:orders`. Socket listeners on both Flutter apps feature 300ms debounce protection to eliminate API flooding and race conditions.
5. **UI/UX & Administrative Transparency**: Silent catch fallbacks to public catalog endpoints in `Flutteradmin` have been eliminated, fake growth percentage badges have been replaced with real authoritative operational indicators, and `OrderTrackingScreen` now provides an interactive Error & Retry card widget.

---

## 2. Audit Matrix of Verified Items

| Item ID | Category | Requirement / Concern | Target Component | Audit Verification Finding | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | Payment | Webhook 5 status codes & signature | `Backend/payment.service.ts` | All 5 codes handled; MD5 signature verified; atomic reservations | **VERIFIED FIXED** |
| **AUD-02** | Payment | Cart preservation on cancel | `Flutteruser/checkout_screen.dart` | Cart preserved on cancelled/failed checkout; cleared only on COMPLETED/PENDING | **VERIFIED FIXED** |
| **AUD-03** | Security | Socket branch isolation | `Backend/sockets/index.ts` | `BRANCH_STAFF` restricted to assigned branch; DB-authoritative auth | **VERIFIED FIXED** |
| **AUD-04** | Reliability | Socket event debouncing | Both Flutter apps | 300ms debounce timer added to `orderDetailProvider` and `kdsOrdersProvider` | **VERIFIED FIXED** |
| **AUD-05** | UI/UX & Admin | Remove silent error masking | `Flutteradmin/admin_services.dart` | Removed fallback to public `/products` & `/categories`; typed errors exposed | **VERIFIED FIXED** |
| **AUD-06** | UI/UX & Data | Fake percentage analytics badge | `Flutteradmin/admin_analytics_screen.dart` | Removed hardcoded `+18.4%` text; replaced with authoritative live indicator | **VERIFIED FIXED** |
| **AUD-07** | Pricing | Server-authoritative delivery fee | `Flutteruser/checkout_screen.dart` | Delivery fee extracted directly from `validateCart` response | **VERIFIED FIXED** |
| **AUD-08** | Security | Production CORS enforcement | `Backend/config/env.ts` | Startup assertion rejects wildcard `*` CORS in production mode | **VERIFIED FIXED** |
| **AUD-09** | Security | Session refresh & storage parity | `Flutteradmin` storage & client | Added `saveRefreshToken` and 401 interceptor to `AdminApiClient` | **VERIFIED FIXED** |
| **AUD-10** | UI/UX | Order tracking error recovery | `Flutteruser/order_tracking_screen.dart` | Replaced static text with interactive Error & Retry card widget | **VERIFIED FIXED** |

---

## 3. High-Priority Defect Analysis & Root Causes

### 3.1 AUD-04: Concurrent WebSocket Bursts Triggering Redundant API Calls
- **Root Cause**: Previously, socket event listeners (`onOrderStatusUpdated` in Flutteruser and `orderEvents.listen` in Flutteradmin) immediately called `ref.invalidateSelf()` or `fetchActive()` whenever an event was dispatched.
- **Impact**: When kitchen baristas or backend state changes triggered multiple rapid events, Flutter apps initiated multiple simultaneous HTTP GET requests, causing race conditions and UI flickering.
- **Remediation**: Implemented a 300ms debounce timer (`Timer? debounceTimer`) that cancels pending invocations if a new socket event arrives within 300ms, with clean disposal in `ref.onDispose`.

### 3.2 AUD-05: Silent Admin Endpoint Fallback Masking Errors
- **Root Cause**: `AdminProductService.getProducts()` and `AdminCategoryService.getCategories()` caught network/authorization errors and silently attempted to fetch from the customer-facing `/products` and `/categories` endpoints.
- **Impact**: Administrative authentication failures, network outages, and role reassignments were masked from staff, causing stale or public-only views without error feedback.
- **Remediation**: Removed the silent fallback blocks. The services now rethrow errors directly to Riverpod providers, allowing UI screens to present actionable Error & Retry states.

### 3.3 AUD-06: Hardcoded Marketing Percentage in Live Admin Analytics
- **Root Cause**: `admin_analytics_screen.dart` contained a static `'+18.4% compared to previous cycle'` badge hardcoded into the layout.
- **Impact**: Fabricated statistics presented as real financial analytics violate data integrity rules and mislead café executives.
- **Remediation**: Replaced the hardcoded percentage badge with an authoritative live operational descriptor (`Live aggregated metric across authorized branches`).

### 3.4 AUD-09: Flutteradmin Lacked Refresh Token Recovery
- **Root Cause**: `AdminApiClient` cleared local authentication storage immediately upon receiving an HTTP 401 error, and `AdminStorageService` did not store the refresh token.
- **Impact**: If access token TTL is shortened for security, staff and KDS screens would be abruptly logged out during active kitchen operations.
- **Remediation**: Added `saveRefreshToken`, `getRefreshToken`, and an automatic 401 refresh token interceptor to `AdminApiClient` that hits `POST /auth/refresh` to silently renew access tokens.

### 3.5 AUD-10: Inoperable Error State in Order Tracking
- **Root Cause**: `order_tracking_screen.dart` rendered `const Center(child: Text('Order tracking unavailable'))` with no retry affordance.
- **Impact**: A momentary network blip left the customer permanently stranded with no option other than abandoning the tracking flow.
- **Remediation**: Added a structured error container with specific error messaging, a "Retry Live Tracking" button that triggers `ref.invalidate(orderDetailProvider(orderId))`, and a navigation link to return to Home.
