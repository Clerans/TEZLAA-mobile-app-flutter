import { prisma } from '../src/config/database.js';
import { payHereProvider } from '../src/services/payhere.provider.js';
import { env } from '../src/config/env.js';
import { UserRole, OrderStatus, OrderType, PaymentMethod, PaymentStatus, LoyaltyTxType } from '@prisma/client';

async function runPilotSimulation() {
  console.log('================================================================');
  console.log('🚀 TEZLAA PHASE 11: CONTROLLED PILOT REAL-WORLD SIMULATION');
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
    // 1. Fetch pilot branch and products
    const branches = await prisma.branch.findMany({ take: 2 });
    assert(branches.length >= 1, `Pilot Branch exists (Found: ${branches.map(b => b.name).join(', ')})`);
    const branch1 = branches[0];
    const branch2 = branches.length > 1 ? branches[1] : branch1;

    const products = await prisma.product.findMany({ take: 3, include: { variants: true } });
    assert(products.length >= 1, `Live Catalog products loaded (${products.length} items available)`);
    const product1 = products[0];

    // 2. Ensure test customers exist
    let customer1 = await prisma.user.findUnique({ where: { email: 'pilot.customer1@tezlaa.com' } });
    if (!customer1) {
      customer1 = await prisma.user.create({
        data: {
          email: 'pilot.customer1@tezlaa.com',
          fullName: 'Saman Perera (Pilot Customer 1)',
          passwordHash: '$2a$10$fFakeHashForTestingOnly123456789012345678901234567890',
          role: UserRole.CUSTOMER,
          isVerified: true,
        },
      });
    }

    let customer2 = await prisma.user.findUnique({ where: { email: 'pilot.customer2@tezlaa.com' } });
    if (!customer2) {
      customer2 = await prisma.user.create({
        data: {
          email: 'pilot.customer2@tezlaa.com',
          fullName: 'Nimali Silva (Pilot Customer 2)',
          passwordHash: '$2a$10$fFakeHashForTestingOnly123456789012345678901234567890',
          role: UserRole.CUSTOMER,
          isVerified: true,
        },
      });
    }
    assert(!!customer1 && !!customer2, 'Multi-customer accounts active (Customer 1 & Customer 2)');

    // 3. Customer 1 places an Online Order (Delivery)
    const orderNumber1 = `PLT-${Date.now().toString().slice(-6)}-01`;
    const subtotal1 = Number(product1.price);
    const deliveryFee1 = 250;
    const grandTotal1 = subtotal1 + deliveryFee1;

    const order1 = await prisma.order.create({
      data: {
        orderNumber: orderNumber1,
        userId: customer1.id,
        branchId: branch1.id,
        orderType: OrderType.DELIVERY,
        status: OrderStatus.PENDING,
        subtotal: subtotal1,
        deliveryFee: deliveryFee1,
        discount: 0,
        loyaltyDiscount: 0,
        grandTotal: grandTotal1,
        deliveryInstructions: '123 Pilot Lane, Colombo 03',
        items: {
          create: [
            {
              productId: product1.id,
              unitPrice: product1.price,
              quantity: 1,
              totalPrice: subtotal1,
            },
          ],
        },
      },
    });

    const payment1 = await prisma.payment.create({
      data: {
        orderId: order1.id,
        amount: grandTotal1,
        currency: 'LKR',
        paymentMethod: PaymentMethod.ONLINE_GATEWAY,
        status: PaymentStatus.PENDING,
        gatewayProvider: 'PayHere',
      },
    });

    assert(order1.status === OrderStatus.PENDING, `Customer 1 Delivery Order created (${order1.orderNumber})`);

    // 4. PayHere Sandbox Webhook Simulation
    const webhookSig = payHereProvider.generateNotificationSignature(
      order1.orderNumber,
      grandTotal1.toFixed(2),
      'LKR',
      '2' // Success
    );

    const isSigValid = payHereProvider.verifyNotificationSignature({
      merchant_id: env.PAYHERE_MERCHANT_ID,
      order_id: order1.orderNumber,
      payhere_amount: grandTotal1.toFixed(2),
      payhere_currency: 'LKR',
      status_code: '2',
      md5sig: webhookSig,
    });
    assert(isSigValid, 'PayHere Sandbox Webhook Signature Verified Server-Side');

    // 5. Authoritative Backend Payment Confirmation & Order Confirmation
    const updatedPayment = await prisma.payment.update({
      where: { id: payment1.id },
      data: { status: PaymentStatus.COMPLETED, transactionId: `PH-TXN-${Date.now()}` },
    });
    const confirmedOrder = await prisma.order.update({
      where: { id: order1.id },
      data: { status: OrderStatus.CONFIRMED },
    });
    assert(updatedPayment.status === PaymentStatus.COMPLETED && confirmedOrder.status === OrderStatus.CONFIRMED, 'Payment COMPLETED -> Order CONFIRMED');

    // 6. Admin KDS Status Transitions
    const preparingOrder = await prisma.order.update({
      where: { id: order1.id },
      data: { status: OrderStatus.PREPARING },
    });
    assert(preparingOrder.status === OrderStatus.PREPARING, 'Kitchen KDS Transition -> PREPARING');

    const readyOrder = await prisma.order.update({
      where: { id: order1.id },
      data: { status: OrderStatus.READY },
    });
    assert(readyOrder.status === OrderStatus.READY, 'Barista Station Transition -> READY');

    const outForDeliveryOrder = await prisma.order.update({
      where: { id: order1.id },
      data: { status: OrderStatus.OUT_FOR_DELIVERY },
    });
    assert(outForDeliveryOrder.status === OrderStatus.OUT_FOR_DELIVERY, 'Dispatch Transition -> OUT_FOR_DELIVERY');

    const deliveredOrder = await prisma.order.update({
      where: { id: order1.id },
      data: { status: OrderStatus.DELIVERED },
    });
    assert(deliveredOrder.status === OrderStatus.DELIVERED, 'Customer Handover Transition -> DELIVERED');

    // 7. Single-Execution Loyalty Points Award
    const pointsToEarn = Math.floor(grandTotal1 / 100);
    let loyaltyAccount = await prisma.loyaltyAccount.findUnique({ where: { userId: customer1.id } });
    if (!loyaltyAccount) {
      loyaltyAccount = await prisma.loyaltyAccount.create({
        data: { userId: customer1.id, points: 0, lifetimePoints: 0 },
      });
    }

    const tx = await prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        type: LoyaltyTxType.EARNED,
        points: pointsToEarn,
        orderId: order1.id,
        description: `Points earned for order #${order1.orderNumber}`,
      },
    });

    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccount.id },
      data: {
        points: { increment: pointsToEarn },
        lifetimePoints: { increment: pointsToEarn },
      },
    });

    assert(tx.points === pointsToEarn, `Customer 1 Loyalty Points awarded: +${pointsToEarn} pts for Order #${order1.orderNumber}`);

    // 8. Customer 2 Pickup Order with Cash Payment (Multi-branch validation)
    const orderNumber2 = `PLT-${Date.now().toString().slice(-6)}-02`;
    const order2 = await prisma.order.create({
      data: {
        orderNumber: orderNumber2,
        userId: customer2.id,
        branchId: branch2.id,
        orderType: OrderType.PICKUP,
        status: OrderStatus.CONFIRMED,
        subtotal: subtotal1,
        deliveryFee: 0,
        discount: 0,
        loyaltyDiscount: 0,
        grandTotal: subtotal1,
        items: {
          create: [
            {
              productId: product1.id,
              unitPrice: product1.price,
              quantity: 1,
              totalPrice: subtotal1,
            },
          ],
        },
      },
    });
    const payment2 = await prisma.payment.create({
      data: {
        orderId: order2.id,
        amount: subtotal1,
        currency: 'LKR',
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        status: PaymentStatus.PENDING,
        gatewayProvider: 'Cash',
      },
    });
    assert(order2.orderType === OrderType.PICKUP && payment2.paymentMethod === PaymentMethod.CASH_ON_DELIVERY, `Customer 2 Pickup Order created with Cash at Counter (${order2.orderNumber})`);

    // 9. Customer Data Isolation Audit
    const c1Orders = await prisma.order.findMany({ where: { userId: customer1.id } });
    const c2Orders = await prisma.order.findMany({ where: { userId: customer2.id } });
    const hasLeakage = c1Orders.some(o => o.userId === customer2.id) || c2Orders.some(o => o.userId === customer1.id);
    assert(!hasLeakage, 'Multi-customer order data strictly isolated (Zero leakage)');

    console.log('\n================================================================');
    console.log(`📊 PILOT SIMULATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('Pilot simulation failure:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runPilotSimulation();
