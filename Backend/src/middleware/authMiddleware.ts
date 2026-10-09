import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest, AuthPayload } from '../types/index.js';
import prisma from '../config/database.js';

export const authenticateJwt = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No authorization token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

    // Verify user still exists in the database (e.g. after DB switch/reset)
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, branchId: true },
    });

    if (!dbUser) {
      return next(ApiError.unauthorized('User session expired or account not found. Please log in again.'));
    }

    req.user = {
      ...decoded,
      role: dbUser.role,
      branchId: dbUser.branchId || undefined,
    };
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Invalid or expired authentication token'));
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }

    next();
  };
};

export const requireBranchAccess = (branchIdGetter?: (req: AuthenticatedRequest) => string | undefined) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Master ADMIN has access across all branches
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Branch managers & staff must have a valid branch assignment
    if (req.user.role === 'BRANCH_MANAGER' || req.user.role === 'BRANCH_STAFF') {
      const targetBranchId = branchIdGetter ? branchIdGetter(req) : (req.params.branchId || req.body.branchId || req.query.branchId);
      
      if (!req.user.branchId) {
        return next(ApiError.forbidden('You are not assigned to any TEZLAA branch'));
      }

      if (targetBranchId && req.user.branchId !== targetBranchId) {
        return next(ApiError.forbidden('You do not have access to perform actions on this branch'));
      }

      return next();
    }

    return next(ApiError.forbidden('Unauthorized branch operation'));
  };
};
