import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ErrorCodes } from '../types';

export function authMiddleware(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const userId = req.params.userId || req.body.userId;

      // For this demo, we'll use a simple validation approach
      // In a real application, you'd validate JWT tokens or session cookies
      
      if (!userId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_USER_ID',
            message: 'User ID is required',
            timestamp: new Date().toISOString()
          }
        }) as any;
      }

      // Basic user validation
      const isValidUser = await authService.validateUser(userId, authHeader);
      
      if (!isValidUser) {
        return res.status(401).json({
          error: {
            code: ErrorCodes.UNAUTHORIZED,
            message: 'Invalid user or authentication required',
            timestamp: new Date().toISOString()
          }
        }) as any;
      }

      // Add user info to request for downstream middleware
      (req as any).user = { userId };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Authentication error',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
}
