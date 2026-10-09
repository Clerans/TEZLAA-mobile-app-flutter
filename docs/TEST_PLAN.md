# TEZLAA - MASTER TEST PLAN

## 1. Test Pyramid Strategy
- **Unit Tests**:
  - Backend: Jest unit tests for pricing calculations, discount capping, tax rates, PayHere MD5 hash verification, PayHere status transitions (2, 0, -1, -2, -3).
  - Flutter: Unit tests for state notifiers, cart calculations, address validation, auth controllers.
- **Integration & API Tests**:
  - Supertest E2E for Express routes: `/api/v1/auth`, `/api/v1/orders`, `/api/v1/payments/payhere/notify`, `/api/v1/admin/*`.
  - Database consistency tests with Prisma transactions.
- **WebSocket Tests**:
  - Socket.IO connection authentication with JWT.
  - Room isolation verification (`admin:orders`, `branch:{branchId}`, `user:{userId}`).
  - Canonical event delivery tests (`order:created`, `order:status_updated`).
- **Widget & Screen Tests**:
  - Flutter User: Register screen, Verify Account screen, Checkout screen (payment selection, pending/cancellation handling), Order Tracking.
  - Flutter Admin: KDS screen (order transitions NEW -> PREPARING -> READY -> PICKED_UP), Analytics screen error & retry states.
- **E2E & Browser Automation**:
  - Customer ordering flow: Registration -> OTP verification -> Product browsing -> Add to cart -> Checkout -> PayHere flow -> Tracking.
  - Admin/Kitchen flow: Staff login -> KDS order receipt -> Status advance -> Branch isolation verification.

## 2. Test Execution Matrix
| Component | Test Suite | Framework | Status |
| :--- | :--- | :--- | :--- |
| Backend | Pricing & Security Unit/API | Jest + Supertest | Implemented (8 passing) |
| Backend | PayHere Webhook (2, 0, -1, -2, -3) | Jest + Supertest | In Progress (P0) |
| Backend | Auth OTP Purpose Isolation | Jest + Supertest | In Progress (P0) |
| Backend | WebSocket Room Isolation | Jest + socket.io-client | Planned (P1) |
| Flutteruser | Riverpod Notifiers (Cart, Auth) | flutter_test | Implemented |
| Flutteruser | Verify Account & Checkout Flow | flutter_test | In Progress (P0) |
| Flutteradmin | KDS Order Status Transitions | flutter_test | In Progress (P1) |
| Flutteradmin | Error & Retry UI States | flutter_test | In Progress (P1) |
| E2E | Customer & Staff Scenarios | Playwright / Integration | Planned (P1/P2) |

## 3. Coverage Targets & Constraints
- Authoritative Pricing & Coupon / Loyalty: 100% test coverage.
- PayHere Payment State Machine: 100% test coverage for all status codes (2, 0, -1, -2, -3).
- No synthetic assertions passed off as real tests.
- Zero silent fallbacks (e.g., catching errors and asserting empty arrays).
