import { Router } from 'express';
import express from 'express';
import paymentController from '../controllers/payment.controller.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';

const router = Router();

// PayHere Server Notification Webhook (Public POST endpoint)
// Supports both application/x-www-form-urlencoded and application/json
router.post(
  '/payhere/notify',
  express.urlencoded({ extended: true }),
  paymentController.handlePayHereNotify.bind(paymentController)
);

// Customer Authenticated Payment Endpoints
router.post(
  '/create-intent',
  authenticateJwt,
  paymentController.createIntent.bind(paymentController)
);

router.get(
  '/order/:orderId/status',
  authenticateJwt,
  paymentController.getPaymentStatus.bind(paymentController)
);

router.post(
  '/order/:orderId/retry',
  authenticateJwt,
  paymentController.retryPayment.bind(paymentController)
);

export default router;
