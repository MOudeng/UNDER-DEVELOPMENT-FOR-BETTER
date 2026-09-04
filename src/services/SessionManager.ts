/**
 * Session Manager
 * Manages user sessions, activity tracking, and session lifecycle
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import AuthenticationService from './AuthenticationService';

export interface SessionActivity {
  id: string;
  userId: string;
  action: string;
  screen: string;
  timestamp: number;
  metadata?: any;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  startTime: number;
  lastActivityTime: number;
  activities: SessionActivity[];
  isActive: boolean;
  deviceInfo?: any;
}

class SessionManager {
  private currentSession: SessionInfo | null = null;
  private activityTimeout: ReturnType<typeof setTimeout> | null = null;
  private appStateSubscription: any = null;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly ACTIVITY_KEY_PREFIX = '@session_activity_';
  private readonly SESSION_KEY = '@current_session';

  /**
   * Initialize session manager
   */
  async initialize(): Promise<void> {
    try {
      // Check for existing session
      const session = await this.loadSession();
      
      if (session && this.isSessionActive(session)) {
        this.currentSession = session;
        this.startActivityMonitoring();
      } else {
        await this.clearSession();
      }

      // Listen to app state changes
      this.setupAppStateListener();
    } catch (error) {
      console.error('Session manager initialization error:', error);
    }
  }

  /**
   * Start a new session
   */
  async startSession(userId: string): Promise<SessionInfo> {
    try {
      const sessionId = this.generateSessionId();
      
      const session: SessionInfo = {
        sessionId,
        userId,
        startTime: Date.now(),
        lastActivityTime: Date.now(),
        activities: [],
        isActive: true,
        deviceInfo: await this.getDeviceInfo()
      };

      this.currentSession = session;
      await this.saveSession(session);
      this.startActivityMonitoring();

      // Log session start
      await this.logActivity(userId, 'session_start', 'app', {
        sessionId
      });

      return session;
    } catch (error) {
      console.error('Start session error:', error);
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    try {
      if (!this.currentSession) {
        return;
      }

      // Log session end
      await this.logActivity(
        this.currentSession.userId,
        'session_end',
        'app',
        {
          sessionId: this.currentSession.sessionId,
          duration: Date.now() - this.currentSession.startTime
        }
      );

      // Archive session
      await this.archiveSession(this.currentSession);

      // Clear current session
      this.currentSession = null;
      await this.clearSession();
      this.stopActivityMonitoring();
    } catch (error) {
      console.error('End session error:', error);
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionInfo | null {
    return this.currentSession;
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    if (!this.currentSession) {
      return false;
    }

    return this.isSessionActive(this.currentSession);
  }

  /**
   * Update session activity
   */
  async updateActivity(): Promise<void> {
    try {
      if (!this.currentSession) {
        return;
      }

      this.currentSession.lastActivityTime = Date.now();
      await this.saveSession(this.currentSession);

      // Reset activity timeout
      this.resetActivityTimeout();
    } catch (error) {
      console.error('Update activity error:', error);
    }
  }

  /**
   * Log user activity
   */
  async logActivity(
    userId: string,
    action: string,
    screen: string,
    metadata?: any
  ): Promise<void> {
    try {
      const activity: SessionActivity = {
        id: this.generateActivityId(),
        userId,
        action,
        screen,
        timestamp: Date.now(),
        metadata
      };

      // Add to current session
      if (this.currentSession && this.currentSession.userId === userId) {
        this.currentSession.activities.push(activity);
        await this.saveSession(this.currentSession);
      }

      // Save to activity log
      await this.saveActivity(userId, activity);

      // Update last activity time
      await this.updateActivity();
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }

  /**
   * Get session activities
   */
  async getActivities(userId: string, limit?: number): Promise<SessionActivity[]> {
    try {
      const activityKey = this.ACTIVITY_KEY_PREFIX + userId;
      const activitiesJson = await AsyncStorage.getItem(activityKey);

      if (!activitiesJson) {
        return [];
      }

      let activities: SessionActivity[] = JSON.parse(activitiesJson);

      // Sort by timestamp (newest first)
      activities.sort((a, b) => b.timestamp - a.timestamp);

      // Apply limit
      if (limit) {
        activities = activities.slice(0, limit);
      }

      return activities;
    } catch (error) {
      console.error('Get activities error:', error);
      return [];
    }
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    if (!this.currentSession) {
      return 0;
    }

    return Date.now() - this.currentSession.startTime;
  }

  /**
   * Get idle time
   */
  getIdleTime(): number {
    if (!this.currentSession) {
      return 0;
    }

    return Date.now() - this.currentSession.lastActivityTime;
  }

  /**
   * Check if session is idle
   */
  isIdle(): boolean {
    return this.getIdleTime() > this.SESSION_TIMEOUT;
  }

  /**
   * Refresh session (extend timeout)
   */
  async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        return false;
      }

      await this.updateActivity();
      
      // Also refresh auth session
      await AuthenticationService.refreshSession();

      return true;
    } catch (error) {
      console.error('Refresh session error:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics(userId: string): Promise<{
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    totalActivities: number;
    lastSessionTime: number;
  }> {
    try {
      const sessions = await this.getArchivedSessions(userId);
      const activities = await this.getActivities(userId);

      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce(
        (sum, session) => sum + (session.lastActivityTime - session.startTime),
        0
      );
      const averageDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;
      const lastSessionTime = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.startTime))
        : 0;

      return {
        totalSessions,
        totalDuration,
        averageDuration,
        totalActivities: activities.length,
        lastSessionTime
      };
    } catch (error) {
      console.error('Get session statistics error:', error);
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
        totalActivities: 0,
        lastSessionTime: 0
      };
    }
  }

  /**
   * Clear all session data
   */
  async clearAllData(userId: string): Promise<void> {
    try {
      const activityKey = this.ACTIVITY_KEY_PREFIX + userId;
      const sessionsKey = `@archived_sessions_${userId}`;

      await AsyncStorage.multiRemove([activityKey, sessionsKey]);
    } catch (error) {
      console.error('Clear all data error:', error);
    }
  }

  // Private methods

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateActivityId(): string {
    return 'activity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private async getDeviceInfo(): Promise<any> {
    // In a real app, you would use react-native-device-info
    return {
      platform: 'android',
      timestamp: Date.now()
    };
  }

  private isSessionActive(session: SessionInfo): boolean {
    const idleTime = Date.now() - session.lastActivityTime;
    return idleTime < this.SESSION_TIMEOUT;
  }

  private async saveSession(session: SessionInfo): Promise<void> {
    await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  private async loadSession(): Promise<SessionInfo | null> {
    try {
      const sessionJson = await AsyncStorage.getItem(this.SESSION_KEY);
      if (sessionJson) {
        return JSON.parse(sessionJson);
      }
      return null;
    } catch (error) {
      console.error('Load session error:', error);
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    await AsyncStorage.removeItem(this.SESSION_KEY);
  }

  private async saveActivity(userId: string, activity: SessionActivity): Promise<void> {
    try {
      const activityKey = this.ACTIVITY_KEY_PREFIX + userId;
      const activitiesJson = await AsyncStorage.getItem(activityKey);
      const activities: SessionActivity[] = activitiesJson ? JSON.parse(activitiesJson) : [];

      activities.push(activity);

      // Limit activities to last 500
      if (activities.length > 500) {
        activities.shift();
      }

      await AsyncStorage.setItem(activityKey, JSON.stringify(activities));
    } catch (error) {
      console.error('Save activity error:', error);
    }
  }

  private async archiveSession(session: SessionInfo): Promise<void> {
    try {
      const sessionsKey = `@archived_sessions_${session.userId}`;
      const sessionsJson = await AsyncStorage.getItem(sessionsKey);
      const sessions: SessionInfo[] = sessionsJson ? JSON.parse(sessionsJson) : [];

      sessions.push({
        ...session,
        isActive: false
      });

      // Limit archived sessions to last 50
      if (sessions.length > 50) {
        sessions.shift();
      }

      await AsyncStorage.setItem(sessionsKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Archive session error:', error);
    }
  }

  private async getArchivedSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const sessionsKey = `@archived_sessions_${userId}`;
      const sessionsJson = await AsyncStorage.getItem(sessionsKey);
      
      if (!sessionsJson) {
        return [];
      }

      return JSON.parse(sessionsJson);
    } catch (error) {
      console.error('Get archived sessions error:', error);
      return [];
    }
  }

  private startActivityMonitoring(): void {
    this.resetActivityTimeout();
  }

  private stopActivityMonitoring(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
  }

  private resetActivityTimeout(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setTimeout(async () => {
      if (this.isIdle()) {
        console.log('Session timeout due to inactivity');
        await this.endSession();
        await AuthenticationService.logout();
      }
    }, this.SESSION_TIMEOUT);
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    try {
      if (nextAppState === 'active') {
        // App came to foreground
        if (this.currentSession) {
          await this.updateActivity();
          await this.logActivity(
            this.currentSession.userId,
            'app_foreground',
            'app'
          );
        }
      } else if (nextAppState === 'background') {
        // App went to background
        if (this.currentSession) {
          await this.logActivity(
            this.currentSession.userId,
            'app_background',
            'app'
          );
        }
      }
    } catch (error) {
      console.error('Handle app state change error:', error);
    }
  }

  /**
   * Cleanup on app close
   */
  async cleanup(): Promise<void> {
    try {
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
      }

      this.stopActivityMonitoring();

      if (this.currentSession) {
        await this.endSession();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Export singleton instance
export default new SessionManager();
