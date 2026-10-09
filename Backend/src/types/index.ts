import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export interface ApiResponseData<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code?: string;
    details?: any;
  };
}
