/**
 * Services Index
 * Central export point for all services
 */

export { default as AuthenticationService } from './AuthenticationService';
export { default as UserProfileService } from './UserProfileService';
export { default as HistoryManagementService } from './HistoryManagementService';
export { default as SessionManager } from './SessionManager';
export { default as AIAnalysisService } from './AIAnalysisService';
export { default as BarcodeValidationService } from './BarcodeValidationService';
export { default as TimerService } from './TimerService';
export { default as LevelManagementService } from './LevelManagementService';
export { default as ScoringEngine } from './ScoringEngine';
export { default as AnalyticsEngine } from './AnalyticsEngine';
export { default as IdentityService } from './IdentityService';

// Export types
export type { AuthSession, LoginCredentials, AuthResponse } from './AuthenticationService';
export type { ProfileUpdateData, ProfileResponse } from './UserProfileService';
export type { 
  HistoryFilter, 
  HistoryStatistics, 
  GameSession 
} from './HistoryManagementService';
export type { 
  SessionActivity, 
  SessionInfo 
} from './SessionManager';
export type { ScoreInput, ScoreResult } from './ScoringEngine';
export type { PerformanceStatistics } from './AnalyticsEngine';
