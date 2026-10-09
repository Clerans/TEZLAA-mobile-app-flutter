import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export interface PayHereCustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country?: string;
}

export interface PayHereCheckoutParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
  sandbox: boolean;
  checkout_url: string;
}

export interface PayHereNotificationPayload {
  merchant_id: string;
  order_id: string;
  payment_id?: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
  custom_1?: string;
  custom_2?: string;
  method?: string;
  status_message?: string;
  card_holder_name?: string;
  card_no?: string;
  card_expiry?: string;
}

export class PayHereProvider {
  private merchantId: string;
  private merchantSecret: string;
  private isSandbox: boolean;

  constructor() {
    this.merchantId = env.PAYHERE_MERCHANT_ID;
    this.merchantSecret = env.PAYHERE_MERCHANT_SECRET;
    this.isSandbox = env.PAYHERE_MODE === 'sandbox';
  }

  getCheckoutUrl(): string {
    return this.isSandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout';
  }

  /**
   * Generates the PayHere MD5 Checkout Hash
   * Formula: strtoupper(md5(merchant_id + order_id + formatted_amount + currency + strtoupper(md5(merchant_secret))))
   */
  generateCheckoutHash(orderNumber: string, amount: number, currency: string = 'LKR'): string {
    const formattedAmount = amount.toFixed(2);
    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    const dataToHash = `${this.merchantId}${orderNumber}${formattedAmount}${currency}${hashedSecret}`;
    return crypto
      .createHash('md5')
      .update(dataToHash)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Builds the signed PayHere checkout request object for webview or browser invocation
   */
  createCheckoutPayload(params: {
    orderNumber: string;
    amount: number;
    currency?: string;
    customer: PayHereCustomerInfo;
    itemsSummary: string;
    returnUrl?: string;
    cancelUrl?: string;
    notifyUrl?: string;
  }): PayHereCheckoutParams {
    if (!params.customer.firstName?.trim()) {
      throw ApiError.badRequest('Customer first name is required for online checkout');
    }
    if (!params.customer.email?.trim()) {
      throw ApiError.badRequest('Customer email is required for online checkout');
    }
    if (!params.customer.phone?.trim()) {
      throw ApiError.badRequest('Customer phone number is required for online checkout');
    }
    if (!params.customer.address?.trim()) {
      throw ApiError.badRequest('Customer address is required for online checkout');
    }
    if (!params.customer.city?.trim()) {
      throw ApiError.badRequest('Customer city is required for online checkout');
    }

    const currency = params.currency || 'LKR';
    const formattedAmount = params.amount.toFixed(2);
    const hash = this.generateCheckoutHash(params.orderNumber, params.amount, currency);

    const notifyUrl = params.notifyUrl || env.PAYHERE_NOTIFY_URL;
    if (!notifyUrl && !this.isSandbox) {
      throw ApiError.badRequest('PAYHERE_NOTIFY_URL must be explicitly configured for production payment processing.');
    }

    return {
      merchant_id: this.merchantId,
      return_url: params.returnUrl || 'https://sandbox.payhere.lk/pay/payment-complete',
      cancel_url: params.cancelUrl || 'https://sandbox.payhere.lk/pay/payment-cancel',
      notify_url: notifyUrl || 'https://sandbox.payhere.lk/pay/notify',
      order_id: params.orderNumber,
      items: params.itemsSummary || `TEZLAA Artisan Café Order #${params.orderNumber}`,
      currency,
      amount: formattedAmount,
      first_name: params.customer.firstName.trim(),
      last_name: params.customer.lastName?.trim() || params.customer.firstName.trim(),
      email: params.customer.email.trim().toLowerCase(),
      phone: params.customer.phone.trim(),
      address: params.customer.address.trim(),
      city: params.customer.city.trim(),
      country: params.customer.country?.trim() || 'Sri Lanka',
      hash,
      sandbox: this.isSandbox,
      checkout_url: this.getCheckoutUrl(),
    };
  }

  /**
   * Verifies the server-to-server webhook MD5 signature sent by PayHere
   * Formula: strtoupper(md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + strtoupper(md5(merchant_secret))))
   */
  verifyNotificationSignature(payload: PayHereNotificationPayload): boolean {
    if (!payload.merchant_id || !payload.order_id || !payload.payhere_amount || !payload.payhere_currency || !payload.status_code || !payload.md5sig) {
      return false;
    }

    // Verify Merchant ID matches
    if (payload.merchant_id !== this.merchantId) {
      return false;
    }

    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    const dataToHash = `${payload.merchant_id}${payload.order_id}${payload.payhere_amount}${payload.payhere_currency}${payload.status_code}${hashedSecret}`;
    const calculatedMd5Sig = crypto
      .createHash('md5')
      .update(dataToHash)
      .digest('hex')
      .toUpperCase();

    return calculatedMd5Sig === payload.md5sig.toUpperCase();
  }

  /**
   * Helper to generate notification signature for testing & simulations
   */
  generateNotificationSignature(orderId: string, payhereAmount: string, currency: string, statusCode: string): string {
    const hashedSecret = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    const dataToHash = `${this.merchantId}${orderId}${payhereAmount}${currency}${statusCode}${hashedSecret}`;
    return crypto
      .createHash('md5')
      .update(dataToHash)
      .digest('hex')
      .toUpperCase();
  }
}

export const payHereProvider = new PayHereProvider();
export default payHereProvider;
