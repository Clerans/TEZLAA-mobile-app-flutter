# TEZLAA — Unified API Contracts Specification

**Version**: 1.0.0  
**Base URL**: `https://tezlaa-mobile-app-flutter.onrender.com/api/v1`  
**Socket URL**: `https://tezlaa-mobile-app-flutter.onrender.com`

---

## 1. Authentication & Session Management

### 1.1 POST `/auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "customer@tezlaa.lk",
    "password": "SecurePassword123!",
    "fullName": "Kasun Perera",
    "phone": "+94771234567"
  }
  ```
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "message": "Registration successful. A 6-digit verification code has been sent to your email.",
    "data": {
      "user": { "id": "uuid", "email": "customer@tezlaa.lk", "fullName": "Kasun Perera", "role": "CUSTOMER" },
      "requiresVerification": true
    }
  }
  ```

### 1.2 POST `/auth/verify-otp`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "customer@tezlaa.lk",
    "otp": "123456",
    "purpose": "REGISTER"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "customer@tezlaa.lk", "role": "CUSTOMER", "isVerified": true },
      "accessToken": "jwt_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
  ```

### 1.3 POST `/auth/login`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "customer@tezlaa.lk",
    "password": "SecurePassword123!"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password
  - `403 Forbidden`: Account unverified ("Please verify your email before logging in.")

---

## 2. Order Lifecycle & Checkout

### 2.1 POST `/orders/validate-cart`
- **Auth**: Bearer JWT
- **Request Body**:
  ```json
  {
    "branchId": "branch-uuid",
    "orderType": "DELIVERY",
    "items": [
      {
        "productId": "prod-uuid",
        "variantId": "variant-uuid",
        "quantity": 2,
        "addonIds": ["addon-1"],
        "clientUnitPrice": 850.00
      }
    ]
  }
  ```
- **Success Response (200)**: Authoritative prices, delivery fee calculations, and change notices.

### 2.2 POST `/orders`
- **Auth**: Bearer JWT
- **Request Body**:
  ```json
  {
    "branchId": "branch-uuid",
    "orderType": "DELIVERY",
    "addressId": "address-uuid",
    "paymentMethod": "CARD",
    "couponCode": "WELCOME10",
    "rewardId": null,
    "idempotencyKey": "unique-client-guid",
    "items": [...]
  }
  ```
- **Response**: Server returns authoritative order and PayHere checkout parameters (MD5 hash calculated on server).

---

## 3. PayHere Payment Webhook & Notifications

### 3.1 POST `/payments/payhere/notify`
- **Auth**: Server-to-Server MD5 Signature Validation
- **Payload (`application/x-www-form-urlencoded`)**:
  - `merchant_id`: string
  - `order_id`: string (`orderNumber`)
  - `payment_id`: string (PayHere transaction reference)
  - `payhere_amount`: string
  - `payhere_currency`: "LKR"
  - `status_code`: "2" (COMPLETED), "0" (PENDING), "-1" (CANCELLED), "-2" (FAILED), "-3" (CHARGEBACK)
  - `md5sig`: string
- **Server Response**:
  - `200 OK`: `{ "success": true, "status": "COMPLETED" | "PENDING" | "CANCELLED" | "FAILED" | "CHARGEBACK" }`

---

## 4. Socket.IO Real-Time Contracts

### 4.1 Connection & Handshake
- Client passes `token` in `auth: { token: '<jwt>' }`.
- Server automatically joins authorized rooms:
  - `user:<userId>`
  - `branch:<branchId>` (for `BRANCH_STAFF` / `BRANCH_MANAGER`)
  - `admin:orders` & `admin` (strictly for `ADMIN` role)

### 4.2 Events Emitted by Server
- `order:created` -> Emitted to `branch:<branchId>` and `admin:orders`.
- `order:status_updated` -> Emitted to `order:<orderId>`, `user:<userId>`, and `branch:<branchId>`.
- `kds:joined` -> Confirmation of room subscription.
- `socket:error` -> Emitted if unauthorized subscription is attempted.
