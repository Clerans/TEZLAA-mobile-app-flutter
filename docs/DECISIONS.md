# TEZLAA - ARCHITECTURE DECISION RECORDS (ADR)

## ADR-001: PayHere Integration Strategy
- **Context**: `launchUrl(GET)` with query parameters exposes payment initiation to URL manipulation, lacks native lifecycle callbacks, and clears cart prematurely.
- **Decision**: Use the official PayHere mobile parameters with backend-generated hash signing. In Flutter mobile environments, utilize native PayHere Mobile SDK with `hash` parameter (leaving `merchant_secret` empty), or an authenticated POST sheet. Cart is retained until confirmation or explicit dismissal.
- **Consequences**: Zero secret leakage; deterministic success/pending/cancelled/error callbacks.

## ADR-002: PayHere Status Code State Machine
- **Context**: Status 0 was grouped into `else` (FAILED) in payment webhook processing, cancelling orders while bank payments were still pending. Status -3 (CHARGEBACK) had no audit or reconciliation path.
- **Decision**: Explicit handling for:
  - `2`: COMPLETED -> Order CONFIRMED
  - `0`: PENDING -> Order PENDING_PAYMENT, retain reservations, poll/webhook wait
  - `-1`: CANCELLED -> Order CANCELLED, release reservations
  - `-2`: FAILED -> Order FAILED, release reservations
  - `-3`: CHARGEBACK -> Flagged DISPUTED, audit recorded, points reversed
- **Consequences**: No premature cancellation for asynchronous payment clearances.

## ADR-003: Registration OTP vs Password Reset Isolation
- **Context**: Registration immediately routed to `/home` without account verification. `verify_otp_screen.dart` was hardcoded to reset password. Shared `otpCode` field caused verification to overwrite or invalidate reset tokens.
- **Decision**: Separate registration verification from password reset. Introduce dedicated `VerifyAccountScreen` in Flutter and isolate OTP verification logic.
- **Consequences**: Verified customer database; clear security perimeter.

## ADR-004: WebSocket Room & Event Standardization
- **Context**: Branch staff were joining `admin:orders`, leaking cross-branch orders. Status changes emitted 3 duplicate aliases simultaneously, multiplying client API calls.
- **Decision**: Canonical events `order:created` and `order:status_updated`. Scope `BRANCH_STAFF` strictly to `branch:{branchId}`. Add 300ms client debouncing on listener triggers.
- **Consequences**: Clean branch data isolation; 66% reduction in redundant API queries on order status updates.

## ADR-005: Elimination of Admin Silent Fallbacks
- **Context**: Services caught errors and returned `[]` or `Rs. 0`, making broken servers appear like empty stores or zero-revenue days.
- **Decision**: Propagate typed errors to UI and display explicit Error & Retry states.
- **Consequences**: Accurate monitoring, immediate user feedback, no silent data corruption.
