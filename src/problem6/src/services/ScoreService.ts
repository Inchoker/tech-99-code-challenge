import { UserScore, ScoreUpdateRequest, ScoreUpdateResponse, ErrorCodes, AuditLogEntry } from '../types';
import { RedisClient } from '../cache/RedisClient';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { LeaderboardService } from './LeaderboardService';
import { WebSocketManager } from './WebSocketManager';
import { v4 as uuidv4 } from 'uuid';

export class ScoreService {
  private leaderboardService: LeaderboardService | null = null;
  private wsManager: WebSocketManager | null = null;
  private readonly LEADERBOARD_KEY = 'leaderboard:global';
  private readonly MAX_SCORE_INCREMENT = 1000;

  setLeaderboardService(service: LeaderboardService): void {
    this.leaderboardService = service;
  }

  setWebSocketManager(manager: WebSocketManager): void {
    this.wsManager = manager;
  }

  /**
   * Update user score after completing an action
   */
  async updateScore(request: ScoreUpdateRequest, ipAddress: string, userAgent: string): Promise<ScoreUpdateResponse> {
    try {
      // Validate score increment
      if (request.scoreIncrement <= 0 || request.scoreIncrement > this.MAX_SCORE_INCREMENT) {
        throw new Error(ErrorCodes.INVALID_SCORE_INCREMENT);
      }

      // Get current user score
      const currentScore = await this.getCurrentScore(request.userId);
      const newScore = currentScore + request.scoreIncrement;

      // Start database transaction
      const db = DatabaseConnection.getConnection();
      await db.query('BEGIN');

      try {
        // Update user score in database
        await db.query(
          'INSERT INTO user_scores (user_id, score, last_updated) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET score = $2, last_updated = $3',
          [request.userId, newScore, new Date()]
        );

        // Log audit entry
        const auditEntry: AuditLogEntry = {
          id: uuidv4(),
          userId: request.userId,
          actionType: request.actionType,
          scoreChange: request.scoreIncrement,
          previousScore: currentScore,
          newScore: newScore,
          ipAddress,
          userAgent,
          timestamp: new Date(),
          success: true
        };

        await this.logAuditEntry(auditEntry);

        // Commit transaction
        await db.query('COMMIT');

        // Update cache
        await this.updateScoreCache(request.userId, newScore);

        // Update leaderboard
        const oldRank = await this.getUserRank(request.userId);
        await this.updateLeaderboard(request.userId, newScore);
        const newRank = await this.getUserRank(request.userId);

        // Send real-time notifications
        if (this.wsManager) {
          // Notify user of score update
          this.wsManager.notifyUserScoreUpdate(request.userId, {
            newScore,
            oldRank,
            newRank,
            scoreIncrease: request.scoreIncrement
          });

          // If rank changed significantly or entered top 10, notify all users
          if (newRank !== null && (oldRank === null || Math.abs(newRank - oldRank) > 0)) {
            if (newRank < 10) {
              this.wsManager.broadcastLeaderboardUpdate();
            }
          }
        }

        return {
          success: true,
          newScore,
          newRank: newRank || undefined
        };

      } catch (dbError) {
        await db.query('ROLLBACK');
        throw dbError;
      }

    } catch (error) {
      // Log failed attempt
      const auditEntry: AuditLogEntry = {
        id: uuidv4(),
        userId: request.userId,
        actionType: request.actionType,
        scoreChange: request.scoreIncrement,
        previousScore: await this.getCurrentScore(request.userId),
        newScore: 0,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };

      await this.logAuditEntry(auditEntry);

      return {
        success: false,
        newScore: await this.getCurrentScore(request.userId),
        message: error instanceof Error ? error.message : 'Failed to update score'
      };
    }
  }

  /**
   * Get current user score
   */
  async getCurrentScore(userId: string): Promise<number> {
    // Try cache first
    const cachedScore = await RedisClient.get(`user_score:${userId}`);
    if (cachedScore !== null) {
      return parseInt(cachedScore);
    }

    // Fall back to database
    const db = DatabaseConnection.getConnection();
    const result = await db.query('SELECT score FROM user_scores WHERE user_id = $1', [userId]);
    
    const score = result.rows.length > 0 ? result.rows[0].score : 0;
    
    // Cache the result
    await RedisClient.setex(`user_score:${userId}`, 300, score.toString()); // 5 minute cache
    
    return score;
  }

  /**
   * Get user ranking
   */
  async getUserRank(userId: string): Promise<number | null> {
    const rank = await RedisClient.zrank(this.LEADERBOARD_KEY, userId);
    return rank !== null ? rank + 1 : null; // Convert 0-based to 1-based ranking
  }

  /**
   * Get user score with ranking information
   */
  async getUserScoreInfo(userId: string): Promise<UserScore> {
    const score = await this.getCurrentScore(userId);
    const rank = await this.getUserRank(userId);
    
    // Get username (simplified - in real app, this would come from user service)
    const username = await this.getUsername(userId);

    return {
      userId,
      username,
      currentScore: score,
      lastUpdated: new Date(),
      rank: rank || undefined
    };
  }

  private async updateScoreCache(userId: string, score: number): Promise<void> {
    await RedisClient.setex(`user_score:${userId}`, 300, score.toString());
  }

  private async updateLeaderboard(userId: string, score: number): Promise<void> {
    await RedisClient.zadd(this.LEADERBOARD_KEY, score, userId);
  }

  private async getUsername(userId: string): Promise<string> {
    // In a real application, this would fetch from user service or database
    // For demo purposes, generate a simple username
    return `User_${userId.substring(0, 8)}`;
  }

  private async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      const db = DatabaseConnection.getConnection();
      await db.query(
        `INSERT INTO audit_log (id, user_id, action_type, score_change, previous_score, new_score, 
         ip_address, user_agent, timestamp, success, error_message) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          entry.id,
          entry.userId,
          entry.actionType,
          entry.scoreChange,
          entry.previousScore,
          entry.newScore,
          entry.ipAddress,
          entry.userAgent,
          entry.timestamp,
          entry.success,
          entry.errorMessage || null
        ]
      );
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error here to avoid breaking the main flow
    }
  }

  /**
   * Get user activity statistics
   */
  async getUserStats(userId: string): Promise<any> {
    const db = DatabaseConnection.getConnection();
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_actions,
        SUM(score_change) as total_score_gained,
        MAX(timestamp) as last_action,
        COUNT(DISTINCT action_type) as unique_actions
       FROM audit_log 
       WHERE user_id = $1 AND success = true`,
      [userId]
    );

    return result.rows[0] || {
      total_actions: 0,
      total_score_gained: 0,
      last_action: null,
      unique_actions: 0
    };
  }
}
