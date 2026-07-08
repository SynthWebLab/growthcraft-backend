import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { jwtConfig } from '@/config/jwt.config';
import { logger } from '@/common/utils/logger.util';

const parseCookies = (cookieString?: string): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieString) return list;
  cookieString.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
};

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(server: http.Server): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const cookieHeader = socket.handshake.headers.cookie;
        const authHeader = socket.handshake.headers.authorization;
        let token: string | null = null;

        if (cookieHeader) {
          const cookies = parseCookies(cookieHeader);
          token = cookies.access_token;
        }

        if (!token && authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }

        if (!token) {
          logger.warn('Socket handshake authentication failed: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwtConfig.verifyAccessToken(token);
        socket.data = { userId: decoded.userId, email: decoded.email, role: decoded.role };
        next();
      } catch (error: any) {
        logger.warn(`Socket handshake authentication failed: ${error.message}`);
        return next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      logger.info(`✓ Socket connected: ${socket.id} (User: ${userId}, Role: ${socket.data.role})`);

      // Join a personal room named after the userId to allow multi-device/multi-tab emits
      void socket.join(userId);

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
      });
    });

    return this.io;
  }

  public emitToUser(userId: string, eventName: string, data: any): void {
    if (!this.io) {
      logger.warn('Socket.io server not initialized; cached message not emitted');
      return;
    }
    logger.info(`Emitting event '${eventName}' to User room: ${userId}`);
    this.io.to(userId).emit(eventName, data);
  }
}

export const socketService = SocketService.getInstance();
