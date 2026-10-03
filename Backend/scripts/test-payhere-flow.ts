import { payHereProvider } from '../src/services/payhere.provider.js';
import { env } from '../src/config/env.js';
import { paymentService } from '../src/services/payment.service.js';
import { couponService } from '../src/services/coupon.service.js';
import { loyaltyService } from '../src/services/loyalty.service.js';
import prisma from '../src/config/database.js';
import { UserRole, OrderStatus, OrderType, PaymentMethod, PaymentStatus, ReservationStatus } from '@prisma/client';

async function runPayHereLifecycleTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING PRODUCTION PAYHERE LIFECYCLE & WEBHOOK INTEGRATION TEST');
  console.log('================================================================\n');

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
    // 1. Setup Test User, Branch, Product, Category, Address, Coupon, Reward
    console.log('📦 Setting up test fixtures in DB...');
    const testEmail = `payhere.tester.${Date.now()}@example.com`;
    const testPhone = `+9477${Date.now().toString().slice(-7)}`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        fullName: 'PayHere Test Customer',
        phone: testPhone,
        passwordHash: 'hashedpassword',
        role: UserRole.CUSTOMER,
      },
    });

    const branch = await prisma.branch.findFirst({ where: { isActive: true } }) ||
      await prisma.branch.create({
        data: {
          name: 'Flagship Test Branch',
          slug: `flagship-${Date.now()}`,
          address: 'No 1, Galle Road, Colombo',
          phone: '+94112345678',
          deliveryRadiusKm: 25.0,
          latitude: 6.9271,
          longitude: 79.8612,
          openingHours: '08:00 AM - 10:00 PM Daily',
        },
      });

    const category = await prisma.category.findFirst() ||
      await prisma.category.create({
        data: {
          name: 'Beverages',
          slug: `beverages-${Date.now()}`,
        },
      });

    const product = await prisma.product.create({
      data: {
        name: 'Artisan Espresso',
        slug: `espresso-${Date.now()}`,
        description: 'Rich artisan espresso brew',
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04',
        price: 1500,
        categoryId: category.id,
      },
    });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: 'Home',
        addressLine1: '45/2 Flower Road',
        city: 'Colombo 07',
        latitude: 6.9150,
        longitude: 79.8630,
      },
    });

    // Create a limited test coupon
    const couponCode = `PAYHERE${Date.now().toString().slice(-4)}`;
    const coupon = await prisma.coupon.create({
      data: {
        code: couponCode,
        discountType: 'FIXED_AMOUNT',
        discountValue: 200,
        minOrderValue: 500,
        usageLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      },
    });

    // Create test reward and loyalty account
    const reward = await prisma.reward.create({
      data: {
        title: 'LKR 100 Coffee Voucher',
        description: 'Voucher reward',
        rewardType: 'DISCOUNT_VOUCHER',
        pointsRequired: 50,
        discountValue: 100,
      },
    });

    const loyaltyAccount = await prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        points: 200,
        lifetimePoints: 200,
      },
    });

    // -----------------------------------------------------------------
    // TEST 1: Checkout Preparation & Real Customer Profile Validation
    // -----------------------------------------------------------------
    console.log('\n--- Test 1: Checkout Preparation & Real Customer Validation ---');
    const order1 = await prisma.order.create({
      data: {
        orderNumber: `TZ-PH-${Date.now()}`,
        userId: user.id,
        branchId: branch.id,
        addressId: address.id,
        orderType: OrderType.DELIVERY,
        subtotal: 1500,
        deliveryFee: 250,
        discount: 200,
        grandTotal: 1550,
        status: OrderStatus.PENDING,
        payments: {
          create: [{
            paymentMethod: PaymentMethod.CARD,
            amount: 1550,
            status: PaymentStatus.PENDING,
          }],
        },
        items: {
          create: [{
            productId: product.id,
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500,
          }],
        },
      },
    });

    // Reserve coupon for this order
    const couponRes = await couponService.reserveCoupon(user.id, order1.id, coupon.id, coupon.code);
    assert(couponRes.status === ReservationStatus.RESERVED, 'Coupon reserved successfully for pending order');

    const checkoutData = await paymentService.preparePayHereCheckout(order1.id, user.id);
    assert(checkoutData.first_name === 'PayHere', 'Parsed first name from user profile (PayHere)');
    assert(checkoutData.last_name === 'Test Customer', 'Parsed last name from user profile');
    assert(checkoutData.email === testEmail, 'Email matches customer real email');
    assert(checkoutData.phone === testPhone, 'Phone matches customer real phone');
    assert(checkoutData.amount === '1550.00', 'Formatted amount matches order grandTotal');
    assert(checkoutData.hash.length === 32, 'Valid 32-char MD5 checkout hash generated');

    // -----------------------------------------------------------------
    // TEST 2: PayHere Webhook Signature Verification
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Webhook Signature Verification ---');
    const validNotificationSig = payHereProvider.generateNotificationSignature(
      order1.orderNumber,
      '1550.00',
      'LKR',
      '2'
    );

    const isSigValid = payHereProvider.verifyNotificationSignature({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: order1.orderNumber,
      payment_id: `PH-TEST-PAY-${Date.now()}`,
      payhere_amount: '1550.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: validNotificationSig,
    });
    assert(isSigValid === true, 'Provider verified valid notification signature');

    const isTamperedRejected = payHereProvider.verifyNotificationSignature({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: order1.orderNumber,
      payment_id: `PH-TEST-PAY-${Date.now()}`,
      payhere_amount: '1550.00',
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: 'FORGED_SIGNATURE_HASH_XYZ',
    });
    assert(isTamperedRejected === false, 'Tampered MD5 signature rejected');

    // -----------------------------------------------------------------
    // TEST 3: Successful Payment Webhook (status_code: 2) & Commit
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Webhook Execution (status_code: 2) ---');
    const webhookResult = await paymentService.handlePayHereWebhook({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: order1.orderNumber,
      payment_id: `PH-PAY-${Date.now()}`,
      payhere_amount: '1550.00',
      payhere_currency: 'LKR',
      status_code: '2',
      status_message: 'Successfully completed payment',
      method: 'VISA',
      card_holder_name: 'Test Customer',
      card_no: '************1234',
      md5sig: validNotificationSig,
    });

    assert(webhookResult.success === true, 'Webhook returned success: true');
    assert(webhookResult.status === 'COMPLETED', 'Webhook processed status: COMPLETED');

    const updatedOrder = await prisma.order.findUnique({ where: { id: order1.id } });
    assert(updatedOrder?.status === OrderStatus.CONFIRMED, 'Order transitioned to CONFIRMED on payment success');

    const updatedPayment = await prisma.payment.findFirst({ where: { orderId: order1.id } });
    assert(updatedPayment?.status === PaymentStatus.COMPLETED, 'Payment marked COMPLETED in database');

    const updatedReservation = await prisma.couponReservation.findUnique({ where: { orderId: order1.id } });
    assert(updatedReservation?.status === ReservationStatus.CONSUMED, 'Coupon reservation transitioned to CONSUMED');

    // -----------------------------------------------------------------
    // TEST 4: Idempotent Re-delivery of Successful Webhook
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Idempotent Webhook Re-delivery ---');
    const duplicateResult = await paymentService.handlePayHereWebhook({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: order1.orderNumber,
      payment_id: `PH-PAY-${Date.now()}`,
      payhere_amount: '1550.00',
      payhere_currency: 'LKR',
      status_code: '2',
      status_message: 'Duplicate delivery',
      method: 'VISA',
      md5sig: validNotificationSig,
    });

    assert(duplicateResult.success === true, 'Duplicate webhook handled idempotently');
    assert(duplicateResult.duplicate === true, 'Identified as duplicate without state corruption');

    // -----------------------------------------------------------------
    // TEST 5: Amount Mismatch Protection
    // -----------------------------------------------------------------
    console.log('\n--- Test 5: Amount Mismatch Protection ---');
    const order2 = await prisma.order.create({
      data: {
        orderNumber: `TZ-PH-MISMATCH-${Date.now()}`,
        userId: user.id,
        branchId: branch.id,
        orderType: OrderType.PICKUP,
        subtotal: 3000,
        grandTotal: 3000,
        status: OrderStatus.PENDING,
        payments: {
          create: [{
            paymentMethod: PaymentMethod.CARD,
            amount: 3000,
            status: PaymentStatus.PENDING,
          }],
        },
        items: {
          create: [{ productId: product.id, quantity: 2, unitPrice: 1500, totalPrice: 3000 }],
        },
      },
    });

    let mismatchCaught = false;
    try {
      const forgedSig = payHereProvider.generateNotificationSignature(
        order2.orderNumber,
        '100.00', // Underpaid amount
        'LKR',
        '2'
      );
      await paymentService.handlePayHereWebhook({
        merchant_id: env.PAYHERE_MERCHANT_ID,
        order_id: order2.orderNumber,
        payment_id: `PH-PAY-TAMPER-${Date.now()}`,
        payhere_amount: '100.00',
        payhere_currency: 'LKR',
        status_code: '2',
        md5sig: forgedSig,
      });
    } catch (err: any) {
      mismatchCaught = true;
      assert(err.message.toLowerCase().includes('amount mismatch'), 'Rejected underpaid/mismatched payment amount');
    }
    assert(mismatchCaught === true, 'Amount tampering threw bad request error');

    // -----------------------------------------------------------------
    // TEST 6: Payment Cancellation/Failure Webhook (status_code: -1) & Release
    // -----------------------------------------------------------------
    console.log('\n--- Test 6: Payment Cancellation Webhook & Release ---');
    const order3 = await prisma.order.create({
      data: {
        orderNumber: `TZ-PH-CANCEL-${Date.now()}`,
        userId: user.id,
        branchId: branch.id,
        orderType: OrderType.PICKUP,
        subtotal: 1500,
        grandTotal: 1500,
        status: OrderStatus.PENDING,
        payments: {
          create: [{
            paymentMethod: PaymentMethod.CARD,
            amount: 1500,
            status: PaymentStatus.PENDING,
          }],
        },
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: 1500, totalPrice: 1500 }],
        },
      },
    });

    const rewardRes = await loyaltyService.reserveReward(user.id, order3.id, reward.id, reward.pointsRequired);
    assert(rewardRes.status === ReservationStatus.RESERVED, 'Reward reserved for order 3');

    const cancelSig = payHereProvider.generateNotificationSignature(
      order3.orderNumber,
      '1500.00',
      'LKR',
      '-1'
    );

    const cancelWebhookResult = await paymentService.handlePayHereWebhook({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: order3.orderNumber,
      payment_id: `PH-PAY-CANCEL-${Date.now()}`,
      payhere_amount: '1500.00',
      payhere_currency: 'LKR',
      status_code: '-1',
      status_message: 'User cancelled payment on gateway',
      md5sig: cancelSig,
    });

    assert(cancelWebhookResult.status === 'CANCELLED', 'Webhook processed status: CANCELLED');

    const cancelledOrder = await prisma.order.findUnique({ where: { id: order3.id } });
    assert(cancelledOrder?.status === OrderStatus.CANCELLED, 'Order status marked CANCELLED');

    const updatedRewardRes = await prisma.loyaltyReservation.findUnique({ where: { orderId: order3.id } });
    assert(updatedRewardRes?.status === ReservationStatus.RELEASED, 'Reward reservation status marked RELEASED');

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await prisma.couponReservation.deleteMany({ where: { userId: user.id } });
    await prisma.loyaltyReservation.deleteMany({ where: { userId: user.id } });
    await prisma.payment.deleteMany({ where: { order: { userId: user.id } } });
    await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
    await prisma.order.deleteMany({ where: { userId: user.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.reward.delete({ where: { id: reward.id } });
    await prisma.loyaltyAccount.deleteMany({ where: { userId: user.id } });
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.user.delete({ where: { id: user.id } });

    console.log('\n======================================================');
    console.log(`📊 PAYHERE TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Fatal error in PayHere lifecycle tests:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }
}

runPayHereLifecycleTests();
