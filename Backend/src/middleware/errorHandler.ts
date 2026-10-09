import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.details);
  }

  // Handle Prisma Known Request Errors if any
  if ('code' in err && typeof (err as any).code === 'string' && (err as any).code.startsWith('P')) {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return ApiResponse.error(
        res,
        'A unique constraint was violated. Duplicate record exists.',
        409,
        prismaError.meta
      );
    }
  }

  console.error('Unhandled Error:', err);

  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  const details = env.NODE_ENV === 'development' ? err.stack : undefined;

  return ApiResponse.error(res, message, 500, details);
};
