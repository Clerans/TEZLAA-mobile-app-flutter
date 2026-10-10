# TEZLAA — Comprehensive Security Audit Report
**Date**: October 2026  
**Auditor**: Principal Security Engineer Review  
**Scope**: `Backend/` (Express, TypeScript, Prisma, Socket.IO, PayHere), `Flutteruser/`, `Flutteradmin/`

---

## 1. Executive Summary & Verification Disposition

This audit independently assesses the claimed security remediations and production readiness of the TEZLAA mobile food ordering platform. Rather than trusting existing reports, every finding was independently verified against actual source code and exercised through automated test suites.

### Finding Summary

| Finding ID | Severity | Component | Issue Description | Source Location | Remediation Status | Verified By Automated Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | Auth PRNG | Insecure `Math.random()` OTP generation | `Backend/src/services/auth.service.ts` | **RESOLVED** (`crypto.randomInt`) | `auth_otp.test.ts` |
| **SEC-02** | **P1** | Auth Rate Limiting | Missing brute-force protection on auth endpoints | `Backend/src/routes/auth.routes.ts` | **RESOLVED** (`authLimiter`, `otpLimiter`) | Code inspection |
| **SEC-03** | **P0** | Socket Auth | Silent acceptance of invalid/expired tokens & stale JWT claims | `Backend/src/sockets/index.ts` | **RESOLVED** (Mandatory token, authoritative DB lookup) | `socket_security.test.ts` (6 tests) |
| **SEC-04** | **P1** | Test Isolation | Unmocked Brevo email dispatch hanging tests | `Backend/src/services/email.service.ts` | **RESOLVED** (Test-environment guard) | `auth_otp.test.ts` |
| **SEC-05** | **P2** | Order PRNG | Weak randomness in order number generator | `Backend/src/services/order.service.ts` | **RESOLVED** (`crypto.randomBytes`) | Code inspection |
| **SEC-06** | **P0** | Payment State Machine | Out-of-order webhooks & payments on cancelled orders | `Backend/src/services/payment.service.ts` | **RESOLVED** (Idempotent ignore, reconciliation flagging) | `payhere_state_machine.test.ts` (10 tests) |
| **SEC-07** | **P0** | Admin Authorization | Direct object reference & cross-branch staff access | `Backend/src/controllers/admin.controller.ts`, `routes/admin.routes.ts` | **RESOLVED** (Server-side branch scoping & 403 enforcement) | `admin_auth_and_cors.test.ts` (8 tests) |
| **SEC-08** | **P0** | Production CORS | Implicit wildcard CORS in production | `Backend/src/config/env.ts`, `src/app.ts`, `src/sockets/index.ts` | **RESOLVED** (Disallowed `*` in prod, explicit origin list) | `admin_auth_and_cors.test.ts` |
| **SEC-09** | **P1** | Cart Preservation | Cart clearing before payment confirmation | `Flutteruser/lib/screens/screens/checkout_screen.dart` | **RESOLVED** (Preserve on cancel/failure) | Flutter analyzer & manual audit |

---

## 2. Priority 1: Socket Authentication & DB-Backed Claim Verification

### 2.1 Findings & Risks
Prior implementations decoded JWT tokens during socket connection but:
1. Did not reject connections when tokens were invalid or missing.
2. Relied strictly on claims encoded inside the token, leaving the system vulnerable if a user's role was demoted, their branch assignment was changed, or their account was suspended after token issuance.
3. Allowed any client to request joins to order and branch rooms without backend verification.

### 2.2 Implemented Fix (`Backend/src/sockets/index.ts`)
1. **Mandatory Handshake Authentication**: Handshake explicitly rejects connections missing a token with `Authentication error: Token required`.
2. **Authoritative Database Verification**: Handshake queries `prisma.user.findUnique({ where: { id: decoded.userId } })` to obtain fresh `role` and `branchId`. Stale token claims are overwritten with authoritative DB state. If user no longer exists or is unverified, connection is rejected.
3. **Room Join Scoping**:
   - `joinOrder`: Verifies that the connected socket's `userId` matches the order's owner or that the socket holds an `ADMIN` or matching `branchId` role.
   - `joinBranch`: Gated strictly to `ADMIN` or staff explicitly assigned to that `branchId`.
4. **Automated Test Evidence**: `Backend/src/__tests__/socket_security.test.ts` (6 automated tests, 100% passing).

