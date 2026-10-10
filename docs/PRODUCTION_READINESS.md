# TEZLAA — Production Readiness Checklist & Operational Specification

**Release Version**: 1.0.0 (Release Candidate)  
**Date**: October 2026  
**Status**: IN PROGRESS (Phase 1 Remediation Underway)

---

## 1. Production Readiness Scorecard

| Domain | Readiness Criteria | Status | Notes / Blockers |
| :--- | :--- | :--- | :--- |
| **Security** | Insecure randomness replaced with CSPRNG | IN PROGRESS | Applying `crypto.randomInt` & `crypto.randomBytes` |
| **Security** | Auth endpoint brute-force rate limiters | IN PROGRESS | Adding strict rate limiters to auth routes |
| **Security** | Handshake validation & rejection for Socket.IO | IN PROGRESS | Hardening socket token verification |
| **Payments** | PayHere MD5 signature verification & 5-state machine | VERIFIED | Tests passing in `payhere_state_machine.test.ts` |
| **Payments** | Cart preservation on payment cancellation/failure | VERIFIED | Preserved in `Flutteruser/checkout_screen.dart` |
| **Integrity** | Server-authoritative prices, coupons & loyalty | VERIFIED | Tested in `pricing_and_security.test.ts` |
| **Access Control** | Cross-branch staff/manager IDOR isolation | VERIFIED | Enforced in admin routes & sockets |
| **Reliability** | External Brevo API isolated in test environment | IN PROGRESS | Fixing open handle in `email.service.ts` |
| **UI / UX** | Responsive layouts (375x812 to 1920x1080) | VERIFIED | 14 customer + 9 admin tests passing |
| **DevOps** | Mobile release APK builds | VERIFIED | Built `app-release.apk` for User & Admin |
| **DevOps** | Live backend deployment health | VERIFIED | Render live backend `/api/v1/health` status `UP` |

---

## 2. Payment Reconciliation Procedure

In accordance with Section 5.1 of the Master Engineering Prompt, payment reconciliation handles any asynchronous out-of-order or disputed transactions:

### 2.1 Flagged Transactions
1. **Chargeback (-3)**:
   - Status updated to `REFUNDED`.
   - `gatewayResponse` flagged with `chargeback: true` and `flaggedForReconciliation: true`.
   - Loyalty points earned are reversed via a `BONUS` deduction transaction.
2. **Amount / Currency Mismatch**:
   - Status updated to `FAILED`.
   - Recorded in audit log with expected vs received amounts.
3. **Delayed Webhook (after order cancelled)**:
   - Order remains in terminal `CANCELLED` state.
   - Payment record reflects captured amount, requiring manager refund review.

---

## 3. Deployment & Rollback Strategy

1. **Database Migrations**:
   - Run `npx prisma migrate deploy` prior to launching new backend container revisions.
   - No destructive table/column drops in active migrations.
2. **Environment Configuration**:
   - Strict Zod validation on startup ensures all production secrets are loaded.
3. **Application Rollback**:
   - Stateless backend can be rolled back to previous Docker image tag immediately via Render deployment rollback.
