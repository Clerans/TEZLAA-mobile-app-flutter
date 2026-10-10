import { jest } from '@jest/globals';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { initSocket } from '../sockets/index.js';
import prisma from '../config/database.js';
import { env } from '../config/env.js';

describe('Socket.IO Security & Database-Backed Authorization Tests', () => {
  let httpServer: HttpServer;
  let io: any;

  beforeAll(() => {
    httpServer = new HttpServer();
    io = initSocket(httpServer);
  });

  afterAll(() => {
    io?.close();
    httpServer?.close();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to run middleware directly
  const runSocketMiddleware = async (handshake: any) => {
    const socket: any = {
      id: 'mock-socket-id',
      handshake,
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    let middlewareError: any = null;
    const middlewareFn = (io as any)._fns[0]; // First registered middleware in Socket.IO

    await new Promise<void>((resolve) => {
      middlewareFn(socket, (err?: any) => {
        middlewareError = err;
        resolve();
      });
    });

    return { socket, middlewareError };
  };

  it('Handshake: rejects connection when auth token is missing', async () => {
    const { middlewareError } = await runSocketMiddleware({ auth: {} });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: Token required');
  });

  it('Handshake: rejects connection when auth token is invalid or expired', async () => {
    const { middlewareError } = await runSocketMiddleware({
      auth: { token: 'invalid.tampered.token' },
    });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: Invalid or expired token');
  });

  it('Handshake: rejects connection when user does not exist in database', async () => {
    const token = jwt.sign({ userId: 'ghost-user', role: 'CUSTOMER' }, env.JWT_SECRET);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    const { middlewareError } = await runSocketMiddleware({ auth: { token } });
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

    const { middlewareError } = await runSocketMiddleware({ auth: { token } });
    expect(middlewareError).toBeDefined();
    expect(middlewareError.message).toBe('Authentication error: User account not verified');
  });

  it('Handshake: derives role and branch from fresh DB state, overriding stale JWT claims', async () => {
    // JWT claims user is an ADMIN, but DB record says CUSTOMER
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

    const { socket, middlewareError } = await runSocketMiddleware({ auth: { token } });
    expect(middlewareError).toBeNull();
    // Authoritative DB values applied to socket session
    expect(socket.user.role).toBe('CUSTOMER');
    expect(socket.user.branchId).toBeNull();
  });
});
