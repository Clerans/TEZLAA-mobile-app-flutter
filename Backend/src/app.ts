import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/apiError.js';

import prisma from './config/database.js';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server webhooks)
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGIN === '*' || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new ApiError(403, `CORS origin '${origin}' not permitted`));
      },
      credentials: true,
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });
  app.use(limiter);

  // Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Root Welcome Route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'TEZLAA Food & Artisan Café API',
      version: '1.0.0',
      status: 'Online',
      docs: `${env.API_PREFIX}/health`,
    });
  });

  // Comprehensive Health Probe (Application + Database)
  app.get('/health', async (req: Request, res: Response) => {
    let dbStatus = 'HEALTHY';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'UNAVAILABLE';
    }

    const isHealthy = dbStatus === 'HEALTHY';
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'UP' : 'DEGRADED',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      service: 'TEZLAA Food App Backend API',
      version: '1.0.0',
      uptime: process.uptime(),
    });
  });

  // Mount API Router
  app.use(env.API_PREFIX, apiRouter);

  // 404 Route Handler
  app.use((req: Request, res: Response, next) => {
    next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
