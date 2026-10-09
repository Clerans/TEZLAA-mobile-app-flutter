import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import branchRoutes from './branch.routes.js';
import promotionRoutes from './promotion.routes.js';
import orderRoutes from './order.routes.js';
import addressRoutes from './address.routes.js';
import couponRoutes from './coupon.routes.js';
import notificationRoutes from './notification.routes.js';
import loyaltyRoutes from './loyalty.routes.js';
import favouriteRoutes from './favourite.routes.js';
import adminRoutes from './admin.routes.js';
import paymentRoutes from './payment.routes.js';

const apiRouter = Router();

// Modular v1 API Routes
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/branches', branchRoutes);
apiRouter.use('/promotions', promotionRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/addresses', addressRoutes);
apiRouter.use('/coupons', couponRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/loyalty', loyaltyRoutes);
apiRouter.use('/favourites', favouriteRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
