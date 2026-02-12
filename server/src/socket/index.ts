import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser } from '../types';
import { logger } from '../utils/logger';

let io: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function initializeSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // Allow unauthenticated connections for limited functionality
      (socket as any).user = null;
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as AuthUser;
      (socket as any).user = decoded;
      next();
    } catch {
      // Allow connection but without user context
      (socket as any).user = null;
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthUser | null;
    logger.debug('Socket connected', {
      socketId: socket.id,
      userId: user?.id,
    });

    // Join user-specific room
    if (user) {
      socket.join(`user:${user.id}`);
    }

    // Join project room
    socket.on('join-project', (projectId: string) => {
      socket.join(`project:${projectId}`);
      logger.debug('Socket joined project', { socketId: socket.id, projectId });
    });

    // Leave project room
    socket.on('leave-project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Subscribe to job updates
    socket.on('subscribe:job', ({ jobId }: { jobId: string }) => {
      socket.join(`job:${jobId}`);
    });

    socket.on('unsubscribe:job', ({ jobId }: { jobId: string }) => {
      socket.leave(`job:${jobId}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.debug('Socket disconnected', {
        socketId: socket.id,
        userId: user?.id,
        reason,
      });
    });

    // Handle errors
    socket.on('error', (err) => {
      logger.error('Socket error', { socketId: socket.id, error: err.message });
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
}

// Helper functions for emitting events
export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToProject(projectId: string, event: string, data: any): void {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}

export function emitToJob(jobId: string, event: string, data: any): void {
  if (io) {
    io.to(`job:${jobId}`).emit(event, data);
  }
}

export function emitToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}
