import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';

export const getHealth = (req: Request, res: Response) => {
  return ApiResponse.success(
    res,
    {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'TEZLAA Food App Backend API',
      version: '1.0.0',
      uptime: process.uptime(),
    },
    'Server is healthy'
  );
};
