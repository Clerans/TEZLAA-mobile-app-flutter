import { z } from 'zod';

export const registerSchema = z.preprocess(
  (val: any) => {
    if (val && typeof val === 'object') {
      if (!val.fullName && val.name) {
        return { ...val, fullName: val.name };
      }
    }
    return val;
  },
  z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().min(9, 'Please enter a valid phone number').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  })
);

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const verifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
