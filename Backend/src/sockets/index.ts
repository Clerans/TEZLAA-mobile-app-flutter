import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/database.js';
import { AuthPayload } from '../types/index.js';

let ioInstance: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1] ||
      (socket.handshake.query?.token as string);

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
        (socket as any).user = decoded;
      } catch (err) {
        // Token invalid, allow anonymous or reject based on policy
        console.warn(`Socket auth token invalid for socket: ${socket.id}`);
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload | undefined;
    console.log(`🔌 WebSocket connection established: ${socket.id}${user ? ` (User: ${user.userId})` : ''}`);

    if (user?.userId) {
      socket.join(`user:${user.userId}`);
      console.log(`🔔 Automatically joined user room: user:${user.userId}`);
    }

    const handleJoinOrder = async (data: any) => {
      const targetOrderId = typeof data === 'string' ? data : data?.orderId;
      if (!targetOrderId) return;

      if (!user) {
        console.warn(`🔒 Unauthorized socket ${socket.id} attempted to join order room: ${targetOrderId}`);
        socket.emit('socket:error', { message: 'Authentication required to join order room' });
        return;
      }

      try {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { id: targetOrderId },
              { orderNumber: targetOrderId },
            ],
          },
          select: { id: true, userId: true, branchId: true, orderNumber: true },
        });

        if (!order) {
          socket.emit('socket:error', { message: 'Order not found' });
          return;
        }

        // Strict Authorization Matrix:
        // 1. ADMIN: allowed across all orders
        // 2. BRANCH_STAFF / BRANCH_MANAGER: allowed ONLY if assigned branch matches order.branchId
        // 3. CUSTOMER: allowed ONLY if order.userId matches authenticated user
        let isAuthorized = false;

        if (user.role === 'ADMIN') {
          isAuthorized = true;
        } else if (user.role === 'BRANCH_STAFF' || user.role === 'BRANCH_MANAGER') {
          if (user.branchId && user.branchId === order.branchId) {
            isAuthorized = true;
          }
        } else if (user.userId === order.userId) {
          isAuthorized = true;
        }

        if (isAuthorized) {
          socket.join(`order:${order.id}`);
          console.log(`📡 Socket ${socket.id} (User: ${user.userId}, Role: ${user.role}) joined authorized room: order:${order.id}`);
          socket.emit('order:joined', { orderId: order.id, orderNumber: order.orderNumber });
        } else {
          console.warn(`🚫 Forbidden access: User ${user.userId} denied subscription to order:${order.id}`);
          socket.emit('socket:error', { message: 'You do not have permission to track this order' });
        }
      } catch (err) {
        console.error(`Error verifying order room authorization for socket ${socket.id}:`, err);
        socket.emit('socket:error', { message: 'Internal socket authorization error' });
      }
    };

    const handleLeaveOrder = (data: any) => {
      const targetOrderId = typeof data === 'string' ? data : data?.orderId;
      if (targetOrderId) {
        socket.leave(`order:${targetOrderId}`);
        console.log(`📡 Socket ${socket.id} left room: order:${targetOrderId}`);
      }
    };

    socket.on('join_order_room', handleJoinOrder);
    socket.on('join:order', handleJoinOrder);
    socket.on('leave_order_room', handleLeaveOrder);
    socket.on('leave:order', handleLeaveOrder);

    // Join user notification room with identity check
    socket.on('join_user_room', (userId: string) => {
      if (userId && user && (user.userId === userId || user.role === 'ADMIN')) {
        socket.join(`user:${userId}`);
        console.log(`🔔 Socket ${socket.id} joined room: user:${userId}`);
      } else {
        console.warn(`🔒 Socket ${socket.id} unauthorized join attempt to user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ WebSocket disconnected: ${socket.id}`);
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = (): SocketIOServer | null => ioInstance;

export const emitOrderStatusUpdated = (orderId: string, userId: string, payload: any) => {
  if (!ioInstance) return;
  // Emit to order room (tracking screen)
  ioInstance.to(`order:${orderId}`).emit('order:status_updated', payload);
  ioInstance.to(`order:${orderId}`).emit('order:status-updated', payload);
  ioInstance.to(`order:${orderId}`).emit('order:updated', payload);
  // Emit to user room (orders tab / notification trigger)
  ioInstance.to(`user:${userId}`).emit('order:status_updated', payload);
  ioInstance.to(`user:${userId}`).emit('order:status-updated', payload);
  ioInstance.to(`user:${userId}`).emit('order:updated', payload);
  console.log(`📡 Emitted order status updates to order:${orderId} & user:${userId}`);
};

export const emitNotification = (userId: string, notification: any) => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit('notification:new', notification);
  console.log(`🔔 Emitted notification:new to user:${userId}`);
};