---

## 3. Priority 2: Production CORS Origin Enforcement

### 3.1 Findings & Risks
Previous configurations permitted fallback to wildcard `*` origins across Express and Socket.IO, exposing authenticated sessions to cross-site request forgery and data exfiltration from malicious web browsers.

### 3.2 Implemented Fix
1. **Startup Validation (`Backend/src/config/env.ts`)**:
   Zod schema validation rejects startup if `NODE_ENV === 'production'` and `CORS_ORIGIN` contains `*`:
   ```typescript
   .refine(
     (data) => {
       if (data.NODE_ENV === 'production' && data.CORS_ORIGIN.trim() === '*') {
         return false;
       }
       return true;
     },
     {
       message: 'CORS_ORIGIN cannot be wildcard (*) in production environment. Specify explicit allowed domains.',
       path: ['CORS_ORIGIN'],
     }
   )
   ```
2. **Explicit Allowed Origins (`Backend/.env` & `Backend/src/app.ts`)**:
   `CORS_ORIGIN=https://tezlaa-mobile-app-flutter.onrender.com,https://tezlaa-admin.web.app,https://admin.tezlaa.lk`
3. **Native Flutter & Server-to-Server Preservation**:
   Requests with `origin === undefined` (such as native mobile HTTP clients and PayHere server-to-server POST webhooks) are explicitly permitted via `if (!origin) return callback(null, true);`.
4. **Socket.IO Origin Alignment**: Socket.IO server `cors.origin` dynamically applies the same validator logic.
5. **Automated Test Evidence**: `Backend/src/__tests__/admin_auth_and_cors.test.ts` (CORS suite passing).

---

## 4. Priority 3: Administrative Route-by-Route Permission Matrix

All administrative endpoints are secured behind `authenticateJwt` and role/branch middleware. Enforced on the backend regardless of client-side Flutter UI restrictions:

| HTTP Method | Route Endpoint | Required Roles | Branch Scoping / Isolation | Customer Data Scope | Permitted Mutation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | `ADMIN`, `BRANCH_MANAGER` | Manager restricted to assigned `branchId` metrics | Aggregated metrics | Read-only |
| `GET` | `/api/v1/admin/orders` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | Staff/Manager query forced to `req.user.branchId` | Orders for assigned branch | Read-only |
| `GET` | `/api/v1/admin/orders/:id` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | Staff/Manager blocked from foreign branch orders (403) | Order items, delivery address | Read-only |
| `GET` | `/api/v1/admin/products` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | All branches | None | Read-only |
| `POST` | `/api/v1/admin/products` | `ADMIN`, `BRANCH_MANAGER` | System-wide catalogue | None | Create product |
| `PUT` | `/api/v1/admin/products/:id` | `ADMIN`, `BRANCH_MANAGER` | System-wide catalogue | None | Update product |
| `DELETE` | `/api/v1/admin/products/:id` | `ADMIN` only | System-wide catalogue | None | Hard/Soft delete product |
| `PATCH` | `/api/v1/admin/products/:id/availability` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | System-wide catalogue | None | Toggle active flag |
| `GET` | `/api/v1/admin/categories` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | System-wide | None | Read-only |
| `POST` | `/api/v1/admin/categories` | `ADMIN`, `BRANCH_MANAGER` | System-wide | None | Create category |
| `PUT` | `/api/v1/admin/categories/:id` | `ADMIN`, `BRANCH_MANAGER` | System-wide | None | Update category |
| `DELETE` | `/api/v1/admin/categories/:id` | `ADMIN` only | System-wide | None | Delete category |
| `GET` | `/api/v1/admin/branches` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | System-wide | None | Read-only |
| `POST` | `/api/v1/admin/branches` | `ADMIN` only | System-wide | None | Create branch |
| `PUT` | `/api/v1/admin/branches/:id` | `ADMIN`, `BRANCH_MANAGER` | Manager restricted to assigned branch | None | Update branch details |
| `PATCH` | `/api/v1/admin/branches/:id/status` | `ADMIN`, `BRANCH_MANAGER` | Manager restricted to assigned branch | None | Toggle branch open/close |
| `GET` | `/api/v1/admin/customers` | `ADMIN`, `BRANCH_MANAGER` | All customers | Customer profiles, loyalty | Read-only |
| `GET` | `/api/v1/admin/customers/:id` | `ADMIN`, `BRANCH_MANAGER` | All customers | Customer profile, addresses | Read-only |
| `GET` | `/api/v1/admin/loyalty` | `ADMIN`, `BRANCH_MANAGER` | System-wide | Customer loyalty logs | Read-only |
| `POST` | `/api/v1/admin/loyalty/adjust` | `ADMIN` only | System-wide | Selected customer | Adjust points balance |
| `GET` | `/api/v1/admin/rewards` | `ADMIN`, `BRANCH_MANAGER` | System-wide | None | Read-only |
| `POST` | `/api/v1/admin/rewards` | `ADMIN` only | System-wide | None | Create loyalty reward |
| `PUT` | `/api/v1/admin/rewards/:id` | `ADMIN` only | System-wide | None | Update loyalty reward |
| `DELETE` | `/api/v1/admin/rewards/:id` | `ADMIN` only | System-wide | None | Delete loyalty reward |
| `GET` | `/api/v1/admin/promotions` | `ADMIN`, `BRANCH_MANAGER` | System-wide | None | Read-only |
| `POST` | `/api/v1/admin/promotions` | `ADMIN` only | System-wide | None | Create promotion |
| `PUT` | `/api/v1/admin/promotions/:id` | `ADMIN` only | System-wide | None | Update promotion |
| `DELETE` | `/api/v1/admin/promotions/:id` | `ADMIN` only | System-wide | None | Delete promotion |
| `GET` | `/api/v1/admin/coupons` | `ADMIN`, `BRANCH_MANAGER` | System-wide | None | Read-only |
| `POST` | `/api/v1/admin/coupons` | `ADMIN` only | System-wide | None | Create coupon |
| `PUT` | `/api/v1/admin/coupons/:id` | `ADMIN` only | System-wide | None | Update coupon |
| `DELETE` | `/api/v1/admin/coupons/:id` | `ADMIN` only | System-wide | None | Delete coupon |
| `GET` | `/api/v1/admin/notifications` | `ADMIN`, `BRANCH_MANAGER`, `BRANCH_STAFF` | Branch-scoped notifications | Staff alert messages | Read-only |

