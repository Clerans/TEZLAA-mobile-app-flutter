import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resendOtpSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Dedicated Brute-force & Anti-abuse Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests or verification attempts. Please wait 15 minutes.',
  },
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Authenticated profile routes
router.get('/me', authenticateJwt, authController.getMe);
router.put('/profile', authenticateJwt, authController.updateProfile);
router.patch('/profile', authenticateJwt, authController.updateProfile);
router.post('/change-password', authenticateJwt, authController.changePassword);

export default router;
