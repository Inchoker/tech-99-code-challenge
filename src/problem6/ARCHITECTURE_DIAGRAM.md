# Score Board API - System Flow Diagram

## High-Level Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App    │    │   Game Client   │
│   (Browser)     │    │   (iOS/Android) │    │   (Desktop)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                         ┌───────▼───────┐
                         │  Load Balancer │
                         │   (nginx/ALB)  │
                         └───────┬───────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
    │API Server │          │API Server │          │API Server │
    │Instance 1 │          │Instance 2 │          │Instance N │
    └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Application Layer    │
                    │                         │
                    │  ┌─────────────────┐   │
                    │  │ Authentication  │   │
                    │  │   Middleware    │   │
                    │  └─────────────────┘   │
                    │                         │
                    │  ┌─────────────────┐   │
                    │  │ Rate Limiting   │   │
                    │  │   Middleware    │   │
                    │  └─────────────────┘   │
                    │                         │
                    │  ┌─────────────────┐   │
                    │  │   Input/Output  │   │
                    │  │   Validation    │   │
                    │  └─────────────────┘   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Business Logic      │
                    │                         │
                    │  ┌─────────────────┐   │
                    │  │     Score       │   │
                    │  │   Management    │   │
                    │  │    Service      │   │
                    │  └─────────────────┘   │
                    │                         │
                    │  ┌─────────────────┐   │
                    │  │   Leaderboard   │   │
                    │  │    Service      │   │
                    │  └─────────────────┘   │
                    │                         │
                    │  ┌─────────────────┐   │
                    │  │   Real-time     │   │
                    │  │  Notification   │   │
                    │  │    Service      │   │
                    │  └─────────────────┘   │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 │               │               │
        ┌────────▼────────┐ ┌───▼───┐ ┌────────▼────────┐
        │     Database    │ │ Redis │ │   WebSocket     │
        │   (PostgreSQL)  │ │ Cache │ │   Manager       │
        │                 │ │       │ │                 │
        │ ┌─────────────┐ │ │       │ │ ┌─────────────┐ │
        │ │ User Scores │ │ │       │ │ │ Active      │ │
        │ │   Table     │ │ │       │ │ │ Connections │ │
        │ └─────────────┘ │ │       │ │ └─────────────┘ │
        │                 │ │       │ │                 │
        │ ┌─────────────┐ │ │       │ │ ┌─────────────┐ │
        │ │ Audit Log   │ │ │       │ │ │ Room        │ │
        │ │   Table     │ │ │       │ │ │ Management  │ │
        │ └─────────────┘ │ │       │ │ └─────────────┘ │
        └─────────────────┘ └───────┘ └─────────────────┘
```

## Detailed Score Update Flow

```
User Action Completion
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  Generates      │ ── Action Token (JWT)
│  Action Token   │    - userId
└─────────┬───────┘    - actionType
          │            - timestamp
          │            - signature
          ▼
┌─────────────────┐
│  POST Request   │
│  /api/user/     │ ── Request Body:
│  {userId}/score │    - actionType
└─────────┬───────┘    - scoreIncrement
          │            - actionToken
          ▼
┌─────────────────┐
│  Load Balancer  │ ── Route to available
│  Distribution   │    API server instance
└─────────┬───────┘
          ▼
┌─────────────────┐
│  Authentication │ ── Validate JWT token
│  Middleware     │    - Check expiration
└─────────┬───────┘    - Verify signature
          │
          ▼
┌─────────────────┐
│  Rate Limiting  │ ── Check user limits
│  Middleware     │    - 10 requests/minute
└─────────┬───────┘    - IP-based limits
          │
          ▼
┌─────────────────┐
│  Input          │ ── Validate request
│  Validation     │    - Score increment range
└─────────┬───────┘    - Action type whitelist
          │
          ▼
┌─────────────────┐
│  Score Service  │ ── Business logic
│  Processing     │    - Calculate new score
└─────────┬───────┘    - Check for rank change
          │
          ▼
┌─────────────────┐
│  Database       │ ── Atomic transaction
│  Transaction    │    - Update user score
└─────────┬───────┘    - Log audit entry
          │
          ▼
┌─────────────────┐
│  Cache Update   │ ── Invalidate/update
│  (Redis)        │    - User score cache
└─────────┬───────┘    - Leaderboard cache
          │
          ▼
┌─────────────────┐
│  Leaderboard    │ ── Check if top 10
│  Recalculation  │    changed and update
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Real-time      │ ── Broadcast updates
│  Notification   │    - Personal score
└─────────┬───────┘    - Leaderboard changes
          │
          ▼
┌─────────────────┐
│  WebSocket      │ ── Send to connected
│  Broadcast      │    clients
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Response       │ ── Return success
│  to Client      │    - New score
└─────────────────┘    - New rank
```

## Real-time Update Flow

```
Score Update Occurs
         │
         ▼
┌─────────────────┐
│  Event Trigger  │ ── Score change detected
│  in Score       │    in business logic
│  Service        │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Determine      │ ── Check what changed:
│  Update Scope   │    - Personal score only
└─────────┬───────┘    - Leaderboard position
          │
          ▼
┌─────────────────┐
│  WebSocket      │ ── Manage active
│  Manager        │    connections
└─────────┬───────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼
┌─────────┐ ┌──────────────┐
│Personal │ │ Leaderboard  │
│Update   │ │ Update       │
└─────────┘ └──────────────┘
     │              │
     ▼              ▼
┌─────────┐ ┌──────────────┐
│Send to  │ │ Broadcast to │
│User's   │ │ All Users    │
│Socket   │ │ in Room      │
└─────────┘ └──────────────┘
```

## Security Flow

```
Malicious Request Attempt
         │
         ▼
┌─────────────────┐
│  Rate Limiting  │ ── First line of defense
│  Check          │    - IP-based limits
└─────────┬───────┘    - User-based limits
          │
          ▼
┌─────────────────┐
│  Token          │ ── Validate action token
│  Validation     │    - Signature check
└─────────┬───────┘    - Expiration check
          │            - One-time use check
          ▼
┌─────────────────┐
│  Action         │ ── Cross-reference with
│  Verification   │    - User's game state
└─────────┬───────┘    - Recent actions
          │            - Score increment limits
          ▼
┌─────────────────┐
│  Audit Logging  │ ── Log all attempts
│                 │    - Successful updates
└─────────┬───────┘    - Failed validations
          │            - Suspicious patterns
          ▼
┌─────────────────┐
│  Response       │ ── Return appropriate
│  Generation     │    error or success
└─────────────────┘
```
