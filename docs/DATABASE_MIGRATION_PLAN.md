# TEZLAA — Monetary Database Migration & Rollback Specification

**Version**: 1.0.0  
**Domain**: PostgreSQL / Prisma ORM Database Schema  
**Subject**: Precision Migration from `DOUBLE PRECISION` (`Float`) to `DECIMAL(10, 2)`

---

## 1. Executive Summary & Rationale

In PostgreSQL, Prisma maps the `Float` scalar type to `DOUBLE PRECISION` (64-bit IEEE 754 binary floating point). While adequate for non-financial continuous metrics (such as geographical latitude/longitude), binary floating-point representations can introduce minor rounding anomalies (e.g. `19.99 * 3 = 59.970000000000006`).

To achieve absolute mathematical precision across multi-currency, coupon, and PayHere payment gateways, this document specifies a **safe, zero-data-loss, backward-compatible migration plan** to convert all financial fields to `DECIMAL(10, 2)`.

---

## 2. Target Column Inventory

The following 18 columns across 8 models represent financial amounts requiring exact decimal precision:

| Model / Table | Column Name | Current PostgreSQL Type | Target PostgreSQL Type |
| :--- | :--- | :--- | :--- |
| `Order` | `subtotal` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Order` | `deliveryFee` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Order` | `discount` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Order` | `loyaltyDiscount` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Order` | `grandTotal` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `OrderItem` | `unitPrice` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `OrderItem` | `totalPrice` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `OrderItemAddon` | `price` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Payment` | `amount` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Product` | `price` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Product` | `discountedPrice` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `ProductVariant` | `price` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `ProductAddon` | `price` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Coupon` | `discountValue` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Coupon` | `minOrderValue` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Coupon` | `maxDiscount` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |
| `Promotion` | `discountPercentage`| `DOUBLE PRECISION` | `DECIMAL(5, 2)` |
| `Promotion` | `discountAmount` | `DOUBLE PRECISION` | `DECIMAL(10, 2)` |

*Note: Geographical coordinates (`Address.latitude`, `Address.longitude`, `Branch.latitude`, `Branch.longitude`, `Branch.deliveryRadiusKm`, `Product.rating`) remain `DOUBLE PRECISION` / `Float`.*

---

## 3. Backward-Compatible Application Safeguards (Phase 1 — Deployed)

Before applying database table alterations, the application layer has already been hardened with epsilon-adjusted half-up rounding in [`Backend/src/utils/money.ts`](file:///c:/Users/micha/OneDrive/Desktop/Personal%20project/FLUTTER/Backend/src/utils/money.ts):
- Every item unit price, addon price sum, subtotal, delivery fee, and grand total is normalized via `roundMoney()`.
- Currency conversions to minor units (cents) via `toCents()` guarantee integer precision when communicating with PayHere webhooks.
- Both Float and Decimal database drivers are natively handled by Prisma client.

---

## 4. Phase 2: Idempotent SQL Migration Script

The following SQL migration can be run non-destructively in a scheduled maintenance window via `psql` or `npx prisma db execute`:

```sql
-- ====================================================================
-- TEZLAA MIGRATION: Convert Floating-Point Money to Exact DECIMAL(10, 2)
-- Safe, non-destructive migration preserving all existing records.
-- ====================================================================

BEGIN;

-- 1. Order Table
ALTER TABLE "Order"
  ALTER COLUMN "subtotal" TYPE DECIMAL(10, 2) USING ROUND("subtotal"::numeric, 2),
  ALTER COLUMN "deliveryFee" TYPE DECIMAL(10, 2) USING ROUND("deliveryFee"::numeric, 2),
  ALTER COLUMN "discount" TYPE DECIMAL(10, 2) USING ROUND("discount"::numeric, 2),
  ALTER COLUMN "loyaltyDiscount" TYPE DECIMAL(10, 2) USING ROUND("loyaltyDiscount"::numeric, 2),
  ALTER COLUMN "grandTotal" TYPE DECIMAL(10, 2) USING ROUND("grandTotal"::numeric, 2);

-- 2. OrderItem Table
ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(10, 2) USING ROUND("unitPrice"::numeric, 2),
  ALTER COLUMN "totalPrice" TYPE DECIMAL(10, 2) USING ROUND("totalPrice"::numeric, 2);

-- 3. OrderItemAddon Table
ALTER TABLE "OrderItemAddon"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2);

-- 4. Payment Table
ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE DECIMAL(10, 2) USING ROUND("amount"::numeric, 2);

-- 5. Product Table
ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "discountedPrice" TYPE DECIMAL(10, 2) USING ROUND("discountedPrice"::numeric, 2);

-- 6. ProductVariant Table
ALTER TABLE "ProductVariant"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2);

-- 7. ProductAddon Table
ALTER TABLE "ProductAddon"
  ALTER COLUMN "price" TYPE DECIMAL(10, 2) USING ROUND("price"::numeric, 2);

-- 8. Coupon Table
ALTER TABLE "Coupon"
  ALTER COLUMN "discountValue" TYPE DECIMAL(10, 2) USING ROUND("discountValue"::numeric, 2),
  ALTER COLUMN "minOrderValue" TYPE DECIMAL(10, 2) USING ROUND("minOrderValue"::numeric, 2),
  ALTER COLUMN "maxDiscount" TYPE DECIMAL(10, 2) USING ROUND("maxDiscount"::numeric, 2);

-- 9. Promotion Table
ALTER TABLE "Promotion"
  ALTER COLUMN "discountPercentage" TYPE DECIMAL(5, 2) USING ROUND("discountPercentage"::numeric, 2),
  ALTER COLUMN "discountAmount" TYPE DECIMAL(10, 2) USING ROUND("discountAmount"::numeric, 2);

COMMIT;
```

---

## 5. Rollback Plan

If a rollback is required, execute the following script to return all columns back to `DOUBLE PRECISION` without data truncation:

```sql
BEGIN;

ALTER TABLE "Order"
  ALTER COLUMN "subtotal" TYPE DOUBLE PRECISION,
  ALTER COLUMN "deliveryFee" TYPE DOUBLE PRECISION,
  ALTER COLUMN "discount" TYPE DOUBLE PRECISION,
  ALTER COLUMN "loyaltyDiscount" TYPE DOUBLE PRECISION,
  ALTER COLUMN "grandTotal" TYPE DOUBLE PRECISION;

ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE DOUBLE PRECISION,
  ALTER COLUMN "totalPrice" TYPE DOUBLE PRECISION;

ALTER TABLE "OrderItemAddon"
  ALTER COLUMN "price" TYPE DOUBLE PRECISION;

ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE DOUBLE PRECISION;

ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DOUBLE PRECISION,
  ALTER COLUMN "discountedPrice" TYPE DOUBLE PRECISION;

ALTER TABLE "ProductVariant"
  ALTER COLUMN "price" TYPE DOUBLE PRECISION;

ALTER TABLE "ProductAddon"
  ALTER COLUMN "price" TYPE DOUBLE PRECISION;

ALTER TABLE "Coupon"
  ALTER COLUMN "discountValue" TYPE DOUBLE PRECISION,
  ALTER COLUMN "minOrderValue" TYPE DOUBLE PRECISION,
  ALTER COLUMN "maxDiscount" TYPE DOUBLE PRECISION;

ALTER TABLE "Promotion"
  ALTER COLUMN "discountPercentage" TYPE DOUBLE PRECISION,
  ALTER COLUMN "discountAmount" TYPE DOUBLE PRECISION;

COMMIT;
```
