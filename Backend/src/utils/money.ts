/**
 * TEZLAA Monetary Calculation & Exact Rounding Utilities
 * Prevents IEEE-754 binary floating-point representation anomalies across
 * price sums, percentage discounts, taxes, and PayHere payment gateways.
 */

/**
 * Rounds monetary amounts to exactly 2 decimal places using epsilon-adjusted rounding.
 */
export const roundMoney = (amount: number): number => {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

/**
 * Converts a major currency unit (LKR) to integer minor currency units (cents).
 * Ensures zero precision loss when communicating with financial ledgers.
 */
export const toCents = (amount: number): number => {
  return Math.round((amount + Number.EPSILON) * 100);
};

/**
 * Converts integer minor units (cents) to a major currency unit (LKR).
 */
export const fromCents = (cents: number): number => {
  return roundMoney(cents / 100);
};

/**
 * Formats a monetary amount to a standard currency display string (e.g. "Rs. 1,250.00").
 */
export const formatLkr = (amount: number): string => {
  const rounded = roundMoney(amount);
  return `Rs. ${rounded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
