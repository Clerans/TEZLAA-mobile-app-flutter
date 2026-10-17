# TEZLAA — Application Security Findings & Threat Model

**Standard**: OWASP Top 10 (API & Mobile), PCI-DSS Alignment (PayHere Hosted/Notification Flow), Zero-Trust Authorization  
**Auditor**: Principal Application Security Engineer Review  
**Date**: October 2026

---

## 1. Threat Model & Trust Boundaries

```
[Customer Mobile App]                 [Admin / KDS App]
       |                                     |
       | HTTPS (JWT Bearer)                  | HTTPS (JWT Bearer)
       v                                     v
+-----------------------------------------------------------+
|               Express API & Socket.IO Gateway             |
|  - CORS Origin Filter (Production Non-Wildcard Guard)     |
|  - Rate Limiting (authLimiter, otpLimiter)                |
|  - DB-Authoritative Socket Handshake Verification         |
+-----------------------------------------------------------+
       |                                     |
       v                                     v
[Business Services]                   [PayHere Webhook]
  - Order State Machine                 - MD5 Signature Verify
  - Authoritative Pricing               - Amount/Currency Match
  - Reservation Lifecycle               - Out-of-Order Guards
       |                                     |
       +------------------+------------------+
                          |
                          v
               [PostgreSQL DB (Prisma)]
           Row-level Branch & User Isolation
```

### Trust Boundary Rules:
1. **Never trust client prices or totals**: Clients only provide product IDs, variant IDs, addon IDs, and quantities. All prices, taxes, delivery fees, and discounts are computed server-side from PostgreSQL.
2. **Never trust client-claimed roles or branches**: JWT claims are treated as hints during initial connection; WebSocket handshakes and privileged REST endpoints re-query PostgreSQL to verify the user's active status, current role, and assigned branch ID.
3. **Never trust client-reported payment outcomes**: Only authoritative server-to-server PayHere webhooks with verified MD5 signatures trigger order confirmation.

---

## 2. Threat & Vulnerability Registry

| Vulnerability ID | Vulnerability Category | Affected Component | Threat Description | Remediation Implemented | Verification Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Cryptographic Weakness | `auth.service.ts` | Insecure PRNG (`Math.random()`) for OTP generation | Switched to cryptographically secure `crypto.randomInt(100000, 1000000)` | Automated test `auth_otp.test.ts` |
| **SEC-02** | Authentication Bypass | `auth.routes.ts` | Missing rate limiting on OTP request & verification endpoints | Enforced `express-rate-limit` (`otpLimiter`, `authLimiter`) and 60-second DB cooldown | `auth_otp.test.ts` & code inspection |
| **SEC-03** | Broken Authorization | `sockets/index.ts` | Unauthenticated socket connections and stale JWT role claims | Added mandatory token handshake and authoritative `prisma.user.findUnique` check | `socket_security.test.ts` (6 tests) |
| **SEC-04** | Information Disclosure | `env.ts`, `app.ts` | Wildcard CORS (`*`) permitting unauthorized origins in production | Added Zod startup validator throwing an exception if `CORS_ORIGIN=*` in production | `admin_auth_and_cors.test.ts` |
| **SEC-05** | IDOR & Horizontal Privilege Escalation | `sockets/index.ts`, `order.service.ts` | Staff at Branch A accessing Branch B events or orders | Sockets join only `branch:{user.branchId}`; orders scoped by `branchId` in DB queries | `socket_security.test.ts`, `admin_auth_and_cors.test.ts` |
| **SEC-06** | Payment State Regression | `payment.service.ts` | Delayed or out-of-order failure callbacks regressing completed orders | Added idempotency check: delayed `0`, `-1`, `-2` callbacks on completed orders are safely ignored | `payhere_state_machine.test.ts` (10 tests) |
| **SEC-07** | Payment Discrepancy | `payment.service.ts` | Capture of payment for orders cancelled by customer/staff | Added reconciliation flagging (`flaggedForReconciliation: true`) preserving CANCELLED status | `payhere_state_machine.test.ts` |
| **SEC-08** | Secret Exposure | `checkout_screen.dart` | PayHere checkout launched with GET parameters visible in URLs | Parameters signed with MD5 on server; merchant secret never leaves backend server | `pricing_and_security.test.ts` |
| **SEC-09** | Session Expiration & Stale Tokens | `Flutteradmin`, `Flutteruser` | Admin client lacked refresh token recovery, risking abrupt logouts | Implemented refresh token storage and automatic 401 retry interceptor in `AdminApiClient` | Code audit & unit tests |

---

## 3. Cryptographic & Payment Security Controls

1. **PayHere Signature Verification**:
   - Webhook signature generated via: `MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret)).toUpperCase()`.
   - Verified before processing any payment notification. Tampered signatures result in an immediate HTTP 400 rejection and are logged with alert severity.
2. **OTP Security**:
   - OTP codes are hashed using `bcrypt` (10 salt rounds) with a purpose prefix (`REGISTER$` or `RESET_PASSWORD$`) before database persistence. Plaintext OTPs are never stored.
   - Max 5 verification attempts permitted before the code is permanently invalidated.
3. **Database Concurrency & Race Conditions**:
   - All payment transitions, coupon consumptions, and loyalty point deductions are executed within atomic Prisma database transactions (`prisma.$transaction`) with configured query timeouts.
