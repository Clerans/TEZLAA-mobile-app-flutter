# TEZLAA PRODUCTION ACCEPTANCE TASK TRACKER

## Phase 0: Project Context & Audit
- [x] Full codebase audit of Backend, Flutteruser, and Flutteradmin
- [x] Document drift identification & cataloging (AUDIT-01 through AUDIT-10)
- [x] Reconcile discrepancies between existing documentation, TODOs, and actual implementation

## Phase 1: Current Documentation & Source of Truth
- [x] `docs/PRD.md` — Product requirements document
- [x] `docs/ARCHITECTURE.md` — System architecture and layering
- [x] `docs/DESIGN.md` — Design tokens and UI system
- [x] `docs/TEST_PLAN.md` — Test methodology and acceptance criteria
- [x] `docs/SECURITY.md` — Security requirements and threat boundaries
- [x] `docs/DECISIONS.md` — Architecture decision records
- [x] `docs/MEMORY.md` — Historical context and milestones
- [x] `AUDIT_REPORT.md` — Senior multidisciplinary audit findings
- [x] `QA_TEST_MATRIX.md` — Complete QA traceability matrix
- [x] `UI_UX_AUDIT.md` — Screen-by-screen usability & accessibility audit
- [x] `SECURITY_FINDINGS.md` — Threat model and security analysis
- [x] `IMPLEMENTATION_PLAN.md` — Prioritized file-level remediation log
- [x] `TEST_RESULTS.md` — Test outcomes and limitations log
- [x] `docs/PRODUCTION_READINESS.md` — Release certification gates

## Phase 3 & 4: Critical Payment Repair & PayHere State Machine (P0)
- [x] Backend: Explicit status handling for PayHere webhook:
  - 2 = COMPLETED (order CONFIRMED, coupon/loyalty consumed)
  - 0 = PENDING (order PENDING_PAYMENT, reservations retained)
  - -1 = CANCELLED (order CANCELLED, release reservations)
  - -2 = FAILED (order FAILED, release reservations)
  - -3 = CHARGEBACK (order DISPUTED, audit trail recorded, points reversed)
- [x] Backend: Integration test covering all 5 PayHere status codes (`payhere_state_machine.test.ts`)
- [x] Backend: Guard against out-of-order delayed callbacks regressing COMPLETED payments
- [x] Backend: Flag payment capture on cancelled orders for refund reconciliation
- [x] Flutteruser: Secure PayHere checkout invocation with server-signed MD5 hash
- [x] Flutteruser: Preserve cart on cancellation/dismissal, clear only on verified payment

## Phase 5: Registration & OTP Verification Lifecycle (P0)
- [x] Backend: Separate OTP purpose (`REGISTER$` vs `RESET_PASSWORD$`) with bcrypt hashing
- [x] Backend: Restrict login / token issuance for unverified accounts (403 Forbidden)
- [x] Backend: Enforce 60-second resend cooldown and 5-attempt lockout
- [x] Flutteruser: Dedicated `VerifyAccountScreen` with OTP input & 60s resend countdown timer
- [x] Flutteruser: Registration navigation flow: Register -> Verify Account -> Home

## Phase 6 & 7: WebSocket Canonicalization & Branch Isolation (P0/P1)
- [x] Backend: Restrict `BRANCH_STAFF` to room `branch:{branchId}` (removed from `admin:orders`)
- [x] Backend: Enforce fresh DB role & branch re-verification on every socket handshake
- [x] Backend: Restrict `join_order` to order owner, assigned branch staff, or admin
- [x] Flutteruser: Debounce WebSocket triggers (300ms) in `orderDetailProvider` to eliminate duplicate calls
- [x] Flutteradmin: Debounce WebSocket triggers (300ms) in `kdsOrdersProvider` to prevent API bursts

## Phase 8 & 9: KDS & Admin Error Handling (P1)
- [x] Flutteradmin: Remove silent fallbacks (`return []`, public endpoint calls) in `admin_services.dart`
- [x] Flutteradmin: Remove hardcoded fake marketing percentage (`+18.4%`) from `admin_analytics_screen.dart`
- [x] Flutteradmin: Implement refresh token persistence and automatic 401 retry interceptor in `AdminApiClient`
- [x] Flutteruser: Replace static error text with interactive Error & Retry card in `order_tracking_screen.dart`

## Phase 10 & 11: Production Configuration & Security Hardening (P1/P2)
- [x] Backend: Enforce non-wildcard `CORS_ORIGIN` and strong secrets assertion in production `env.ts`
- [x] Backend: Cryptographically secure random order number generation (`crypto.randomBytes`)
- [x] Backend: Server-authoritative pricing & cart validation (`validateCart` in `order.service.ts`)
- [x] Backend: Haversine distance and branch delivery radius boundary enforcement

## Phase 12-16: UI/UX, Viewports, & End-to-End Validation (P1/P2)
- [x] Responsive layout validation across 6 viewports (375×812, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080)
- [x] Touch target size audit (minimum 48dp on all primary action buttons)
- [x] Form validation, duplicate submit prevention, and button loading spinners
- [x] Document limitations regarding external SMS providers and third-party push credentials
- [x] Final Production Acceptance Certification & Release Readiness Report
