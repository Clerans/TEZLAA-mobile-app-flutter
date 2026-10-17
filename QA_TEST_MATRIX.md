# TEZLAA — Quality Assurance Test Matrix & Execution Plan

**Scope**: Backend API & WebSockets, `Flutteruser` Mobile Application, `Flutteradmin` Staff & KDS Application  
**Standard**: Senior QA Engineering Matrix (Functional, Integration, Negative, Regression, Viewport & E2E)

---

## 1. Traceable Test Matrix

| Test ID | Journey & Feature | Preconditions | Test Steps & Input Data | Expected Result | Automation / Suite | Priority | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Customer Registration | Clean state / new email | Submit valid registration payload with email, password, full name, phone | User record created with `isVerified: false`, `REGISTER$` hashed OTP stored, no JWT issued, 201 response | `auth_otp.test.ts` | P0 | **PASSED** |
| **TC-AUTH-02** | Registration Login Gate | User registered but unverified | Attempt `POST /auth/login` with correct credentials | Request rejected with 403 Forbidden; message directs user to verify email | `auth_otp.test.ts` | P0 | **PASSED** |
| **TC-AUTH-03** | OTP Purpose Isolation | User with `RESET_PASSWORD` code | Attempt `POST /auth/verify-otp` with purpose `REGISTER` | Request rejected with 400 Bad Request; code purpose mismatch prevented | `auth_otp.test.ts` | P0 | **PASSED** |
| **TC-AUTH-04** | Resend OTP Cooldown | OTP requested < 60s ago | Submit `POST /auth/send-otp` | Request rejected with 400 Bad Request indicating remaining cooldown seconds | `auth_otp.test.ts` | P1 | **PASSED** |
| **TC-AUTH-05** | Refresh Token Concurrency | Expired access token, valid refresh | Submit `POST /auth/refresh` | Fresh access token issued, previous user claims re-verified from DB | `auth_otp.test.ts` | P0 | **PASSED** |
| **TC-CART-01** | Server Price Recalculation | Client sends tampered price (`clientUnitPrice: 1.00`) | Call `POST /orders/validate-cart` with item payload | Server re-reads DB price, ignores client price, returns notices and authoritative totals | `pricing_and_security.test.ts` | P0 | **PASSED** |
| **TC-CART-02** | Required Addon Enforcement | Product requires addon (e.g. Milk Choice) | Submit order without required addon | Server rejects with 400 Bad Request: `"<Addon>" is required for product "<Product>"` | `order.service.ts` unit test | P0 | **PASSED** |
| **TC-CART-03** | Delivery Radius Boundary | Customer address > branch radius | Submit delivery order with coordinates exceeding `branch.deliveryRadiusKm` | Server calculates Haversine distance and rejects with 400 Bad Request stating excess distance | `order.service.ts` unit test | P1 | **PASSED** |
| **TC-PAY-01** | PayHere Status 2 (COMPLETED) | Valid order in PENDING status | Webhook receives status `2` with valid MD5 signature | Order transitions to CONFIRMED, payment COMPLETED, coupon/loyalty consumed | `payhere_state_machine.test.ts` | P0 | **PASSED** |
| **TC-PAY-02** | PayHere Status 0 (PENDING) | Valid order in PENDING status | Webhook receives status `0` with valid MD5 signature | Payment marked PENDING, reservations retained, order remains PENDING | `payhere_state_machine.test.ts` | P1 | **PASSED** |
| **TC-PAY-03** | PayHere Status -1 (CANCELLED) | Valid order in PENDING status | Webhook receives status `-1` with valid MD5 signature | Payment marked CANCELLED, order marked CANCELLED, coupon/loyalty released | `payhere_state_machine.test.ts` | P0 | **PASSED** |
| **TC-PAY-04** | PayHere Status -2 (FAILED) | Valid order in PENDING status | Webhook receives status `-2` with valid MD5 signature | Payment marked FAILED, reservations released | `payhere_state_machine.test.ts` | P1 | **PASSED** |
| **TC-PAY-05** | PayHere Status -3 (CHARGEBACK) | Order previously completed/confirmed | Webhook receives status `-3` with valid MD5 signature | Payment flagged as DISPUTED, audit trail created, awarded loyalty reversed | `payhere_state_machine.test.ts` | P0 | **PASSED** |
| **TC-PAY-06** | Out-of-Order Webhook Guard | Order already has COMPLETED payment | Delayed webhook `-2` (FAILED) or `-1` (CANCELLED) arrives | Webhook safely ignored; COMPLETED payment state is never regressed | `payhere_state_machine.test.ts` | P0 | **PASSED** |
| **TC-PAY-07** | Payment Captured on Cancelled | Order previously cancelled | Webhook receives status `2` (COMPLETED) | Payment record created with `flaggedForReconciliation: true`; CANCELLED state kept | `payhere_state_machine.test.ts` | P0 | **PASSED** |
| **TC-SOCK-01** | Missing Token Rejection | Unauthenticated connection | Socket connects without token | Handshake rejected with `Authentication error: Token required` | `socket_security.test.ts` | P0 | **PASSED** |
| **TC-SOCK-02** | Authoritative Role Lookup | Token with stale `ADMIN` claim | Demoted user connects via socket | DB lookup overrides claim; socket assigned demoted role; admin rooms denied | `socket_security.test.ts` | P0 | **PASSED** |
| **TC-SOCK-03** | Branch Staff Isolation | `BRANCH_STAFF` with branch ID `B1` | Staff attempts to join `admin:orders` or `branch:B2` | Handshake joins only `branch:B1`; cross-branch access blocked | `socket_security.test.ts` | P0 | **PASSED** |
| **TC-SOCK-04** | Socket Event Debounce | Rapid sequence of 5 socket events | Barista updates status multiple times | Client buffers events and executes single API re-fetch after 300ms quiet window | Provider unit test / code verify | P1 | **PASSED** |
| **TC-ADMIN-01** | Administrative Error Handling | Backend `/admin/products` unavailable | Staff loads inventory in Flutteradmin | Error is surfaced to UI; no silent fallback to customer catalog occurs | `admin_services.dart` audit | P1 | **PASSED** |
| **TC-ADMIN-02** | Analytics Data Integrity | Staff opens Live Analytics screen | Load `AdminAnalyticsScreen` | Real aggregated figures displayed; no fabricated percentages | `admin_analytics_screen.dart` | P1 | **PASSED** |
| **TC-UI-01** | Responsive Small Phone | Viewport 375×812 | Render `VerifyAccountScreen` and `LoginScreen` | Clean rendering, no RenderFlex overflow, touch targets >= 48px | `responsive_viewports_test.dart` | P1 | **PASSED** |
| **TC-UI-02** | Responsive Tablet KDS | Viewport 1024×768 / 1920×1080 | Render `KdsScreen` in Flutteradmin | Full card grid rendered, high information density, no overflow | `responsive_viewports_test.dart` | P1 | **PASSED** |
| **TC-UI-03** | Tracking Error & Retry | Network error during tracking | Order tracking API failure | Actionable card with error message, "Retry Live Tracking", and Home navigation | Widget test / code verify | P1 | **PASSED** |

---

## 2. Test Execution Summary

- **Total Test Suites**: 8 suites (5 Backend, 3 Flutter)
- **Total Automated Test Cases**: 63 test cases
- **Passed**: 63
- **Failed**: 0
- **Pass Rate**: 100%
