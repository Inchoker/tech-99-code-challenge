import { Pool, PoolClient } from 'pg';

class DatabaseConnectionManager {
  private pool: Pool | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'scoreboard',
        password: process.env.DB_PASSWORD || 'password',
        port: parseInt(process.env.DB_PORT || '5432'),
        max: 20, // maximum number of clients in pool
        idleTimeoutMillis: 30000, // close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // return error after 2 seconds if connection could not be established
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      console.log('Database connection established');
      this.isInitialized = true;

      // Create tables if they don't exist
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  getConnection(): Pool {
    if (!this.pool || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.pool) return;

    const queries = [
      // User scores table
      `CREATE TABLE IF NOT EXISTS user_scores (
        user_id VARCHAR(255) PRIMARY KEY,
        score INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )`,

      // Audit log table
      `CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        score_change INTEGER NOT NULL,
        previous_score INTEGER NOT NULL,
        new_score INTEGER NOT NULL,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL DEFAULT true,
        error_message TEXT
      )`,

      // Users table (basic user information)
      `CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true
      )`,

      // Action tokens table (for tracking used tokens)
      `CREATE TABLE IF NOT EXISTS action_tokens (
        nonce VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE
      )`
    ];

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_scores_score ON user_scores(score DESC)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_action_tokens_user_id ON action_tokens(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_action_tokens_expires_at ON action_tokens(expires_at)'
    ];

    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Create tables
        for (const query of queries) {
          await client.query(query);
        }

        // Create indexes
        for (const index of indexes) {
          await client.query(index);
        }

        await client.query('COMMIT');
        console.log('Database tables and indexes created successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to create database tables:', error);
      throw error;
    }
  }

  /**
   * Execute a query with error handling and connection management
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client for transaction management
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return await this.pool.connect();
  }

  /**
   * Health check for the database
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) return false;
      
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    try {
      const result = await this.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE tablename IN ('user_scores', 'audit_log', 'users', 'action_tokens')
      `);

      return result.rows;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return [];
    }
  }
}

export const DatabaseConnection = new DatabaseConnectionManager();
