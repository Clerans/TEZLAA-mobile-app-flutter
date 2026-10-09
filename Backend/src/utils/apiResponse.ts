import { Response } from 'express';
import { ApiResponseData } from '../types/index.js';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Request successful',
    statusCode = 200,
    meta?: ApiResponseData<T>['meta']
  ) {
    const payload: ApiResponseData<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta })
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message = 'An error occurred',
    statusCode = 500,
    details?: any,
    code?: string
  ) {
    const payload: ApiResponseData = {
      success: false,
      message,
      error: {
        code,
        details
      }
    };
    return res.status(statusCode).json(payload);
  }
}
