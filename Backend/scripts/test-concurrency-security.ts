import prisma from '../src/config/database.js';
import orderService from '../src/services/order.service.js';
import loyaltyService from '../src/services/loyalty.service.js';
import couponService from '../src/services/coupon.service.js';
import adminService from '../src/services/admin.service.js';
import { UserRole, OrderType, PaymentMethod } from '@prisma/client';

async function runConcurrencyAndSecurityTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING CONCURRENCY, IDEMPOTENCY & SECURITY AUDIT TEST MATRIX');
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
    // 1. Fixtures Setup
    console.log('📦 Setting up test fixtures...');
    const user1 = await prisma.user.create({
      data: {
        email: `concur.user1.${Date.now()}@example.com`,
        fullName: 'Concurrency Tester 1',
        phone: `+9478${Date.now().toString().slice(-7)}`,
        passwordHash: 'hash',
        role: UserRole.CUSTOMER,
      },
    });

    const branchA = await prisma.branch.create({
      data: {
        name: `Branch Alpha ${Date.now()}`,
        slug: `alpha-${Date.now()}`,
        address: '100 Galle Road, Colombo 03',
        phone: '+94112222222',
        openingHours: '08:00 AM - 10:00 PM',
        deliveryRadiusKm: 15.0,
        latitude: 6.9034,
        longitude: 79.8553,
      },
    });

    const branchB = await prisma.branch.create({
      data: {
        name: `Branch Beta ${Date.now()}`,
        slug: `beta-${Date.now()}`,
        address: '200 Kandy Road, Malabe',
        phone: '+94113333333',
        openingHours: '08:00 AM - 10:00 PM',
        deliveryRadiusKm: 15.0,
        latitude: 6.9040,
        longitude: 79.9550,
      },
    });

    const category = await prisma.category.findFirst() ||
      await prisma.category.create({
        data: { name: 'Snacks', slug: `snacks-${Date.now()}` },
      });

    const product = await prisma.product.create({
      data: {
        name: 'Artisan Pastry',
        slug: `pastry-${Date.now()}`,
        description: 'Fresh artisan butter pastry',
        imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04',
        price: 800,
        categoryId: category.id,
      },
    });

    // -----------------------------------------------------------------
    // TEST 1: 10 Concurrent Coupon Redemptions for usageLimit = 1
    // -----------------------------------------------------------------
    console.log('\n--- Test 1: 10 Concurrent Coupon Redemptions (Limit = 1) ---');
    const singleUseCode = `LIMIT1-${Date.now().toString().slice(-4)}`;
    const limitedCoupon = await prisma.coupon.create({
      data: {
        code: singleUseCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderValue: 500,
        usageLimit: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 86400000),
        isActive: true,
      },
    });

    // Create 10 different customer users trying to redeem simultaneously
    const ts = Date.now().toString().slice(-6);
    const concurrentUsers = await Promise.all(
      Array.from({ length: 10 }).map(async (_, i) => {
        const u = await prisma.user.create({
          data: {
            email: `racer.${i}.${Date.now()}@example.com`,
            fullName: `Racer ${i}`,
            phone: `+9470${ts}${i}`,
            passwordHash: 'hash',
            role: UserRole.CUSTOMER,
          },
        });
        await prisma.loyaltyAccount.create({
          data: {
            userId: u.id,
            points: 0,
            lifetimePoints: 0,
          },
        });
        return u;
      })
    );

    await prisma.loyaltyAccount.create({
      data: {
        userId: user1.id,
        points: 0,
        lifetimePoints: 0,
      },
    });

    const orderPromises = concurrentUsers.map((u, idx) =>
      orderService.placeOrder({
        userId: u.id,
        orderType: 'PICKUP',
        branchId: branchA.id,
        couponCode: singleUseCode,
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [{ productId: product.id, quantity: 1 }],
      }).then(() => ({ success: true, user: u.id }))
        .catch((err) => ({ success: false, error: err.message, user: u.id }))
    );

    const results = await Promise.all(orderPromises);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    console.log(`Results: ${successes.length} succeeded, ${failures.length} rejected`);
    assert(successes.length === 1, 'Strictly 1 order succeeded with single-use coupon');
    assert(failures.length === 9, 'Exactly 9 concurrent attempts rejected due to usage limit / active reservation');

    // -----------------------------------------------------------------
    // TEST 2: Race Condition Prevention on Loyalty Point Award
    // -----------------------------------------------------------------
    console.log('\n--- Test 2: Race Condition Prevention on Order Loyalty Point Award ---');
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `TZ-LOYALTY-RACE-${Date.now()}`,
        userId: user1.id,
        branchId: branchA.id,
        orderType: OrderType.PICKUP,
        subtotal: 2000,
        grandTotal: 2000,
        status: 'DELIVERED',
        payments: {
          create: [{
            paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
            amount: 2000,
            status: 'COMPLETED',
          }],
        },
        items: {
          create: [{ productId: product.id, quantity: 2, unitPrice: 1000, totalPrice: 2000 }],
        },
      },
    });

    // Launch 10 simultaneous loyalty awards for the same delivered order
    const awardPromises = Array.from({ length: 10 }).map(() =>
      loyaltyService.awardPointsForOrder(testOrder as any)
    );

    await Promise.all(awardPromises);

    const account = await prisma.loyaltyAccount.findUnique({ where: { userId: user1.id } });
    const awardRecords = await prisma.loyaltyAward.findMany({ where: { orderId: testOrder.id } });

    assert(awardRecords.length === 1, 'Exactly 1 LoyaltyAward record created for the order');
    assert((account?.points || 0) > 0, `Loyalty points awarded strictly once (got: ${account?.points})`);

    // -----------------------------------------------------------------
    // TEST 3: Order Idempotency
    // -----------------------------------------------------------------
    console.log('\n--- Test 3: Order Idempotency Key deduplication ---');
    const uniqueIdempKey = `idemp-key-${Date.now()}`;
    const firstOrder = await orderService.placeOrder({
      userId: user1.id,
      orderType: 'PICKUP',
      branchId: branchA.id,
      paymentMethod: 'CASH_ON_DELIVERY',
      idempotencyKey: uniqueIdempKey,
      items: [{ productId: product.id, quantity: 1 }],
    });

    const secondOrder = await orderService.placeOrder({
      userId: user1.id,
      orderType: 'PICKUP',
      branchId: branchA.id,
      paymentMethod: 'CASH_ON_DELIVERY',
      idempotencyKey: uniqueIdempKey,
      items: [{ productId: product.id, quantity: 1 }],
    });

    assert(firstOrder.id === secondOrder.id, 'Duplicate request returned existing order without creating a new one');
    assert(firstOrder.orderNumber === secondOrder.orderNumber, 'Order numbers match identical order record');

    const totalWithKey = await prisma.order.count({ where: { idempotencyKey: uniqueIdempKey } });
    assert(totalWithKey === 1, 'Only 1 record exists in DB for this idempotencyKey');

    // -----------------------------------------------------------------
    // TEST 4: Branch Isolation Authorization
    // -----------------------------------------------------------------
    console.log('\n--- Test 4: Branch Isolation Authorization ---');
    const orderInBranchB = await prisma.order.create({
      data: {
        orderNumber: `TZ-BRANCH-B-${Date.now()}`,
        userId: user1.id,
        branchId: branchB.id,
        orderType: OrderType.PICKUP,
        subtotal: 1000,
        grandTotal: 1000,
        status: 'PENDING',
        payments: {
          create: [{
            paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
            amount: 1000,
            status: 'PENDING',
          }],
        },
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: 1000, totalPrice: 1000 }],
        },
      },
    });

    let crossBranchUpdateBlocked = false;
    try {
      await orderService.updateOrderStatus(
        orderInBranchB.id,
        'PREPARING',
        UserRole.BRANCH_MANAGER,
        branchA.id // Manager of Branch A trying to update Branch B's order
      );
    } catch (err: any) {
      crossBranchUpdateBlocked = true;
      assert(err.message.includes('permission') || err.message.includes('assigned branch'), 'Forbidden cross-branch modification rejected');
    }
    assert(crossBranchUpdateBlocked === true, 'Cross-branch access control successfully enforced');

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await prisma.loyaltyAward.deleteMany({ where: { orderId: testOrder.id } });
    await prisma.couponReservation.deleteMany({ where: { couponId: limitedCoupon.id } });
    await prisma.orderItem.deleteMany({ where: { order: { branchId: { in: [branchA.id, branchB.id] } } } });
    await prisma.order.deleteMany({ where: { branchId: { in: [branchA.id, branchB.id] } } });
    await prisma.coupon.delete({ where: { id: limitedCoupon.id } });
    await prisma.loyaltyTransaction.deleteMany({ where: { loyaltyAccount: { userId: user1.id } } });
    await prisma.loyaltyAccount.deleteMany({ where: { userId: user1.id } });
    await prisma.user.deleteMany({ where: { id: { in: [user1.id, ...concurrentUsers.map(u => u.id)] } } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.branch.deleteMany({ where: { id: { in: [branchA.id, branchB.id] } } });

    console.log('\n======================================================');
    console.log(`📊 CONCURRENCY & SECURITY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('Fatal error in concurrency/security tests:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }
}

runConcurrencyAndSecurityTests();
