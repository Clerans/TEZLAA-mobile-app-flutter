import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.string().default('5000'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PREFIX: z.string().default('/api/v1'),
    CORS_ORIGIN: z.string().default('*'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().optional(),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

    // PayHere Configuration
    PAYHERE_MERCHANT_ID: z.string().min(1, 'PAYHERE_MERCHANT_ID is required'),
    PAYHERE_MERCHANT_SECRET: z.string().min(1, 'PAYHERE_MERCHANT_SECRET is required'),
    PAYHERE_MODE: z.enum(['sandbox', 'production']).default('sandbox'),
    PAYHERE_NOTIFY_URL: z.string().optional(),

    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    BREVO_API_KEY: z.string().optional(),
    BREVO_SENDER_EMAIL: z.string().optional(),
    BREVO_SENDER_NAME: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().default('"TEZLAA Artisan Café" <cleranspc@gmail.com>'),
    SMS_PROVIDER: z.string().default('mock'),
    SMS_API_KEY: z.string().optional(),
    SMS_SENDER_ID: z.string().default('TEZLAA'),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === 'production') {
        const isDefaultJwt = data.JWT_SECRET === 'super_secret_jwt_key_tezlaa_development_2026';
        const isDefaultRefresh = data.JWT_REFRESH_SECRET === 'super_secret_refresh_jwt_key_tezlaa_development_2026';
        return !isDefaultJwt && !isDefaultRefresh && data.JWT_SECRET.length >= 16 && data.JWT_REFRESH_SECRET.length >= 16;
      }
      return true;
    },
    {
      message: 'In production mode, strong non-default JWT_SECRET and JWT_REFRESH_SECRET (min 16 chars) must be configured.',
    }
  );

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
