import { randomInt } from 'node:crypto';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { UserRepository, userRepository } from '../repositories/user.repository.js';
import { emailService } from './email.service.js';
import { User } from '@prisma/client';
import { AuthPayload } from '../types/index.js';

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = userRepository;
  }

  async register(data: RegisterDTO) {
    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) {
      throw ApiError.badRequest('An account with this email already exists');
    }

    if (data.phone) {
      const existingPhone = await this.userRepo.findByPhone(data.phone);
      if (existingPhone) {
        throw ApiError.badRequest('An account with this phone number already exists');
      }
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(data.password, salt);

    // Cryptographically Secure OTP Generation & Hashing
    const otpCode = randomInt(100000, 1000000).toString();
    const otpSalt = await bcryptjs.genSalt(10);
    const hashedOtp = await bcryptjs.hash(otpCode, otpSalt);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await this.userRepo.create({
      email: data.email.toLowerCase(),
      fullName: data.fullName,
      phone: data.phone,
      passwordHash,
      isVerified: false,
      otpCode: `REGISTER$${hashedOtp}`,
      otpExpiresAt,
      otpAttempts: 0,
      otpLastSentAt: new Date(),
    });

    if (env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`🔑 [AUTH OTP DEV PREVIEW] (REGISTER) Code for ${user.email}: ${otpCode}`);
      console.log(`========================================\n`);
    }

    // Asynchronously dispatch real email if SMTP is configured
    emailService.sendOtpEmail(user.email, otpCode).catch((err) => {
      console.error(`Failed to dispatch registration OTP email to ${user.email}:`, err);
    });

    return {
      message: 'Registration successful. A 6-digit verification code has been sent to your email.',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
        isVerified: false,
      },
      requiresVerification: true,
      ...(env.NODE_ENV !== 'production' && { otpCode }), // Gated development-only preview
    };
  }

  async login(data: LoginDTO) {
    const user = await this.userRepo.findByEmail(data.email.toLowerCase());
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcryptjs.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isVerified) {
      throw ApiError.forbidden('Your account is not verified. Please verify your email before logging in.');
    }

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        birthday: user.birthday,
      },
      ...tokens,
    };
  }

  async sendOtp(email: string, purpose: 'REGISTER' | 'RESET_PASSWORD' = 'RESET_PASSWORD') {
    const user = await this.userRepo.findByEmail(email.toLowerCase());
    if (!user) {
      return { message: 'If this email exists, a verification code has been sent.' };
    }

    // Enforce 60-second resend cooldown
    if (user.otpLastSentAt) {
      const elapsedMs = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (elapsedMs < 60000) {
        const remainingSec = Math.ceil((60000 - elapsedMs) / 1000);
        throw ApiError.badRequest(`Please wait ${remainingSec} seconds before requesting a new code.`);
      }
    }

    const otpCode = randomInt(100000, 1000000).toString();
    const otpSalt = await bcryptjs.genSalt(10);
    const hashedOtp = await bcryptjs.hash(otpCode, otpSalt);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.userRepo.update(user.id, {
      otpCode: `${purpose}$${hashedOtp}`,
      otpExpiresAt,
      otpAttempts: 0,
      otpLastSentAt: new Date(),
    });

    if (env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`🔑 [AUTH OTP DEV PREVIEW] (${purpose}) Code for ${email}: ${otpCode}`);
      console.log(`========================================\n`);
    }

    // Asynchronously dispatch real email if SMTP is configured
    emailService.sendOtpEmail(user.email, otpCode).catch((err) => {
      console.error(`Failed to dispatch OTP email to ${user.email}:`, err);
    });

    return {
      message: 'Verification code sent to your email.',
      ...(env.NODE_ENV !== 'production' && { otpCode }), // Gated development preview
    };
  }

  async verifyOtp(email: string, otp: string, purpose: 'REGISTER' | 'RESET_PASSWORD' = 'REGISTER') {
    const user = await this.userRepo.findByEmail(email.toLowerCase());
    if (!user || !user.otpCode) {
      throw ApiError.badRequest('Invalid or expired verification code');
    }

    // Check maximum attempt lockout
    if (user.otpAttempts >= 5) {
      throw ApiError.badRequest('Too many failed verification attempts. Please request a new code.');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw ApiError.badRequest('Verification code has expired. Please request a new one.');
    }

    // Purpose verification
    let tokenHash = user.otpCode;
    const dollarIndex = tokenHash.indexOf('$');
    if (dollarIndex !== -1) {
      const tokenPurpose = tokenHash.substring(0, dollarIndex);
      if (tokenPurpose !== purpose) {
        throw ApiError.badRequest(`This code was not issued for ${purpose.toLowerCase()}. Please request a valid code.`);
      }
      tokenHash = tokenHash.substring(dollarIndex + 1);
    }

    const isMatch = await bcryptjs.compare(otp, tokenHash);
    if (!isMatch) {
      await this.userRepo.update(user.id, {
        otpAttempts: user.otpAttempts + 1,
      });
      throw ApiError.badRequest('Invalid verification code');
    }

    const updatedUser = await this.userRepo.update(user.id, {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    });

    const tokens = this.generateTokens(updatedUser);

    return {
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        branchId: updatedUser.branchId,
        isVerified: true,
      },
      ...tokens,
      message: 'Account verified successfully',
    };
  }

  async resetPassword(data: ResetPasswordDTO) {
    const user = await this.userRepo.findByEmail(data.email.toLowerCase());
    if (!user || !user.otpCode) {
      throw ApiError.badRequest('Invalid or expired verification code');
    }

    if (user.otpAttempts >= 5) {
      throw ApiError.badRequest('Too many failed verification attempts. Please request a new code.');
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw ApiError.badRequest('Verification code has expired');
    }

    let tokenHash = user.otpCode;
    const dollarIndex = tokenHash.indexOf('$');
    if (dollarIndex !== -1) {
      const tokenPurpose = tokenHash.substring(0, dollarIndex);
      if (tokenPurpose !== 'RESET_PASSWORD') {
        throw ApiError.badRequest('This verification code cannot be used for password reset.');
      }
      tokenHash = tokenHash.substring(dollarIndex + 1);
    }

    const isMatch = await bcryptjs.compare(data.otp, tokenHash);
    if (!isMatch) {
      await this.userRepo.update(user.id, {
        otpAttempts: user.otpAttempts + 1,
      });
      throw ApiError.badRequest('Invalid verification code');
    }

    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(data.newPassword, salt);

    await this.userRepo.update(user.id, {
      passwordHash,
      otpCode: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    });

    return { message: 'Password reset successfully. You can now login.' };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw ApiError.unauthorized('No refresh token provided');
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
      const user = await this.userRepo.findById(decoded.userId);

      if (!user) {
        throw ApiError.unauthorized('User not found or session terminated');
      }

      const newTokens = this.generateTokens(user);

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          branchId: user.branchId,
          isVerified: user.isVerified,
        },
        ...newTokens,
      };
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; phone?: string; birthday?: string; avatarUrl?: string }
  ) {
    const updated = await this.userRepo.update(userId, {
      ...(data.fullName && { fullName: data.fullName.trim() }),
      ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
      ...(data.birthday && { birthday: new Date(data.birthday) }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    });

    const { passwordHash, otpCode, otpExpiresAt, ...safeUser } = updated;
    return safeUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw ApiError.badRequest('Current password does not match');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters long');
    }

    const newHashed = await bcryptjs.hash(newPassword, 10);
    await this.userRepo.update(userId, { passwordHash: newHashed });

    return { message: 'Password changed successfully' };
  }

  private generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
export default authService;
