import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';
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

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Authenticated profile routes
router.get('/me', authenticateJwt, authController.getMe);
router.put('/profile', authenticateJwt, authController.updateProfile);
router.patch('/profile', authenticateJwt, authController.updateProfile);
router.post('/change-password', authenticateJwt, authController.changePassword);

export default router;
