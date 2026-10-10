# TEZLAA — Comprehensive Security Audit Report
**Date**: October 2026  
**Auditor**: TEZLAA Master Engineering Team  
**Scope**: `Backend/` (Express, TypeScript, Prisma, Socket.IO, PayHere), `Flutteruser/`, `Flutteradmin/`

---

## 1. Executive Security Summary
This security audit provides a rigorous, code-level analysis of authentication, authorization, payment lifecycles, real-time messaging, and sensitive data protections across the TEZLAA mobile platform.

### Severity Classification Matrix
- **P0 (Critical Blocker)**: Direct financial discrepancy, secret leakage, or authentication bypass.
- **P1 (High Priority)**: Insecure randomness, brute-force vulnerability, privilege escalation, or webhook replay risk.
- **P2 (Medium Priority)**: Floating-point precision in database schemas, information disclosure in test leaks.
- **P3 (Low Priority)**: Code styling, unused imports, or defense-in-depth enhancements.

---

## 2. Baseline Audit Findings & Verification Status

| Finding ID | Severity | Component | Issue Description | Root Cause | Proposed Remediation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **P0** | `Backend/src/services/auth.service.ts` | Insecure Pseudo-Random Number Generator for OTP | `Math.random()` used for 6-digit OTP generation | Replace with `node:crypto` `crypto.randomInt(100000, 1000000)` | Identified |
| **SEC-02** | **P1** | `Backend/src/routes/auth.routes.ts` | Missing Granular Rate Limits on Auth Endpoints | Only global 200 req/15min limiter applied | Implement dedicated 5-10 req/15min limiters on `/login`, `/verify-otp`, `/resend-otp` | Identified |
| **SEC-03** | **P1** | `Backend/src/sockets/index.ts` | Permissive Socket Connection on Expired/Invalid Tokens | Invalid token silently caught, allowing anonymous connection without rejection | Explicitly reject socket handshake if expired or malformed token is provided | Identified |
| **SEC-04** | **P1** | `Backend/src/services/email.service.ts` | External Email Dispatch in Automated Test Environment | Real Brevo HTTP API invoked during tests | Short-circuit email dispatch when `NODE_ENV === 'test'` | Identified |
| **SEC-05** | **P2** | `Backend/src/services/order.service.ts` | Non-cryptographic Random Hex for Order Numbers | `Math.random().toString(36)` used | Replace with `crypto.randomBytes(3).toString('hex').toUpperCase()` | Identified |
| **SEC-06** | **P0** | `Backend/src/services/payment.service.ts` | PayHere Webhook Verification & State Machine | Unverified webhook callbacks or silent status updates | Verified: MD5 signature verification + 5-status atomic state machine implemented | Verified |
| **SEC-07** | **P0** | `Backend/src/routes/admin.routes.ts` | Branch Manager & Staff IDOR / Cross-Branch Access | Staff accessing foreign branch orders | Verified: Scoped in `admin.controller.ts` (`order.branchId === req.user.branchId`) | Verified |
| **SEC-08** | **P1** | `Flutteruser/lib/screens/screens/checkout_screen.dart` | Cart Discarding on Payment Failure/Cancellation | Customer cart wiped before payment is confirmed | Verified: Cart preserved on payment failure/cancel; only cleared on `COMPLETED`/`PENDING` | Verified |
| **SEC-09** | **P1** | `Flutteradmin/lib/screens/kds/kds_screen.dart` | Silent Failure Fallbacks in KDS / Admin Services | Admin services returning empty arrays on error | Verified: Typed errors rethrown, displayed in user-friendly SnackBars/states | Verified |
| **SEC-10** | **P2** | `Backend/prisma/schema.prisma` | Floating-point Currency Types | `Float` used for monetary amounts | Documented migration path to `Decimal(10, 2)` with cent-normalization safeguards | Documented |

---

## 3. Detailed Vulnerability Analyses

### 3.1 SEC-01: Insecure OTP Generation
- **Affected File**: `Backend/src/services/auth.service.ts` (`register`, `sendOtp`)
- **Vulnerability**: `Math.floor(100000 + Math.random() * 900000)` produces predictable pseudo-random sequences (V8 PRNG seed predictability).
- **Remediation**:
  ```typescript
  import { randomInt } from 'node:crypto';
  const otpCode = randomInt(100000, 1000000).toString();
  ```

### 3.2 SEC-02: Auth Route Rate Limiting
- **Affected File**: `Backend/src/routes/auth.routes.ts`
- **Vulnerability**: Without per-endpoint rate limiting, an attacker can attempt hundreds of OTP combinations before global rate limiting triggers.
- **Remediation**:
  - `authLimiter`: 10 requests per 15 minutes for `/login` and `/register`.
  - `otpLimiter`: 5 requests per 15 minutes for `/verify-otp`, `/resend-otp`, `/forgot-password`.

### 3.3 SEC-03: Socket.IO Authentication Policy
- **Affected File**: `Backend/src/sockets/index.ts`
- **Vulnerability**: In `io.use()`, if a token is passed but fails validation, it logs a warning and proceeds with `next()`. Protected rooms check `user`, but expired tokens should be rejected at the handshake level with `next(new Error('Authentication error: Invalid or expired token'))`.

---

## 4. Verification Evidence & Traceability
All remediation steps must be validated via targeted unit and integration tests under `Backend/src/__tests__/`.
