# Architecture Document — TEZLAA Artisan Food & Café Ecosystem

## 1. System Architecture Overview

The system is partitioned into three decoupled sub-applications communicating over secure REST APIs and WebSocket streams.

```
                          ┌─────────────────────────┐
                          │   PostgreSQL Database   │
                          │   (Prisma 5.22 Schema)  │
                          └────────────┬────────────┘
                                       │
                                       │ Connection Pool
                                       ▼
                       ┌───────────────────────────────┐
                       │      Node.js / Express API    │
                       │         (TypeScript)          │
                       ├───────────────────────────────┤
                       │ • JWT Auth + RBAC Middleware  │
                       │ • Authoritative Pricing Engine│
                       │ • PayHere Provider & Webhook  │
                       │ • Socket.IO Gateway           │
                       │ • Reservation Cleanup Worker  │
                       └───────┬───────────────┬───────┘
                               │               │
                    REST / SSL │               │ WebSocket Push
                               ▼               ▼
          ┌───────────────────────────┐   ┌───────────────────────────┐
          │  Flutter User Application │   │ Flutter Admin Application │
          │  • Riverpod State Mgmt    │   │ • Live KDS Terminal       │
          │  • GoRouter Guarded Flow  │   │ • Multi-Branch Isolation  │
          │  • PayHere Mobile Bridge  │   │ • Inventory & Analytics   │
          │  • Live Order Tracker     │   │ • Typed Error UI States   │
          └───────────────────────────┘   └───────────────────────────┘
```

## 2. Authentication & Authorization Architecture
- **Stateless Tokens**: Access tokens (JWT, 7 days expiry) signed with `JWT_SECRET`. Refresh tokens (30 days expiry) signed with `JWT_REFRESH_SECRET`.
- **RBAC Matrix**:
  - `CUSTOMER`: Access to personal profile, orders, addresses, loyalty, notifications.
  - `BRANCH_STAFF`: KDS order state management for assigned branch only (`branchId`).
  - `BRANCH_MANAGER`: KDS management, inventory toggles, and branch dashboard for assigned branch.
  - `ADMIN`: Global cross-branch analytics, staff assignment, product/category catalog management.
- **Route Guards**:
  - `Flutteruser`: Redirect guards prevent unauthenticated checkout and order tracking.
  - `Flutteradmin`: Redirect guards force login before accessing `/dashboard`, `/kds`, `/orders`, etc.

## 3. Real-Time WebSocket Channel Topology
- **Room `user:${userId}`**: Emits order milestone alerts and personal notifications.
- **Room `order:${orderId}`**: Emits granular lifecycle progress to active customer tracking screen.
- **Room `branch:${branchId}`**: Emits new orders and status updates strictly to kitchen terminals assigned to that branch.
- **Room `admin:orders`**: Emits consolidated platform-wide order activities to global administrators.

## 4. Payment Gateway Architecture (PayHere)
- **Zero Client Secrets**: Flutter client receives a pre-signed checkout payload from `POST /api/v1/orders`.
- **HMAC-MD5 Signature Formula**:
  `strtoupper(md5(merchant_id + order_id + formatted_amount + currency + strtoupper(md5(merchant_secret))))`
- **Server Webhook Confirmation**: Final confirmation is executed strictly via `POST /api/v1/payments/payhere/notify` with verification of `md5sig`.

## 5. Reservation Lifecycle & Cleanup Architecture
- Coupon and loyalty points are locked into `RESERVED` status for 30 minutes during pending checkouts.
- An unref'd timer worker in `server.ts` executes `ReservationService.expireStaleReservations()` every 5 minutes.
- Stale reservations transition to `EXPIRED` and release discounts, preventing abandoned carts from permanently blocking inventory or rewards.
