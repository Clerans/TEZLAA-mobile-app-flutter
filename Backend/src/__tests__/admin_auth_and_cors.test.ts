import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/database.js';

describe('CORS Policy & Administrative Negative Authorization Tests', () => {
  const app = createApp();

  const generateTestToken = (payload: { userId: string; role: string; branchId?: string | null }) => {
    return jwt.sign(
      {
        userId: payload.userId,
        email: `${payload.userId}@tezlaa.com`,
        role: payload.role,
        branchId: payload.branchId || null,
      },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CORS Origin Enforcement', () => {
    it('allows requests with NO origin header (Native Flutter mobile apps & webhooks)', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Online');
    });

    it('allows permitted explicit origin', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'https://tezlaa-admin.web.app');
      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://tezlaa-admin.web.app');
    });

    it('rejects unauthorized third-party browser origin', async () => {
      const res = await request(app)
        .get('/')
        .set('Origin', 'https://malicious-attacker-site.com');
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('CORS origin');
    });
  });

  describe('Administrative Role & Cross-Branch Authorization', () => {
    it('Customer cannot access Admin Dashboard (403 Forbidden)', async () => {
      const customerToken = generateTestToken({
        userId: 'cust-1',
        role: 'CUSTOMER',
      });

      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('permission');
    });

    it('Branch Staff cannot adjust customer loyalty points (Requires ADMIN role)', async () => {
      const staffToken = generateTestToken({
        userId: 'staff-1',
        role: 'BRANCH_STAFF',
        branchId: 'branch-colombo-1',
      });

      const res = await request(app)
        .post('/api/v1/admin/loyalty/adjust')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ userId: 'cust-1', points: 500, reason: 'Illicit bonus' });

      expect(res.status).toBe(403);
    });

    it('Branch Staff cannot delete products (Requires ADMIN role)', async () => {
      const staffToken = generateTestToken({
        userId: 'staff-1',
        role: 'BRANCH_STAFF',
        branchId: 'branch-colombo-1',
      });

      const res = await request(app)
        .delete('/api/v1/admin/products/prod-123')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
    });

    it('Cross-Branch Isolation: Branch Staff cannot view orders belonging to another branch', async () => {
      const staffToken = generateTestToken({
        userId: 'staff-1',
        role: 'BRANCH_STAFF',
        branchId: 'branch-colombo-1', // Assigned to Colombo
      });

      // Mock order belonging to Kandy branch
      jest.spyOn(prisma.order, 'findUnique').mockResolvedValue({
        id: 'ord-kandy-1',
        orderNumber: 'TZL-KANDY-01',
        branchId: 'branch-kandy-2', // Different branch!
        userId: 'cust-2',
        status: 'CONFIRMED',
        grandTotal: 1800,
        payments: [],
        items: [],
      } as any);

      const res = await request(app)
        .get('/api/v1/admin/orders/ord-kandy-1')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('other branches');
    });
  });
});
