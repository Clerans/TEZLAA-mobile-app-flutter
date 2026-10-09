import { jest } from '@jest/globals';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';
import bcryptjs from 'bcryptjs';

describe('Auth & OTP Purpose Isolation Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Registration: creates unverified user with REGISTER purpose and no login tokens', async () => {
    const mockUser = {
      id: 'usr-1',
      email: 'customer@test.com',
      fullName: 'Customer Test',
      phone: '0771234567',
      role: 'CUSTOMER',
      isVerified: false,
      otpCode: 'REGISTER$some_hash',
      otpAttempts: 0,
      otpExpiresAt: new Date(Date.now() + 600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
    jest.spyOn(userRepository, 'findByPhone').mockResolvedValue(null);
    jest.spyOn(userRepository, 'create').mockResolvedValue(mockUser as any);

    const res = await authService.register({
      email: 'customer@test.com',
      password: 'Password123!',
      fullName: 'Customer Test',
      phone: '0771234567',
    });

    expect(res.requiresVerification).toBe(true);
    expect(res.user.isVerified).toBe(false);
    expect((res as any).accessToken).toBeUndefined();
  });

  it('Login: rejects unverified accounts with 403 Forbidden', async () => {
    const passwordHash = await bcryptjs.hash('Password123!', 10);
    const mockUnverifiedUser = {
      id: 'usr-2',
      email: 'unverified@test.com',
      passwordHash,
      isVerified: false,
    };

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUnverifiedUser as any);

    await expect(
      authService.login({
        email: 'unverified@test.com',
        password: 'Password123!',
      })
    ).rejects.toThrow('Your account is not verified. Please verify your email before logging in.');
  });

  it('OTP Isolation: rejects registration verification if code was issued for RESET_PASSWORD', async () => {
    const rawOtp = '123456';
    const otpHash = await bcryptjs.hash(rawOtp, 10);
    const mockUser = {
      id: 'usr-3',
      email: 'cross@test.com',
      isVerified: false,
      otpCode: `RESET_PASSWORD$${otpHash}`,
      otpExpiresAt: new Date(Date.now() + 600000),
      otpAttempts: 0,
    };

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as any);

    await expect(
      authService.verifyOtp('cross@test.com', rawOtp, 'REGISTER')
    ).rejects.toThrow('This code was not issued for register. Please request a valid code.');
  });

  it('OTP Isolation: rejects password reset if code was issued for REGISTER', async () => {
    const rawOtp = '654321';
    const otpHash = await bcryptjs.hash(rawOtp, 10);
    const mockUser = {
      id: 'usr-4',
      email: 'reg@test.com',
      isVerified: false,
      otpCode: `REGISTER$${otpHash}`,
      otpExpiresAt: new Date(Date.now() + 600000),
      otpAttempts: 0,
    };

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as any);

    await expect(
      authService.resetPassword({
        email: 'reg@test.com',
        otp: rawOtp,
        newPassword: 'NewPassword123!',
      })
    ).rejects.toThrow('This verification code cannot be used for password reset.');
  });

  it('OTP Verification: marks user verified and returns tokens on matching REGISTER purpose', async () => {
    const rawOtp = '987654';
    const otpHash = await bcryptjs.hash(rawOtp, 10);
    const mockUser = {
      id: 'usr-5',
      email: 'valid@test.com',
      fullName: 'Valid User',
      role: 'CUSTOMER',
      isVerified: false,
      otpCode: `REGISTER$${otpHash}`,
      otpExpiresAt: new Date(Date.now() + 600000),
      otpAttempts: 0,
    };

    const updatedUser = {
      ...mockUser,
      isVerified: true,
      otpCode: null,
    };

    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser as any);
    jest.spyOn(userRepository, 'update').mockResolvedValue(updatedUser as any);

    const res = await authService.verifyOtp('valid@test.com', rawOtp, 'REGISTER');

    expect(res.user.isVerified).toBe(true);
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
  });
});
