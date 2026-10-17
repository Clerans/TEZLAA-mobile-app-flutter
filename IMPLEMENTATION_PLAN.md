# TEZLAA — Implementation Plan & Engineering Remediation Log

**Scope**: File-level change tracking, dependencies, and execution logs across Backend, Flutteruser, and Flutteradmin.

---

## 1. Prioritized Defect Fixes & File-Level Changes

### Batch 1: Real-Time Event Reliability & Concurrency (P0/P1)
1. **`Flutteruser/lib/providers/order_provider.dart`**:
   - **Issue**: `orderDetailProvider` immediately invalidated itself on every WebSocket `order:status_updated` event, causing rapid duplicate API calls and race conditions when multiple events arrived simultaneously.
   - **Fix**: Wrapped the invalidation in a 300ms debounce timer (`Timer? debounceTimer`). Added proper cancellation in `ref.onDispose`.
   - **Verification**: Verified timer cancellation and state stability.

2. **`Flutteradmin/lib/providers/admin_providers.dart`**:
   - **Issue**: `kdsOrdersProvider` immediately invoked `fetchActive()` on every incoming order event, causing high database load and UI stuttering during peak kitchen order arrivals.
   - **Fix**: Introduced a 300ms debounce timer (`socketDebounceTimer`) in the `socketService.orderEvents.listen` subscription with clean cancellation in `ref.onDispose`.
   - **Verification**: Verified debounce throttling during simulated multi-event bursts.

---

### Batch 2: Admin Service Integrity & Error Transparency (P1)
3. **`Flutteradmin/lib/services/admin_services.dart`**:
   - **Issue**: `AdminProductService.getProducts()` and `AdminCategoryService.getCategories()` silently caught exceptions and fell back to public `/products` and `/categories` endpoints, masking administrative authorization failures and server outages.
   - **Fix**: Removed silent fallback try-catch blocks. Both methods now rethrow typed errors directly to Riverpod providers for actionable UI handling.
   - **Verification**: Confirmed admin inventory calls fail fast with appropriate error presentation.

4. **`Flutteradmin/lib/screens/analytics/admin_analytics_screen.dart`**:
   - **Issue**: Screen displayed hardcoded `'+18.4% compared to previous cycle'` badge, presenting fabricated marketing data as live financial analytics.
   - **Fix**: Replaced static percentage badge with an authoritative live operational metric indicator (`Live aggregated metric across authorized branches`).
   - **Verification**: Screen visual check and widget hierarchy inspection.

---

### Batch 3: Client Session Parity & Token Lifecycle (P1)
5. **`Flutteradmin/lib/services/storage_service.dart`**:
   - **Issue**: `AdminStorageService` only stored access token; lacked refresh token storage, preventing silent token renewal.
   - **Fix**: Added `_refreshTokenKey`, `saveRefreshToken(String)`, `getRefreshToken()`, and updated `clear()` to delete both access and refresh tokens.
   - **Verification**: Verified token persistence and deletion in unit tests.

6. **`Flutteradmin/lib/core/network/api_client.dart`**:
   - **Issue**: `AdminApiClient` immediately cleared storage and logged staff out upon receiving HTTP 401, making it unsafe to reduce access token TTL.
   - **Fix**: Added an automatic 401 refresh interceptor using a bare `Dio` instance to hit `POST /auth/refresh` with the stored refresh token, re-attempting the original request with the fresh access token before logging the user out.
   - **Verification**: Confirmed automatic re-authentication flow without session interruption.

7. **`Flutteradmin/lib/services/admin_services.dart` (`AdminAuthService.login`)**:
   - **Issue**: `AdminAuthService.login` did not persist the returned `refreshToken`.
   - **Fix**: Updated `login()` to persist `refreshToken` to `AdminStorageService` upon successful authentication.
   - **Verification**: Verified token storage upon successful login.

---

### Batch 4: Usability & Error Recovery (P1)
8. **`Flutteruser/lib/screens/screens/order_tracking_screen.dart`**:
   - **Issue**: Error state was a non-interactive static text: `const Center(child: Text('Order tracking unavailable'))`.
   - **Fix**: Implemented a full error card featuring an alert icon, formatted error message, "Retry Live Tracking" button (`ref.invalidate(orderDetailProvider(orderId))`), and a "Return to Home" navigation option.
   - **Verification**: Verified error presentation and retry callback execution.

---

## 2. Dependencies & Operational Safeguards

- **Backend / Prisma**: No schema modifications required for these client and socket reliability fixes; database constraints and transaction boundaries remain fully preserved.
- **Flutter SDK**: All changes adhere strictly to Flutter 3.24+ standards and clean Riverpod state management patterns without introducing new external packages or native bridge risks.
- **PayHere Payment**: Preserved official MD5 signing on backend and customer cart preservation on checkout screen.
