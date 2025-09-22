import { UserScore, LeaderboardResponse } from '../types';
import { RedisClient } from '../cache/RedisClient';
import { DatabaseConnection } from '../database/DatabaseConnection';

export class LeaderboardService {
  private readonly LEADERBOARD_KEY = 'leaderboard:global';
  private readonly LEADERBOARD_CACHE_TTL = 30; // 30 seconds

  /**
   * Get top 10 users from leaderboard
   */
  async getTopUsers(limit: number = 10): Promise<LeaderboardResponse> {
    try {
      // Try to get from cache first
      const cacheKey = `leaderboard:top${limit}`;
      const cachedData = await RedisClient.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Get from Redis sorted set
      const topUserIds = await RedisClient.zrevrange(this.LEADERBOARD_KEY, 0, limit - 1, true);
      const topUsers: UserScore[] = [];

      // Parse the Redis response and get user details
      for (let i = 0; i < topUserIds.length; i += 2) {
        const userId = topUserIds[i];
        const score = parseInt(topUserIds[i + 1]);
        const rank = (i / 2) + 1;

        const userScore: UserScore = {
          userId,
          username: await this.getUsername(userId),
          currentScore: score,
          lastUpdated: new Date(),
          rank
        };

        topUsers.push(userScore);
      }

      // Get total user count
      const totalUsers = await RedisClient.zcard(this.LEADERBOARD_KEY);

      const response: LeaderboardResponse = {
        topUsers,
        lastUpdated: new Date(),
        totalUsers
      };

      // Cache the response
      await RedisClient.setex(cacheKey, this.LEADERBOARD_CACHE_TTL, JSON.stringify(response));

      return response;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard');
    }
  }

  /**
   * Get user's position in leaderboard
   */
  async getUserPosition(userId: string): Promise<{ rank: number | null; score: number; totalUsers: number }> {
    const rank = await RedisClient.zrank(this.LEADERBOARD_KEY, userId);
    const scoreStr = await RedisClient.zscore(this.LEADERBOARD_KEY, userId);
    const totalUsers = await RedisClient.zcard(this.LEADERBOARD_KEY);

    return {
      rank: rank !== null ? rank + 1 : null, // Convert to 1-based ranking
      score: scoreStr ? parseInt(scoreStr) : 0,
      totalUsers
    };
  }

  /**
   * Get leaderboard around a specific user
   */
  async getLeaderboardAroundUser(userId: string, range: number = 5): Promise<UserScore[]> {
    const userRank = await RedisClient.zrank(this.LEADERBOARD_KEY, userId);
    
    if (userRank === null) {
      return [];
    }

    const start = Math.max(0, userRank - range);
    const end = userRank + range;

    const userIds = await RedisClient.zrevrange(this.LEADERBOARD_KEY, start, end, true);
    const users: UserScore[] = [];

    for (let i = 0; i < userIds.length; i += 2) {
      const uid = userIds[i];
      const score = parseInt(userIds[i + 1]);
      const rank = start + (i / 2) + 1;

      users.push({
        userId: uid,
        username: await this.getUsername(uid),
        currentScore: score,
        lastUpdated: new Date(),
        rank
      });
    }

    return users;
  }

  /**
   * Update user score in leaderboard
   */
  async updateUserScore(userId: string, score: number): Promise<void> {
    await RedisClient.zadd(this.LEADERBOARD_KEY, score, userId);
    
    // Invalidate related caches
    await this.invalidateLeaderboardCache();
  }

  /**
   * Remove user from leaderboard
   */
  async removeUser(userId: string): Promise<void> {
    await RedisClient.del(`user_score:${userId}`);
    // Note: We're not removing from the sorted set to maintain historical data
    // In a real implementation, you might want to move to an inactive leaderboard
    
    await this.invalidateLeaderboardCache();
  }

  /**
   * Get historical leaderboard data
   */
  async getHistoricalLeaderboard(date: Date): Promise<UserScore[]> {
    // This would typically query a historical data table
    // For this demo, we'll return current leaderboard
    const current = await this.getTopUsers(10);
    return current.topUsers;
  }

  /**
   * Get leaderboard statistics
   */
  async getLeaderboardStats(): Promise<any> {
    const totalUsers = await RedisClient.zcard(this.LEADERBOARD_KEY);
    
    if (totalUsers === 0) {
      return {
        totalUsers: 0,
        highestScore: 0,
        averageScore: 0,
        medianScore: 0
      };
    }

    // Get highest score (first in descending order)
    const topScores = await RedisClient.zrevrange(this.LEADERBOARD_KEY, 0, 0, true);
    const highestScore = topScores.length > 1 ? parseInt(topScores[1]) : 0;

    // For average and median, we'd need to fetch all scores
    // This is simplified for the demo
    const allScores = await RedisClient.zrevrange(this.LEADERBOARD_KEY, 0, -1, true);
    const scores = [];
    
    for (let i = 1; i < allScores.length; i += 2) {
      scores.push(parseInt(allScores[i]));
    }

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const medianScore = scores.length > 0 ? this.calculateMedian(scores) : 0;

    return {
      totalUsers,
      highestScore,
      averageScore: Math.round(averageScore),
      medianScore
    };
  }

  private async getUsername(userId: string): Promise<string> {
    // In a real application, this would fetch from user service or database
    // For demo purposes, generate a simple username
    return `User_${userId.substring(0, 8)}`;
  }

  private async invalidateLeaderboardCache(): Promise<void> {
    // Remove all leaderboard cache entries
    const keys = ['leaderboard:top10', 'leaderboard:top25', 'leaderboard:top50'];
    
    for (const key of keys) {
      await RedisClient.del(key);
    }
  }

  private calculateMedian(scores: number[]): number {
    const sorted = scores.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Initialize leaderboard with sample data (for testing)
   */
  async initializeSampleData(): Promise<void> {
    const sampleUsers = [
      { userId: 'user1', score: 1500 },
      { userId: 'user2', score: 1400 },
      { userId: 'user3', score: 1300 },
      { userId: 'user4', score: 1200 },
      { userId: 'user5', score: 1100 },
      { userId: 'user6', score: 1000 },
      { userId: 'user7', score: 900 },
      { userId: 'user8', score: 800 },
      { userId: 'user9', score: 700 },
      { userId: 'user10', score: 600 }
    ];

    for (const user of sampleUsers) {
      await this.updateUserScore(user.userId, user.score);
    }
  }
}