### 4.1 Negative Authorization Tests
Verified in `Backend/src/__tests__/admin_auth_and_cors.test.ts`:
- Unauthenticated requests are rejected with 401.
- `CUSTOMER` roles requesting `/dashboard` or admin endpoints are rejected with 403.
- `BRANCH_STAFF` attempting to mutate loyalty or delete products are rejected with 403.
- `BRANCH_STAFF` attempting to access orders belonging to another branch via direct ID are rejected with 403 (`You do not have permission to view orders from other branches`).

---

## 5. Priority 4: Payment State Machine & Financial Integrity

### 5.1 Verification Checklist
1. **MD5 Signature Verification**: Confirmed in `payment.service.ts`: `md5(merchantId + orderId + amountFormatted + currency + statusCode + md5(merchantSecret))`. Invalid signatures immediately abort with `Invalid PayHere signature`.
2. **Duplicate Callback Idempotency**:
   - Status 2 (SUCCESS) on an already `COMPLETED` payment is safely logged and returned without duplicate ledger or loyalty entries.
   - Status -1 (CANCELED) or -2 (FAILED) arriving after status 2 (SUCCESS) is treated as an out-of-order delayed callback and safely ignored without regressing payment status.
3. **Payment Captured After Order Cancellation**:
   - If a customer cancels an order while PayHere payment is processing, when PayHere callback arrives with status 2:
     - Order status remains preserved as `CANCELLED` (never regressed).
     - Payment record is updated to `COMPLETED`.
     - Transaction audit is stamped with `flaggedForReconciliation: true` and `PAYMENT_CAPTURED_AFTER_ORDER_CANCELLED`.
     - Customer confirmation email and push notifications are suppressed; staff/management are alerted for manual refund reconciliation.
4. **Chargeback Handling (Status -3)**:
   - Payment status set to `REFUNDED`.
   - `flaggedForReconciliation: true` recorded in payment metadata.
   - Loyalty points previously awarded are deducted via a compensatory transaction.
5. **Automated Test Evidence**: `Backend/src/__tests__/payhere_state_machine.test.ts` (10 tests, 100% passing).
