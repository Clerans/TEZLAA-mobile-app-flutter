# TEZLAA - SECURITY ARCHITECTURE & AUDIT SPECIFICATION

## 1. Secrets & Credentials Management
- **Rule**: NO production secrets or merchant secrets may ever be committed, bundled into mobile applications, or logged.
- **PayHere Secret**: `PAYHERE_SECRET` exists strictly on the Backend server (`.env`).
  - Mobile client receives only pre-generated `hash` calculated by Backend: `strtoupper(md5(merchant_id + order_id + amount + currency + strtoupper(md5(merchant_secret))))`.
  - Flutter Mobile SDK / Checkout initialization uses `hash` and empty/dummy `merchant_secret` so secrets are never decompiled from the APK/IPA.
- **JWT & Session Security**:
  - Access tokens have short TTL (15m - 1h). Refresh tokens stored securely.
  - JWT secrets strictly managed on Backend.

## 2. Server-Authoritative Pricing & Revalidation
- Client sends only `productId`, `quantity`, `customizations`, and applied `couponCode` / `pointsToRedeem`.
- Backend re-queries product database pricing, tax configurations, and discount limits.
- Client-submitted totals are strictly ignored or checked against server calculation.

## 3. IDOR (Insecure Direct Object Reference) Prevention
- Customers can only query orders, addresses, and loyalty data matching `req.user.id`.
- Branch staff and branch managers are strictly scoped to their assigned `branchId`.
- Global admin routes require explicit `ADMIN` role checks.

## 4. PayHere Webhook Security & Idempotency
- Signature verification: Backend re-computes `md5sig` using `merchant_secret` and incoming parameters:
  `strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))`.
- Idempotent handling: Duplicate webhook notifications for already processed transactions are acknowledged without double-crediting or duplicate loyalty deduction.
- State Machine Security:
  - Status 2: COMPLETED
  - Status 0: PENDING (Retain inventory/reservation, do not mark FAILED)
  - Status -1: CANCELLED (Release reservations safely)
  - Status -2: FAILED (Release reservations safely)
  - Status -3: CHARGEBACK (Record audit trail, flag transaction for dispute reconciliation, reverse unearned loyalty points)

## 5. OTP Security & Purpose Isolation
- OTP codes are time-limited (5-10 minutes) and single-use.
- Registration verification OTP and Password Reset OTP must have separate purposes or dedicated tokens to prevent cross-purpose token consumption.
- Rate limiting applied to OTP request and verification endpoints.
