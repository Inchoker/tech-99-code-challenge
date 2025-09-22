# Scoreboard API Setup Guide

## Installation

1. **Install Dependencies**
   ```bash
   cd src/problem6
   npm install
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Database**
   ```bash
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   
   # Create database
   sudo -u postgres createdb scoreboard
   sudo -u postgres createuser api_user
   sudo -u postgres psql -c "ALTER USER api_user WITH PASSWORD 'password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE scoreboard TO api_user;"
   ```

4. **Setup Redis**
   ```bash
   # Install Redis
   sudo apt-get install redis-server
   
   # Start Redis
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

5. **Build and Run**
   ```bash
   npm run build
   npm start
   
   # Or for development
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scoreboard
DB_USER=api_user
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key-here
LOG_LEVEL=debug
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Score Management
- `POST /api/scores/user/:userId` - Update user score
- `GET /api/scores/user/:userId` - Get user score
- `GET /api/scores/user/:userId/stats` - Get user statistics

### Leaderboard
- `GET /api/leaderboard` - Get top users
- `GET /api/leaderboard/user/:userId/position` - Get user position
- `GET /api/leaderboard/user/:userId/around` - Get leaderboard around user
- `GET /api/leaderboard/stats` - Get leaderboard statistics

### WebSocket Events
- `authenticate` - User authentication
- `join_leaderboard` - Join leaderboard updates
- `score_update` - Receive score updates
- `leaderboard_update` - Receive leaderboard changes

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run load tests
npm run test:load
```

## Docker Deployment

```bash
# Build image
docker build -t scoreboard-api .

# Run with docker-compose
docker-compose up -d
```

## Production Considerations

1. **Security**: Use strong JWT secrets and enable HTTPS
2. **Scaling**: Consider load balancing and database replication
3. **Monitoring**: Set up application and infrastructure monitoring
4. **Backup**: Implement database backup strategies
5. **Caching**: Optimize Redis configuration for production load
