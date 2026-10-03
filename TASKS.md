# TEZLAA PRODUCTION ACCEPTANCE TASK TRACKER

## Phase 0: Project Context & Audit
- [x] Full codebase audit of Backend, Flutteruser, and Flutteradmin
- [x] Document drift identification & cataloging (AUDIT-01 through AUDIT-10)

## Phase 1: Current Documentation & Source of Truth
- [x] `docs/PRD.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DESIGN.md`
- [x] `docs/TEST_PLAN.md`
- [x] `docs/SECURITY.md`
- [x] `docs/DECISIONS.md`
- [x] `docs/MEMORY.md`
- [x] `RULES.md`
- [x] `TASKS.md`

## Phase 3 & 4: Critical Payment Repair & PayHere State Machine (P0)
- [ ] Backend: Explicit status handling for PayHere webhook:
  - 2 = COMPLETED (order CONFIRMED)
  - 0 = PENDING (order PENDING_PAYMENT, reservations retained)
  - -1 = CANCELLED (order CANCELLED, release reservations)
  - -2 = FAILED (order FAILED, release reservations)
  - -3 = CHARGEBACK (order DISPUTED, audit trail recorded, points reversed)
- [ ] Backend: Integration test covering all 5 PayHere status codes
- [ ] Flutteruser: Secure PayHere checkout invocation (no launchUrl with GET params)
- [ ] Flutteruser: Preserve cart on cancellation/dismissal, clear only on verified payment

## Phase 5: Registration & OTP Verification Lifecycle (P0)
- [ ] Backend: Separate OTP purpose (`REGISTER` vs `PASSWORD_RESET`)
- [ ] Backend: Restrict login / token issuance for unverified accounts
- [ ] Flutteruser: Dedicated `VerifyAccountScreen` with OTP input & resend timer
- [ ] Flutteruser: Registration navigation flow: Register -> Verify Account -> Home

## Phase 6 & 7: WebSocket Canonicalization & Branch Isolation (P0/P1)
- [ ] Backend: Restrict `BRANCH_STAFF` to room `branch:{branchId}` (remove from `admin:orders`)
- [ ] Backend: Canonicalize events (`order:created`, `order:status_updated`)
- [ ] Flutteradmin & Flutteruser: Debounce WebSocket triggers (300ms) to avoid duplicate API calls

## Phase 8 & 9: KDS & Admin Error Handling (P1)
- [ ] Flutteradmin: Remove silent fallbacks (`return []`, Rs. 0 summary) in `admin_services.dart`
- [ ] Flutteradmin: Add typed error & retry states to analytics, menu, orders screens

## Phase 10 & 11: Production Configuration & Security Hardening (P1/P2)
- [ ] Audit CORS, JWT TTL, environment variables, rate limiting
- [ ] Verify server-authoritative pricing & cart validation

## Phase 12-16: UI/UX, Viewports, & End-to-End Validation (P1/P2)
- [ ] Responsive layouts check (375x812 to 1920x1080)
- [ ] Automated browser testing with Playwright MCP
- [ ] Final Acceptance Report (Phase 19)
