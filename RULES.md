# TEZLAA ENGINEERING RULES & OPERATIONAL CONSTRAINTS

## 1. Zero Architectural Rewrites
- Do not replace or refactor established architectural patterns without explicit root-cause justification.
- Retain existing Express service-controller-repository pattern, Riverpod state management, and GoRouter routing.

## 2. Security First
- Never place secrets (API keys, merchant secrets, private keys, database passwords) into client apps or commit them into git.
- Server must always remain authoritative for pricing, inventory, discounts, loyalty points, and payment verification.

## 3. Real Tests Only
- Never claim tests passed unless executed and verified.
- Synthetic assertions must not be labeled as E2E tests.
- PayHere integration must be verified with all status codes (2, 0, -1, -2, -3).

## 4. UI Error Handling
- No silent fallbacks. Never convert API exceptions into empty lists `[]` or zero analytics `0`.
- All screens must handle Loading, Success, Empty, Error, and Retry states.

## 5. Branch Isolation
- Kitchen Display System (KDS) and branch managers must only ever receive orders and events belonging to their assigned `branchId`.
