import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

export interface ScoreUpdateNotification {
  newScore: number;
  oldRank: number | null;
  newRank: number | null;
  scoreIncrease: number;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user authentication/identification
      socket.on('authenticate', (data: { userId: string }) => {
        this.handleUserAuthentication(socket, data.userId);
      });

      // Handle joining leaderboard room
      socket.on('join_leaderboard', () => {
        socket.join('leaderboard');
        logger.info(`Socket ${socket.id} joined leaderboard room`);
      });

      // Handle leaving leaderboard room
      socket.on('leave_leaderboard', () => {
        socket.leave('leaderboard');
        logger.info(`Socket ${socket.id} left leaderboard room`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleUserDisconnection(socket);
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000); // Clean up every minute

    logger.info('WebSocket manager initialized');
  }

  /**
   * Handle user authentication and tracking
   */
  private handleUserAuthentication(socket: Socket, userId: string): void {
    // Remove any existing mapping for this socket
    const existingUserId = this.socketToUser.get(socket.id);
    if (existingUserId) {
      this.removeSocketFromUser(existingUserId, socket.id);
    }

    // Add new mapping
    this.socketToUser.set(socket.id, userId);
    
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    
    this.connectedUsers.get(userId)!.push(socket.id);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    logger.info(`User ${userId} authenticated with socket ${socket.id}`);

    // Notify user of successful authentication
    socket.emit('authenticated', { 
      userId, 
      timestamp: new Date().toISOString() 
    });
  }

  /**
   * Handle user disconnection cleanup
   */
  private handleUserDisconnection(socket: Socket): void {
    const userId = this.socketToUser.get(socket.id);
    if (userId) {
      this.removeSocketFromUser(userId, socket.id);
      this.socketToUser.delete(socket.id);
    }
  }

  /**
   * Remove socket from user's socket list
   */
  private removeSocketFromUser(userId: string, socketId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      const index = userSockets.indexOf(socketId);
      if (index > -1) {
        userSockets.splice(index, 1);
      }

      // Remove user entry if no sockets left
      if (userSockets.length === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  /**
   * Notify specific user about score update
   */
  notifyUserScoreUpdate(userId: string, notification: ScoreUpdateNotification): void {
    const message = {
      type: 'score_update',
      data: {
        userId,
        ...notification,
        timestamp: new Date().toISOString()
      }
    };

    // Send to user's personal room
    this.io.to(`user:${userId}`).emit('score_update', message);

    logger.info(`Score update notification sent to user ${userId}`, message);
  }

  /**
   * Broadcast leaderboard update to all connected clients
   */
  broadcastLeaderboardUpdate(): void {
    const message = {
      type: 'leaderboard_update',
      timestamp: new Date().toISOString()
    };

    // Broadcast to all clients in leaderboard room
    this.io.to('leaderboard').emit('leaderboard_update', message);

    logger.info('Leaderboard update broadcasted to all clients');
  }

  /**
   * Send notification to specific user
   */
  sendNotificationToUser(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcastToAll(event: string, data: any): void {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): any {
    const totalConnections = this.io.engine.clientsCount;
    const uniqueUsers = this.connectedUsers.size;
    const userConnections = Array.from(this.connectedUsers.entries()).map(([userId, socketIds]) => ({
      userId,
      connectionCount: socketIds.length
    }));

    return {
      totalConnections,
      uniqueUsers,
      userConnections,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.length > 0;
  }

  /**
   * Get list of online users
   */
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections(): void {
    const socketsToRemove: string[] = [];

    // Check each socket to see if it's still connected
    this.socketToUser.forEach((userId, socketId) => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (!socket || !socket.connected) {
        socketsToRemove.push(socketId);
      }
    });

    // Remove stale connections
    socketsToRemove.forEach(socketId => {
      const userId = this.socketToUser.get(socketId);
      if (userId) {
        this.removeSocketFromUser(userId, socketId);
        this.socketToUser.delete(socketId);
      }
    });

    if (socketsToRemove.length > 0) {
      logger.info(`Cleaned up ${socketsToRemove.length} stale connections`);
    }
  }

  /**
   * Send real-time analytics update
   */
  broadcastAnalytics(data: any): void {
    this.io.to('leaderboard').emit('analytics_update', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle emergency broadcast (system maintenance, etc.)
   */
  emergencyBroadcast(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    this.io.emit('system_message', {
      message,
      level,
      timestamp: new Date().toISOString()
    });

    logger.warn(`Emergency broadcast sent: ${message}`, { level });
  }
}
