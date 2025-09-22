import jwt from 'jsonwebtoken';
import { ActionToken, ErrorCodes } from '../types';
import { logger } from '../utils/logger';
import { RedisClient } from '../cache/RedisClient';

export class AuthService {
  private jwtSecret: string;
  private tokenExpiration: number = 5 * 60; // 5 minutes

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  /**
   * Validate action token for score updates
   */
  async validateActionToken(token: string, userId: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(token, this.jwtSecret) as ActionToken;

      // Check if token belongs to the user
      if (decoded.userId !== userId) {
        return { valid: false, error: ErrorCodes.UNAUTHORIZED };
      }

      // Check if token has been used (one-time use)
      const tokenKey = `action_token:${decoded.nonce}`;
      const tokenUsed = await RedisClient.get(tokenKey);
      
      if (tokenUsed) {
        return { valid: false, error: ErrorCodes.INVALID_ACTION_TOKEN };
      }

      // Mark token as used
      await RedisClient.setex(tokenKey, this.tokenExpiration, 'used');

      // Additional validation: check if action type is valid
      const validActionTypes = ['GAME_COMPLETE', 'LEVEL_COMPLETE', 'ACHIEVEMENT_UNLOCK', 'BONUS_COLLECT', 'DAILY_LOGIN'];
      if (!validActionTypes.includes(decoded.actionType)) {
        return { valid: false, error: ErrorCodes.INVALID_ACTION_TOKEN };
      }

      return { valid: true };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: ErrorCodes.EXPIRED_TOKEN };
      }
      
      logger.error('Token validation error:', error);
      return { valid: false, error: ErrorCodes.INVALID_ACTION_TOKEN };
    }
  }

  /**
   * Generate action token for frontend use
   * This would typically be called when a user completes an action
   */
  generateActionToken(userId: string, actionType: string): string {
    const payload: ActionToken = {
      userId,
      actionType,
      timestamp: Date.now(),
      nonce: this.generateNonce()
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiration });
  }

  /**
   * Validate user authentication (basic implementation)
   */
  async validateUser(userId: string, authToken?: string): Promise<boolean> {
    // In a real implementation, this would validate the user's session/JWT
    // For this example, we'll do basic validation
    if (!userId || userId.length < 3) {
      return false;
    }

    // Check if user exists in our system (simplified check)
    const userExists = await this.checkUserExists(userId);
    return userExists;
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async checkUserExists(userId: string): Promise<boolean> {
    // In a real implementation, this would check the database
    // For demo purposes, we'll check cache or assume user exists if ID format is valid
    const userKey = `user:${userId}`;
    const userData = await RedisClient.get(userKey);
    
    // If not in cache, assume user exists for demo (in real app, check DB)
    return userData !== null || userId.length >= 3;
  }

  /**
   * Check rate limits for user actions
   */
  async checkRateLimit(userId: string, action: string = 'score_update'): Promise<{ allowed: boolean; remaining?: number }> {
    const key = `rate_limit:${userId}:${action}`;
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10; // Max 10 score updates per minute

    const current = await RedisClient.get(key);
    const currentCount = current ? parseInt(current) : 0;

    if (currentCount >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Increment counter
    const newCount = currentCount + 1;
    if (currentCount === 0) {
      // Set expiration on first request
      await RedisClient.setex(key, Math.ceil(windowMs / 1000), newCount.toString());
    } else {
      await RedisClient.set(key, newCount.toString());
    }

    return { allowed: true, remaining: maxRequests - newCount };
  }
}
