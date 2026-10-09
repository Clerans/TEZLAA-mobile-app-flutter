# Product Requirements Document (PRD) — TEZLAA Artisan Food & Café Ecosystem

## 1. Executive Overview
The TEZLAA platform provides a unified multi-channel food ordering, real-time kitchen dispatch (KDS), loyalty, and administrative analytics ecosystem for an artisan café and restaurant chain.

## 2. Personas & Stakeholders
1. **Customer**: Mobile application user who browses menus, customizes drinks/pastries, applies promo codes or loyalty vouchers, places delivery or takeaway orders, tracks order progress live, and receives push/in-app updates.
2. **Branch Kitchen Staff / Barista**: Tablet-based KDS user who receives instant incoming orders, advances preparation stages (Confirmed -> Preparing -> Ready -> Picked Up / Dispatched), and manages real-time station flow.
3. **Branch Manager**: Monitors branch-specific orders, manages daily item availability, and handles customer escalations.
4. **Platform Administrator**: Supervises system-wide performance, manages cross-branch menus, categories, customers, and views consolidated revenue analytics.

## 3. Product Features & Implementation Status

| Feature ID | Feature Description | Platform | Implementation Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Customer Registration with Email/Password | User / Backend | Implemented | Dedicated verification OTP lifecycle being finalized |
| **AUTH-02** | Registration Email OTP Verification | User / Backend | Partially Implemented | Dedicated UI & purpose isolation required |
| **AUTH-03** | Password Reset via OTP | User / Backend | Implemented | Fully separated from registration verification |
| **AUTH-04** | Role-Based Access Control (RBAC) | Admin / Backend | Implemented | CUSTOMER, BRANCH_STAFF, BRANCH_MANAGER, ADMIN |
| **CAT-01** | Hierarchical Category & Product Catalog | All | Implemented | Product variants & modifier add-ons supported |
| **CART-01** | Local Cart Management | User | Implemented | Riverpod cart state with modifier pricing |
| **CART-02** | Authoritative Server Cart Revalidation | User / Backend | Implemented | Pre-checkout validation flags price/stock changes |
| **PAY-01** | Cash on Delivery (COD) Checkout | User / Backend | Implemented | Immediate CONFIRMED state with KDS dispatch |
| **PAY-02** | PayHere Online Card Payment | User / Backend | In Hardening | Moving from GET launchUrl to secure SDK/POST gateway |
| **PAY-03** | PayHere Webhook Notification Handling | Backend | In Hardening | Status 2, 0, -1, -2, -3 explicit state machine |
| **ORD-01** | Delivery Order Lifecycle | All | Implemented | PENDING -> CONFIRMED -> PREPARING -> READY -> OUT_FOR_DELIVERY -> DELIVERED |
| **ORD-02** | Pickup Order Lifecycle | All | Implemented | PENDING -> CONFIRMED -> PREPARING -> READY -> READY_FOR_PICKUP -> PICKED_UP |
| **ORD-03** | Idempotent Order Placement | User / Backend | Implemented | UUID idempotency key with IDOR user isolation |
| **LOY-01** | TEZLAA Circle Points & Tier System | User / Backend | Implemented | Automatic point accrual on completed orders |
| **LOY-02** | Coupon & Reward Reservations | User / Backend | Implemented | 30-min window with automated background expiry |
| **KDS-01** | Real-Time Kitchen Dispatch Screen | Admin | Implemented | Instant push with 25-second heartbeat fallback |
| **KDS-02** | Multi-Branch Terminal Isolation | Admin / Backend | In Hardening | Staff restricted strictly to assigned branch room |
| **ADM-01** | Executive Revenue & Orders Dashboard | Admin | Implemented | Typed error states being hardened against 0-revenue fallbacks |
| **ADM-02** | Inventory & Stock Availability Toggle | Admin | Implemented | Instantly reflects across customer catalog |

---

## 4. Non-Functional Requirements
- **Security**: Strict zero-trust pricing; no sensitive secrets on mobile clients; cryptographic signature verification for webhooks.
- **Resilience**: 25-second heartbeat fallback prevents rate-limiting bans while ensuring ticket delivery under intermittent socket disconnects.
- **Performance**: Sub-100ms API response times for catalog browsing; real-time socket latency < 300ms.
- **Portability**: Responsive design supporting mobile viewports (375x812 to 390x844) and desktop/tablet displays (768x1024 to 1920x1080).
