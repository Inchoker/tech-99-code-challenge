import { Router, Request, Response } from 'express';
import { ScoreService } from '../services/ScoreService';
import { AuthService } from '../services/AuthService';
import { ScoreUpdateRequest, ErrorCodes } from '../types';
import { validateScoreUpdate } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

export function scoreRoutes(scoreService: ScoreService, authService: AuthService): Router {
  const router = Router();

  /**
   * Update user score
   * POST /api/scores/user/:userId
   */
  router.post('/user/:userId', 
    rateLimitMiddleware,
    authMiddleware(authService),
    validateScoreUpdate,
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const { actionType, scoreIncrement, actionToken } = req.body;

        // Validate action token
        const tokenValidation = await authService.validateActionToken(actionToken, userId);
        if (!tokenValidation.valid) {
          return res.status(422).json({
            error: {
              code: tokenValidation.error,
              message: getErrorMessage(tokenValidation.error!),
              timestamp: new Date().toISOString()
            }
          });
        }

        // Check rate limits
        const rateLimitCheck = await authService.checkRateLimit(userId, 'score_update');
        if (!rateLimitCheck.allowed) {
          return res.status(429).json({
            error: {
              code: ErrorCodes.RATE_LIMIT_EXCEEDED,
              message: 'Rate limit exceeded. Please try again later.',
              timestamp: new Date().toISOString()
            }
          });
        }

        // Update score
        const updateRequest: ScoreUpdateRequest = {
          userId,
          actionType,
          scoreIncrement,
          actionToken,
          timestamp: new Date()
        };

        const result = await scoreService.updateScore(
          updateRequest,
          req.ip || 'unknown',
          req.get('User-Agent') || 'unknown'
        );

        if (result.success) {
          res.json({
            success: true,
            data: {
              userId,
              newScore: result.newScore,
              newRank: result.newRank,
              scoreIncrease: scoreIncrement
            },
            meta: {
              rateLimitRemaining: rateLimitCheck.remaining
            }
          });
        } else {
          res.status(400).json({
            error: {
              code: 'SCORE_UPDATE_FAILED',
              message: result.message || 'Failed to update score',
              timestamp: new Date().toISOString()
            }
          });
        }

      } catch (error) {
        console.error('Score update error:', error);
        res.status(500).json({
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Internal server error',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );

  /**
   * Get user score
   * GET /api/scores/user/:userId
   */
  router.get('/user/:userId', 
    authMiddleware(authService),
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;

        const userScoreInfo = await scoreService.getUserScoreInfo(userId);
        
        res.json({
          success: true,
          data: userScoreInfo
        });

      } catch (error) {
        console.error('Get user score error:', error);
        res.status(500).json({
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Failed to retrieve user score',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );

  /**
   * Get user statistics
   * GET /api/scores/user/:userId/stats
   */
  router.get('/user/:userId/stats',
    authMiddleware(authService),
    async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;

        const stats = await scoreService.getUserStats(userId);
        const userInfo = await scoreService.getUserScoreInfo(userId);

        res.json({
          success: true,
          data: {
            userInfo,
            statistics: stats
          }
        });

      } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
          error: {
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Failed to retrieve user statistics',
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  );

  return router;
}

function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    [ErrorCodes.INVALID_ACTION_TOKEN]: 'The provided action token is invalid or has already been used',
    [ErrorCodes.EXPIRED_TOKEN]: 'The action token has expired',
    [ErrorCodes.UNAUTHORIZED]: 'You are not authorized to perform this action',
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
    [ErrorCodes.INVALID_SCORE_INCREMENT]: 'Invalid score increment value',
    [ErrorCodes.USER_NOT_FOUND]: 'User not found',
    [ErrorCodes.INTERNAL_ERROR]: 'Internal server error'
  };

  return errorMessages[errorCode] || 'Unknown error occurred';
}
