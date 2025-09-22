import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { ScoreService } from './services/ScoreService';
import { LeaderboardService } from './services/LeaderboardService';
import { AuthService } from './services/AuthService';
import { WebSocketManager } from './services/WebSocketManager';
import { scoreRoutes } from './routes/scoreRoutes';
import { leaderboardRoutes } from './routes/leaderboardRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { DatabaseConnection } from './database/DatabaseConnection';
import { RedisClient } from './cache/RedisClient';

class ScoreboardAPIServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private scoreService: ScoreService;
  private leaderboardService: LeaderboardService;
  private authService: AuthService;
  private wsManager: WebSocketManager;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"]
      }
    });

    this.initializeServices();
    this.configureMiddleware();
    this.configureRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private async initializeServices(): Promise<void> {
    // Initialize database and cache connections
    await DatabaseConnection.initialize();
    await RedisClient.initialize();

    // Initialize services
    this.authService = new AuthService();
    this.scoreService = new ScoreService();
    this.leaderboardService = new LeaderboardService();
    this.wsManager = new WebSocketManager(this.io);

    // Set up service dependencies
    this.scoreService.setWebSocketManager(this.wsManager);
    this.scoreService.setLeaderboardService(this.leaderboardService);
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private configureRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // API routes
    this.app.use('/api/scores', scoreRoutes(this.scoreService, this.authService));
    this.app.use('/api/leaderboard', leaderboardRoutes(this.leaderboardService));

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  private setupWebSocket(): void {
    this.wsManager.initialize();
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      this.server.listen(port, () => {
        logger.info(`Scoreboard API Server running on port ${port}`);
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    logger.info('Shutting down server...');
    
    // Close WebSocket connections
    this.io.close();
    
    // Close database connections
    await DatabaseConnection.close();
    await RedisClient.close();
    
    // Close HTTP server
    this.server.close();
    
    logger.info('Server shutdown complete');
  }
}

// Initialize and start server
const server = new ScoreboardAPIServer();
const PORT = parseInt(process.env.PORT || '3000');

server.start(PORT).catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.stop();
  process.exit(0);
});

export default server;
