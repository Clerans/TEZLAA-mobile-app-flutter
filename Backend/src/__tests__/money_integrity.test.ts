import { roundMoney, toCents, fromCents, formatLkr } from '../utils/money.js';

describe('Monetary Arithmetic, Rounding & Financial Integrity', () => {
  it('correctly resolves IEEE-754 floating point precision anomalies', () => {
    // Standard floating-point anomaly: 0.1 + 0.2 = 0.30000000000000004
    const floatSum = 0.1 + 0.2;
    expect(floatSum).not.toBe(0.3);
    expect(roundMoney(floatSum)).toBe(0.3);

    // Compound tax/discount scenario: 1250 * 0.15 = 187.5
    expect(roundMoney(1250 * 0.15)).toBe(187.5);

    // Fractional cent scenario: 99.99 * 3 = 299.97000000000003
    expect(roundMoney(99.99 * 3)).toBe(299.97);

    // Division resulting in repeating decimals: 1000 / 3 = 333.3333333333333
    expect(roundMoney(1000 / 3)).toBe(333.33);
  });

  it('safely converts to integer cents and back without precision loss', () => {
    const originalPrice = 2450.75;
    const cents = toCents(originalPrice);
    expect(cents).toBe(245075);
    expect(fromCents(cents)).toBe(originalPrice);

    // Edge case: single cent
    expect(toCents(0.01)).toBe(1);
    expect(fromCents(1)).toBe(0.01);

    // Zero
    expect(toCents(0)).toBe(0);
    expect(fromCents(0)).toBe(0);
  });

  it('formats LKR currency strings cleanly for UI and invoices', () => {
    expect(formatLkr(1250)).toBe('Rs. 1,250.00');
    expect(formatLkr(5000000.5)).toBe('Rs. 5,000,000.50');
    expect(formatLkr(0)).toBe('Rs. 0.00');
  });

  it('handles negative and non-finite numbers safely', () => {
    expect(roundMoney(NaN)).toBe(0);
    expect(roundMoney(Infinity)).toBe(0);
    expect(roundMoney(-50.256)).toBe(-50.26);
  });

  it('guarantees financial consistency across order subtotals and discounts', () => {
    const item1 = roundMoney(350.50 * 2); // 701.00
    const item2 = roundMoney(125.25 * 3); // 375.75
    const item3 = roundMoney(890.00 * 1); // 890.00
    const subtotal = roundMoney(item1 + item2 + item3); // 1966.75
    expect(subtotal).toBe(1966.75);

    // 15% coupon discount on 1966.75 = 295.0125 -> 295.01
    const discount = roundMoney((subtotal * 15) / 100);
    expect(discount).toBe(295.01);

    // Delivery fee = 350
    const deliveryFee = 350.00;

    // Grand total: 1966.75 + 350 - 295.01 = 2021.74
    const grandTotal = roundMoney(subtotal + deliveryFee - discount);
    expect(grandTotal).toBe(2021.74);

    // PayHere integer amount verification
    expect(toCents(grandTotal)).toBe(202174);
  });
});
