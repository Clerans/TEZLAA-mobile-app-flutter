import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { socketAuthMiddleware } from '../sockets/index.js';
import prisma from '../config/database.js';
import { env } from '../config/env.js';

describe('Socket.IO Security & Database-Backed Authorization Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const runSocketAuth = async (handshake: any) => {
    const socket: any = {
      id: 'mock-socket-id',
      handshake,
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    let middlewareError: any = null;
    await socketAuthMiddleware(socket, (err?: any) => {
      middlewareError = err;
    });

    return { socket, middlewareError };
  };

  it('Handshake: rejects connection when auth token is missing', async () => {
    const { middlewareError } = await runSocketAuth({ auth: {} });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: Token required');
  });

  it('Handshake: rejects connection when auth token is invalid or expired', async () => {
    const { middlewareError } = await runSocketAuth({
      auth: { token: 'invalid.tampered.token' },
    });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: Invalid or expired token');
  });

  it('Handshake: rejects connection when user does not exist in database', async () => {
    const token = jwt.sign({ userId: 'ghost-user', role: 'CUSTOMER' }, env.JWT_SECRET);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    const { middlewareError } = await runSocketAuth({ auth: { token } });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: User account not found or deactivated');
  });

  it('Handshake: rejects connection when user account is not verified', async () => {
    const token = jwt.sign({ userId: 'unverified-user', role: 'CUSTOMER' }, env.JWT_SECRET);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'unverified-user',
      email: 'unverified@test.com',
      role: 'CUSTOMER',
      branchId: null,
      isVerified: false,
    } as any);

    const { middlewareError } = await runSocketAuth({ auth: { token } });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: User account not verified');
  });

  it('Handshake: derives role and branch from fresh DB state, overriding stale JWT claims', async () => {
    // Stale JWT claims user is an ADMIN, but authoritative DB says CUSTOMER
    const token = jwt.sign(
      { userId: 'user-reassigned', role: 'ADMIN', branchId: 'branch-fake' },
      env.JWT_SECRET
    );

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-reassigned',
      email: 'demoted@test.com',
      role: 'CUSTOMER', // Authoritative DB role
      branchId: null,
      isVerified: true,
    } as any);

    const { socket, middlewareError } = await runSocketAuth({ auth: { token } });
    expect(middlewareError).toBeUndefined();
    // Authoritative DB values applied to socket session
    expect(socket.user.role).toBe('CUSTOMER');
    expect(socket.user.branchId).toBeNull();
  });

  it('Handshake: authorizes verified active staff member with DB branch assignment', async () => {
    const token = jwt.sign({ userId: 'staff-active', role: 'BRANCH_STAFF' }, env.JWT_SECRET);

    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'staff-active',
      email: 'staff@tezlaa.com',
      role: 'BRANCH_STAFF',
      branchId: 'branch-colombo-1',
      isVerified: true,
    } as any);

    const { socket, middlewareError } = await runSocketAuth({ auth: { token } });
    expect(middlewareError).toBeUndefined();
    expect(socket.user.role).toBe('BRANCH_STAFF');
    expect(socket.user.branchId).toBe('branch-colombo-1');
  });
});
