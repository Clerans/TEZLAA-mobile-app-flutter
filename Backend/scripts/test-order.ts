declare const process: any;
import { orderService } from '../src/services/order.service.js';
import prisma from '../src/config/database.js';

async function test() {
  const user = await prisma.user.findFirst({ where: { email: 'customer@tezlaa.com' } });
  const product = await prisma.product.findFirst();
  const branch = await prisma.branch.findFirst();
  console.log('User:', user?.id, 'Product:', product?.id, 'Branch:', branch?.id);
  try {
    const order = await orderService.placeOrder({
      userId: user!.id,
      orderType: 'DELIVERY' as any,
      branchId: branch!.id,
      paymentMethod: 'CASH_ON_DELIVERY' as any,
      items: [{ productId: product!.id, quantity: 1 }]
    });
    console.log('ORDER SUCCESS:', order.orderNumber, order.id);
  } catch (e: any) {
    console.error('ORDER ERROR:', e.message, e.stack);
  } finally {
    await prisma.$disconnect();
  }
}
test();
