import { createClient, RedisClientType } from 'redis';

class RedisClientWrapper {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_delay: 1000,
        max_attempts: 5
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Disconnected from Redis');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    await this.client.set(key, value);
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    await this.client.setEx(key, seconds, value);
  }

  async del(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.exists(key);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.zAdd(key, { score, value: member });
  }

  async zrevrange(key: string, start: number, stop: number, withScores: boolean = false): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    
    if (withScores) {
      const result = await this.client.zRevRangeWithScores(key, start, stop);
      return result.map(item => `${item.value}:${item.score}`);
    } else {
      return await this.client.zRevRange(key, start, stop);
    }
  }

  async zrank(key: string, member: string): Promise<number | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.zRevRank(key, member);
  }

  async zscore(key: string, member: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.zScore(key, member);
  }

  async zcard(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not initialized or not connected');
    }
    return await this.client.zCard(key);
  }

  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const RedisClient = new RedisClientWrapper();
