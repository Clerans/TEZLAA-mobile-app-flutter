import { Response, NextFunction } from 'express';
import paymentService from '../services/payment.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class PaymentController {
  /**
   * Generates signed PayHere checkout parameters for an order
   * POST /api/v1/payments/create-intent
   */
  async createIntent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw ApiError.unauthorized('Please sign in to make a payment');
      }

      if (!orderId) {
        return res.status(400).json({
          status: 'error',
          message: 'Order ID is required to prepare payment',
        });
      }

      const checkoutPayload = await paymentService.preparePayHereCheckout(orderId, userId);

      return ApiResponse.success(res, checkoutPayload, 'PayHere checkout intent created');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public PayHere Server-to-Server Webhook Handler
   * POST /api/v1/payments/payhere/notify
   */
  async handlePayHereNotify(req: any, res: Response, next: NextFunction) {
    try {
      // PayHere sends form-urlencoded or JSON data in POST body
      const payload = req.body;

      const result = await paymentService.handlePayHereWebhook(payload);

      // Return HTTP 200 OK so PayHere knows notification was successfully received
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[PaymentController] PayHere Notify Error:', err.message);
      // Return 400 with error details so PayHere knows it failed
      return res.status(err.statusCode || 400).json({
        status: 'error',
        message: err.message || 'Payment notification processing failed',
      });
    }
  }

  /**
   * Get payment & order status
   * GET /api/v1/payments/order/:orderId/status
   */
  async getPaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw ApiError.unauthorized('Unauthorized');
      }

      const status = await paymentService.getPaymentStatus(orderId, userId);

      return ApiResponse.success(res, status, 'Payment status retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retry Payment for an existing pending/failed order
   * POST /api/v1/payments/order/:orderId/retry
   */
  async retryPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw ApiError.unauthorized('Unauthorized');
      }

      const checkoutPayload = await paymentService.preparePayHereCheckout(orderId, userId);

      return ApiResponse.success(res, checkoutPayload, 'PayHere checkout intent regenerated');
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
export default paymentController;
