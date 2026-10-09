import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/index.js';
import { userRepository } from '../repositories/user.repository.js';
import { ApiError } from '../utils/apiError.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  return ApiResponse.created(res, result, 'Registration successful. Verification code sent.');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  return ApiResponse.success(res, result, 'Login successful');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.sendOtp(req.body.email, 'RESET_PASSWORD');
  return ApiResponse.success(res, result, 'If the account exists, a reset code was sent.');
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.sendOtp(req.body.email, req.body.purpose || 'REGISTER');
  return ApiResponse.success(res, result, 'Verification code sent successfully');
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.verifyOtp(req.body.email, req.body.otp, req.body.purpose || 'REGISTER');
  return ApiResponse.success(res, result, 'Account verified successfully');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);
  return ApiResponse.success(res, result, 'Password reset successfully');
});

export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await userRepository.findById(req.user.userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { passwordHash, otpCode, otpExpiresAt, ...safeUser } = user;
  return ApiResponse.success(res, safeUser, 'Profile retrieved successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const result = await authService.refreshToken(token);
  return ApiResponse.success(res, result, 'Token refreshed successfully');
});

export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    throw ApiError.unauthorized();
  }

  const payload = {
    ...req.body,
    fullName: req.body.fullName || req.body.name,
  };

  const updatedUser = await authService.updateProfile(req.user.userId, payload);
  return ApiResponse.success(res, updatedUser, 'Profile updated successfully');
});

export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    throw ApiError.unauthorized();
  }

  const { currentPassword, newPassword, password } = req.body;
  const targetPassword = newPassword || password;

  if (!currentPassword || !targetPassword) {
    throw ApiError.badRequest('Current password and new password are required');
  }

  const result = await authService.changePassword(req.user.userId, currentPassword, targetPassword);
  return ApiResponse.success(res, result, 'Password changed successfully');
});
