export interface UserScore {
  userId: string;
  username: string;
  currentScore: number;
  lastUpdated: Date;
  rank?: number;
}

export interface ScoreUpdateRequest {
  userId: string;
  actionType: string;
  scoreIncrement: number;
  actionToken: string;
  timestamp: Date;
}

export interface LeaderboardResponse {
  topUsers: UserScore[];
  lastUpdated: Date;
  totalUsers: number;
}

export interface ActionToken {
  userId: string;
  actionType: string;
  timestamp: number;
  nonce: string;
}

export interface ScoreUpdateResponse {
  success: boolean;
  newScore: number;
  newRank?: number;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  actionType: string;
  scoreChange: number;
  previousScore: number;
  newScore: number;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export enum ActionType {
  GAME_COMPLETE = 'GAME_COMPLETE',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  ACHIEVEMENT_UNLOCK = 'ACHIEVEMENT_UNLOCK',
  BONUS_COLLECT = 'BONUS_COLLECT',
  DAILY_LOGIN = 'DAILY_LOGIN'
}

export enum ErrorCodes {
  INVALID_ACTION_TOKEN = 'INVALID_ACTION_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_SCORE_INCREMENT = 'INVALID_SCORE_INCREMENT',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
