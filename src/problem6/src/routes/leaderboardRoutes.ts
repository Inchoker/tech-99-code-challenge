import { Router, Request, Response } from 'express';
import { LeaderboardService } from '../services/LeaderboardService';
import { ErrorCodes } from '../types';

export function leaderboardRoutes(leaderboardService: LeaderboardService): Router {
  const router = Router();

  /**
   * Get top users leaderboard
   * GET /api/leaderboard?limit=10
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const maxLimit = 50; // Prevent excessive data retrieval

      if (limit > maxLimit) {
        return res.status(400).json({
          error: {
            code: 'INVALID_LIMIT',
            message: `Limit cannot exceed ${maxLimit}`,
            timestamp: new Date().toISOString()
          }
        });
      }

      const leaderboard = await leaderboardService.getTopUsers(limit);

      res.json({
        success: true,
        data: leaderboard
      });

    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to retrieve leaderboard',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  /**
   * Get user position in leaderboard
   * GET /api/leaderboard/user/:userId/position
   */
  router.get('/user/:userId/position', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const position = await leaderboardService.getUserPosition(userId);

      res.json({
        success: true,
        data: {
          userId,
          ...position
        }
      });

    } catch (error) {
      console.error('Get user position error:', error);
      res.status(500).json({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to retrieve user position',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  /**
   * Get leaderboard around specific user
   * GET /api/leaderboard/user/:userId/around?range=5
   */
  router.get('/user/:userId/around', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const range = parseInt(req.query.range as string) || 5;
      const maxRange = 25;

      if (range > maxRange) {
        return res.status(400).json({
          error: {
            code: 'INVALID_RANGE',
            message: `Range cannot exceed ${maxRange}`,
            timestamp: new Date().toISOString()
          }
        });
      }

      const users = await leaderboardService.getLeaderboardAroundUser(userId, range);

      res.json({
        success: true,
        data: {
          userId,
          range,
          users
        }
      });

    } catch (error) {
      console.error('Get leaderboard around user error:', error);
      res.status(500).json({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to retrieve leaderboard around user',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  /**
   * Get leaderboard statistics
   * GET /api/leaderboard/stats
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const stats = await leaderboardService.getLeaderboardStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Get leaderboard stats error:', error);
      res.status(500).json({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to retrieve leaderboard statistics',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  /**
   * Initialize sample data (for testing/demo purposes)
   * POST /api/leaderboard/init-sample
   */
  router.post('/init-sample', async (req: Request, res: Response) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Sample data initialization not allowed in production',
            timestamp: new Date().toISOString()
          }
        });
      }

      await leaderboardService.initializeSampleData();

      res.json({
        success: true,
        message: 'Sample leaderboard data initialized'
      });

    } catch (error) {
      console.error('Initialize sample data error:', error);
      res.status(500).json({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Failed to initialize sample data',
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  return router;
}
