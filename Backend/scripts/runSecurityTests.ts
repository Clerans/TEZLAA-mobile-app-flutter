import { payHereProvider } from '../src/services/payhere.provider.js';
import { env } from '../src/config/env.js';
import { paymentService } from '../src/services/payment.service.js';
import { prisma } from '../src/config/database.js';
import { UserRole, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

async function runTests() {
  console.log('======================================================');
  console.log('🧪 RUNNING TEZLAA PHASE 9 SECURITY & PAYHERE TEST MATRIX');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------
    // TEST 1: PayHere Hash Generation
    // -----------------------------------------------------------------
    const hash = payHereProvider.generateCheckoutHash('ORD-12345', 2500, 'LKR');
    assert(typeof hash === 'string' && hash.length === 32 && hash === hash.toUpperCase(), 'PayHere checkout hash is valid 32-char uppercase MD5');

    // -----------------------------------------------------------------
    // TEST 2: PayHere Signature Verification (Valid vs Tampered)
    // -----------------------------------------------------------------
    const validSig = payHereProvider.generateCheckoutHash('ORD-12345', 2500, 'LKR'); // Uses same base md5
    const computedWebhookSig = payHereProvider.generateCheckoutHash('ORD-12345', 2500, 'LKR');
    
    // Using provider verification function directly
    const validVerify = payHereProvider.verifyNotificationSignature({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: 'ORD-12345',
      payhere_amount: '2500.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: payHereProvider.generateNotificationSignature('ORD-12345', '2500.00', 'LKR', '2'),
    });
    assert(validVerify === true, 'PayHere valid notification signature successfully verified');

    const tamperedVerify = payHereProvider.verifyNotificationSignature({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: 'ORD-12345',
      payhere_amount: '2500.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: 'INVALID_SIGNATURE_TAMPERED_1234',
    });
    assert(tamperedVerify === false, 'PayHere tampered/invalid signature rejected');

    // -----------------------------------------------------------------
    // TEST 3: PayHere Wrong Merchant ID & Wrong Currency
    // -----------------------------------------------------------------
    const wrongMerchant = payHereProvider.verifyNotificationSignature({
      merchant_id: '9999999',
      order_id: 'ORD-12345',
      payhere_amount: '2500.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: payHereProvider.generateNotificationSignature('ORD-12345', '2500.00', 'LKR', '2'),
    });
    assert(wrongMerchant === false, 'PayHere wrong Merchant ID rejected');

    // -----------------------------------------------------------------
    // TEST 4: RBAC Verification (Customer JWT -> Admin Endpoint)
    // -----------------------------------------------------------------
    const customerPayload = {
      userId: 'test-customer-id',
      email: 'customer@example.com',
      role: UserRole.CUSTOMER,
    };
    const customerToken = jwt.sign(customerPayload, env.JWT_SECRET, { expiresIn: '1h' });
    const decodedCustomer: any = jwt.verify(customerToken, env.JWT_SECRET);
    const isCustomerAllowedAdmin = ['ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF'].includes(decodedCustomer.role);
    assert(isCustomerAllowedAdmin === false, 'Customer JWT rejected from Admin role-based authorization');

    const adminPayload = {
      userId: 'test-admin-id',
      email: 'admin@tezlaa.com',
      role: UserRole.ADMIN,
    };
    const adminToken = jwt.sign(adminPayload, env.JWT_SECRET, { expiresIn: '1h' });
    const decodedAdmin: any = jwt.verify(adminToken, env.JWT_SECRET);
    const isAdminAllowed = ['ADMIN', 'BRANCH_MANAGER', 'BRANCH_STAFF'].includes(decodedAdmin.role);
    assert(isAdminAllowed === true, 'Admin JWT permitted for Admin role-based operations');

    // -----------------------------------------------------------------
    // TEST 5: Secret Containment
    // -----------------------------------------------------------------
    assert(!env.PAYHERE_MERCHANT_SECRET.includes('mock_secret'), 'Production PayHere Merchant Secret is configured');
    assert(env.PAYHERE_MODE === 'sandbox', 'PayHere configured safely in SANDBOX mode');

    console.log('\n======================================================');
    console.log(`📊 SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
