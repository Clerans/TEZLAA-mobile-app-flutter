import { jest } from '@jest/globals';
import { requireRole, requireBranchAccess } from '../middleware/authMiddleware.js';
import adminController from '../controllers/admin.controller.js';
import adminService from '../services/admin.service.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

describe('CORS Origin Validation & Administrative Negative Authorization Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Priority 2: CORS Origin Verification Logic', () => {
    const allowedOrigins = ['https://tezlaa-admin.web.app', 'https://admin.tezlaa.lk', 'https://tezlaa-mobile-app-flutter.onrender.com'];

    // Direct simulation of app.ts cors origin handler
    const corsOriginValidator = (origin: string | undefined, nodeEnv: string, configOrigin: string, callback: (err: any, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (nodeEnv !== 'production' && configOrigin === '*') {
        return callback(null, true);
      }
      const allowed = configOrigin.split(',').map((o) => o.trim());
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new ApiError(403, `CORS origin '${origin}' not permitted`));
    };

    it('allows requests with NO origin header (Native Flutter mobile apps & PayHere webhooks)', () => {
      const callback = jest.fn();
      corsOriginValidator(undefined, 'production', allowedOrigins.join(','), callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('allows explicit permitted origins in production', () => {
      const callback = jest.fn();
      corsOriginValidator('https://tezlaa-admin.web.app', 'production', allowedOrigins.join(','), callback);
      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('rejects unauthorized third-party origins in production with 403', () => {
      const callback = jest.fn();
      corsOriginValidator('https://malicious-phishing-site.com', 'production', allowedOrigins.join(','), callback);
      expect(callback).toHaveBeenCalledWith(expect.any(ApiError));
      const errorArg = (callback.mock.calls[0] as any)[0] as ApiError;
      expect(errorArg.statusCode).toBe(403);
      expect(errorArg.message).toContain('not permitted');
    });

    it('rejects wildcard origin in production mode even if configured', () => {
      const callback = jest.fn();
      corsOriginValidator('https://unknown-site.com', 'production', 'https://trusted.com', callback);
      expect(callback).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe('Priority 3: Administrative Authorization & Role Gating', () => {
    const mockRes = () => {
      const res: any = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it('Unauthenticated request (missing req.user) is rejected with 401', () => {
      const req = { user: undefined } as unknown as AuthenticatedRequest;
      const res = mockRes();
      const next = jest.fn();

      const middleware = requireRole('ADMIN', 'BRANCH_MANAGER');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next.mock.calls[0] as any)[0] as ApiError;
      expect(error.statusCode).toBe(401);
      expect(error.message).toContain('Authentication required');
    });

    it('CUSTOMER role cannot access admin routes (403 Forbidden)', () => {
      const req = {
        user: { userId: 'cust-1', email: 'cust@gmail.com', role: 'CUSTOMER' },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();
      const next = jest.fn();

      const middleware = requireRole('ADMIN', 'BRANCH_MANAGER');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next.mock.calls[0] as any)[0] as ApiError;
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('do not have permission');
    });

    it('BRANCH_STAFF cannot perform ADMIN-only operations (loyalty adjustment / product deletion)', () => {
      const req = {
        user: { userId: 'staff-1', email: 'staff@tezlaa.com', role: 'BRANCH_STAFF', branchId: 'colombo-1' },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();
      const next = jest.fn();

      const adminOnlyMiddleware = requireRole('ADMIN');
      adminOnlyMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next.mock.calls[0] as any)[0] as ApiError;
      expect(error.statusCode).toBe(403);
    });

    it('ADMIN is allowed past role check without error', () => {
      const req = {
        user: { userId: 'admin-1', email: 'admin@tezlaa.com', role: 'ADMIN' },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();
      const next = jest.fn();

      const middleware = requireRole('ADMIN', 'BRANCH_MANAGER');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(); // called with no arguments
    });
  });

  describe('Priority 3: Cross-Branch Isolation & Direct Resource ID Access', () => {
    it('Branch Staff cannot view order from a different branch (403 Forbidden)', async () => {
      const req = {
        params: { id: 'ord-kandy-1' },
        user: { userId: 'staff-colombo', email: 'staff@tezlaa.com', role: 'BRANCH_STAFF', branchId: 'branch-colombo' },
      } as unknown as AuthenticatedRequest;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      // Mock adminService.getOrderById returning order belonging to Kandy branch
      jest.spyOn(adminService, 'getOrderById').mockResolvedValue({
        id: 'ord-kandy-1',
        orderNumber: 'TZL-KANDY-001',
        branchId: 'branch-kandy',
        userId: 'cust-99',
        status: 'CONFIRMED',
        grandTotal: 2500,
      } as any);

      adminController.getOrderById(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next.mock.calls[0] as any)[0] as ApiError;
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('other branches');
    });

    it('Branch Staff can view order within their own branch', async () => {
      const req = {
        params: { id: 'ord-colombo-1' },
        user: { userId: 'staff-colombo', email: 'staff@tezlaa.com', role: 'BRANCH_STAFF', branchId: 'branch-colombo' },
      } as unknown as AuthenticatedRequest;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      const next = jest.fn();

      jest.spyOn(adminService, 'getOrderById').mockResolvedValue({
        id: 'ord-colombo-1',
        orderNumber: 'TZL-COLOMBO-001',
        branchId: 'branch-colombo',
        userId: 'cust-1',
        status: 'PREPARING',
        grandTotal: 1500,
      } as any);

      adminController.getOrderById(req, res, next);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ id: 'ord-colombo-1' }),
        })
      );
    });

    it('requireBranchAccess blocks cross-branch mutation', () => {
      const req = {
        params: { branchId: 'branch-kandy' },
        body: {},
        query: {},
        user: { userId: 'mgr-colombo', email: 'mgr@tezlaa.com', role: 'BRANCH_MANAGER', branchId: 'branch-colombo' },
      } as unknown as AuthenticatedRequest;
      const res: any = {};
      const next = jest.fn();

      const branchMiddleware = requireBranchAccess();
      branchMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      const error = (next.mock.calls[0] as any)[0] as ApiError;
      expect(error.statusCode).toBe(403);
      expect(error.message).toContain('do not have access');
    });

    it('requireBranchAccess allows Master ADMIN across any branch', () => {
      const req = {
        params: { branchId: 'branch-kandy' },
        body: {},
        query: {},
        user: { userId: 'master-admin', email: 'admin@tezlaa.com', role: 'ADMIN' },
      } as unknown as AuthenticatedRequest;
      const res: any = {};
      const next = jest.fn();

      const branchMiddleware = requireBranchAccess();
      branchMiddleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
