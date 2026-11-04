/**
 * History Management Service
 * Handles game history, performance tracking, and analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { GamePerformance } from '../types/gamePerformance';

export const GUEST_STATISTICS_USER_ID = '@guest_statistics';

export interface HistoryFilter {
  userId?: string;
  levelNumber?: number;
  startDate?: number;
  endDate?: number;
  completed?: boolean;
}

export interface HistoryStatistics {
  totalGames: number;
  completedGames: number;
  timedGames: number;
  averageTime: number;
  bestTime: number;
  worstTime: number;
  averageScore: number;
  bestScore: number;
  completionRate: number;
  levelDistribution: { [key: number]: number };
  performanceTrend: 'improving' | 'declining' | 'stable';
}

interface CompletedTestSession {
  id: string;
  totalTimeSeconds: number;
  completedAt: number;
}

export interface GameSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  performances: GamePerformance[];
  totalScore: number;
  completed: boolean;
}

class HistoryManagementService {
  private readonly HISTORY_KEY_PREFIX = '@game_performance_';
  private readonly TEST_SESSIONS_KEY_PREFIX = '@completed_test_sessions_';
  private readonly SESSION_KEY_PREFIX = '@game_session_';
  private readonly MAX_HISTORY_ITEMS = 1000; // Limit history to prevent storage overflow
  private readonly historyWriteQueues = new Map<string, Promise<void>>();

  /**
   * Save game performance to history
   */
  async savePerformance(userId: string, performance: GamePerformance): Promise<boolean> {
    const previousWrite = this.historyWriteQueues.get(userId) ?? Promise.resolve();
    let saved = false;

    const currentWrite = previousWrite.catch(() => undefined).then(async () => {
      const historyKey = this.HISTORY_KEY_PREFIX + userId;
      const historyJson = await AsyncStorage.getItem(historyKey);
      const history: GamePerformance[] = historyJson ? JSON.parse(historyJson) : [];

      // Add new performance
      history.push(performance);

      // Limit history size
      if (history.length > this.MAX_HISTORY_ITEMS) {
        history.shift(); // Remove oldest item
      }

      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      saved = true;
    });

    this.historyWriteQueues.set(userId, currentWrite);

    try {
      await currentWrite;
      return saved;
    } catch (error) {
      console.error('Save performance error:', error);
      return false;
    } finally {
      if (this.historyWriteQueues.get(userId) === currentWrite) {
        this.historyWriteQueues.delete(userId);
      }
    }
  }

  async saveCompletedTestSession(
    userId: string,
    totalTimeSeconds: number,
  ): Promise<boolean> {
    const previousWrite = this.historyWriteQueues.get(userId) ?? Promise.resolve();
    let saved = false;

    const currentWrite = previousWrite.catch(() => undefined).then(async () => {
      const key = this.TEST_SESSIONS_KEY_PREFIX + userId;
      const storedSessions = await AsyncStorage.getItem(key);
      const sessions: CompletedTestSession[] = storedSessions
        ? JSON.parse(storedSessions)
        : [];

      sessions.push({
        id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        totalTimeSeconds: Math.max(0, totalTimeSeconds),
        completedAt: Date.now(),
      });

      if (sessions.length > this.MAX_HISTORY_ITEMS) {
        sessions.shift();
      }

      await AsyncStorage.setItem(key, JSON.stringify(sessions));
      saved = true;
    });

    this.historyWriteQueues.set(userId, currentWrite);

    try {
      await currentWrite;
      return saved;
    } catch (error) {
      console.error('Save completed test session error:', error);
      return false;
    } finally {
      if (this.historyWriteQueues.get(userId) === currentWrite) {
        this.historyWriteQueues.delete(userId);
      }
    }
  }

  private async getCompletedTestSessions(
    userId: string,
  ): Promise<CompletedTestSession[]> {
    try {
      const storedSessions = await AsyncStorage.getItem(
        this.TEST_SESSIONS_KEY_PREFIX + userId,
      );
      if (!storedSessions) {
        return [];
      }

      const parsed: unknown = JSON.parse(storedSessions);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Get completed test sessions error:', error);
      return [];
    }
  }

  /**
   * Get all performance history for a user
   */
  async getHistory(userId: string, filter?: HistoryFilter): Promise<GamePerformance[]> {
    try {
      const historyKey = this.HISTORY_KEY_PREFIX + userId;
      const historyJson = await AsyncStorage.getItem(historyKey);
      
      if (!historyJson) {
        return [];
      }

      let history: GamePerformance[] = JSON.parse(historyJson);

      // Apply filters
      if (filter) {
        history = this.applyFilters(history, filter);
      }

      // Sort by timestamp (newest first)
      history.sort((a, b) => b.timestamp - a.timestamp);

      return history;
    } catch (error) {
      console.error('Get history error:', error);
      return [];
    }
  }

  /**
   * Get performance history for specific level
   */
  async getLevelHistory(userId: string, levelNumber: number): Promise<GamePerformance[]> {
    return this.getHistory(userId, { levelNumber });
  }

  /**
   * Get recent performance history
   */
  async getRecentHistory(userId: string, limit: number = 10): Promise<GamePerformance[]> {
    try {
      const history = await this.getHistory(userId);
      return history.slice(0, limit);
    } catch (error) {
      console.error('Get recent history error:', error);
      return [];
    }
  }

  /**
   * Get history statistics
   */
  async getStatistics(userId: string, filter?: HistoryFilter): Promise<HistoryStatistics> {
    try {
      const [history, testSessions] = await Promise.all([
        this.getHistory(userId, filter),
        this.getCompletedTestSessions(userId),
      ]);

      if (history.length === 0 && testSessions.length === 0) {
        return this.getEmptyStatistics();
      }

      const completedGames = history.filter(h => h.completed).length;
      const times = testSessions
        .filter(session => Number.isFinite(session.totalTimeSeconds) && session.totalTimeSeconds >= 0)
        .map(session => session.totalTimeSeconds * 1000);
      
      const scores = history
        .filter(h => h.score !== undefined)
        .map(h => h.score!);

      const levelDistribution: { [key: number]: number } = {};
      history.forEach(h => {
        levelDistribution[h.levelNumber] = (levelDistribution[h.levelNumber] || 0) + 1;
      });

      const averageTime = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0;

      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      const performanceTrend = this.calculatePerformanceTrend(history);

      return {
        totalGames: history.length,
        completedGames,
        timedGames: times.length,
        averageTime: Math.round(averageTime),
        bestTime: times.length > 0 ? Math.min(...times) : 0,
        worstTime: times.length > 0 ? Math.max(...times) : 0,
        averageScore: Math.round(averageScore),
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        completionRate: history.length > 0 ? (completedGames / history.length) * 100 : 0,
        levelDistribution,
        performanceTrend
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      return this.getEmptyStatistics();
    }
  }

  /**
   * Get best performance for each level
   */
  async getBestPerformances(userId: string): Promise<{ [key: number]: GamePerformance }> {
    try {
      const history = await this.getHistory(userId);
      const bestPerformances: { [key: number]: GamePerformance } = {};

      history.forEach(performance => {
        const level = performance.levelNumber;
        const existing = bestPerformances[level];

        if (!existing || this.isBetterPerformance(performance, existing)) {
          bestPerformances[level] = performance;
        }
      });

      return bestPerformances;
    } catch (error) {
      console.error('Get best performances error:', error);
      return {};
    }
  }

  /**
   * Clear history for a user
   */
  async clearHistory(userId: string): Promise<boolean> {
    try {
      const historyKey = this.HISTORY_KEY_PREFIX + userId;
      await AsyncStorage.removeItem(historyKey);
      return true;
    } catch (error) {
      console.error('Clear history error:', error);
      return false;
    }
  }

  /**
   * Delete specific performance from history
   */
  async deletePerformance(userId: string, performanceId: string): Promise<boolean> {
    try {
      const historyKey = this.HISTORY_KEY_PREFIX + userId;
      const historyJson = await AsyncStorage.getItem(historyKey);
      
      if (!historyJson) {
        return false;
      }

      let history: GamePerformance[] = JSON.parse(historyJson);
      history = history.filter(h => h.id !== performanceId);

      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Delete performance error:', error);
      return false;
    }
  }

  /**
   * Start a new game session
   */
  async startSession(userId: string): Promise<GameSession> {
    try {
      const session: GameSession = {
        id: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        userId,
        startTime: Date.now(),
        performances: [],
        totalScore: 0,
        completed: false
      };

      const sessionKey = this.SESSION_KEY_PREFIX + userId;
      await AsyncStorage.setItem(sessionKey, JSON.stringify(session));

      return session;
    } catch (error) {
      console.error('Start session error:', error);
      throw error;
    }
  }

  /**
   * End current game session
   */
  async endSession(userId: string): Promise<GameSession | null> {
    try {
      const sessionKey = this.SESSION_KEY_PREFIX + userId;
      const sessionJson = await AsyncStorage.getItem(sessionKey);

      if (!sessionJson) {
        return null;
      }

      const session: GameSession = JSON.parse(sessionJson);
      session.endTime = Date.now();
      session.completed = true;

      await AsyncStorage.setItem(sessionKey, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('End session error:', error);
      return null;
    }
  }

  /**
   * Get current active session
   */
  async getCurrentSession(userId: string): Promise<GameSession | null> {
    try {
      const sessionKey = this.SESSION_KEY_PREFIX + userId;
      const sessionJson = await AsyncStorage.getItem(sessionKey);

      if (!sessionJson) {
        return null;
      }

      return JSON.parse(sessionJson);
    } catch (error) {
      console.error('Get current session error:', error);
      return null;
    }
  }

  /**
   * Add performance to current session
   */
  async addPerformanceToSession(userId: string, performance: GamePerformance): Promise<boolean> {
    try {
      const session = await this.getCurrentSession(userId);
      
      if (!session) {
        return false;
      }

      session.performances.push(performance);
      session.totalScore += performance.score || 0;

      const sessionKey = this.SESSION_KEY_PREFIX + userId;
      await AsyncStorage.setItem(sessionKey, JSON.stringify(session));

      return true;
    } catch (error) {
      console.error('Add performance to session error:', error);
      return false;
    }
  }

  /**
   * Export history data
   */
  async exportHistory(userId: string): Promise<any> {
    try {
      const history = await this.getHistory(userId);
      const statistics = await this.getStatistics(userId);
      const bestPerformances = await this.getBestPerformances(userId);

      return {
        userId,
        history,
        statistics,
        bestPerformances,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Export history error:', error);
      return null;
    }
  }

  /**
   * Import history data
   */
  async importHistory(userId: string, data: any): Promise<boolean> {
    try {
      if (!data.history || !Array.isArray(data.history)) {
        return false;
      }

      const historyKey = this.HISTORY_KEY_PREFIX + userId;
      await AsyncStorage.setItem(historyKey, JSON.stringify(data.history));

      return true;
    } catch (error) {
      console.error('Import history error:', error);
      return false;
    }
  }

  // Private helper methods

  private applyFilters(history: GamePerformance[], filter: HistoryFilter): GamePerformance[] {
    let filtered = [...history];

    if (filter.levelNumber !== undefined) {
      filtered = filtered.filter(h => h.levelNumber === filter.levelNumber);
    }

    if (filter.startDate !== undefined) {
      filtered = filtered.filter(h => h.timestamp >= filter.startDate!);
    }

    if (filter.endDate !== undefined) {
      filtered = filtered.filter(h => h.timestamp <= filter.endDate!);
    }

    if (filter.completed !== undefined) {
      filtered = filtered.filter(h => h.completed === filter.completed);
    }

    return filtered;
  }

  private isBetterPerformance(a: GamePerformance, b: GamePerformance): boolean {
    // Completed is better than not completed
    if (a.completed && !b.completed) return true;
    if (!a.completed && b.completed) return false;

    // If both completed, faster time is better
    if (a.completed && b.completed && a.completionTime && b.completionTime) {
      return a.completionTime < b.completionTime;
    }

    // If scores available, higher score is better
    if (a.score !== undefined && b.score !== undefined) {
      return a.score > b.score;
    }

    return false;
  }

  private calculatePerformanceTrend(history: GamePerformance[]): 'improving' | 'declining' | 'stable' {
    if (history.length < 5) {
      return 'stable';
    }

    // Take last 10 performances
    const recent = history.slice(0, Math.min(10, history.length));
    const scores = recent
      .filter(h => h.score !== undefined)
      .map(h => h.score!);

    if (scores.length < 5) {
      return 'stable';
    }

    // Calculate trend using simple linear regression
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = firstAvg * 0.1; // 10% threshold

    if (difference > threshold) {
      return 'improving';
    } else if (difference < -threshold) {
      return 'declining';
    } else {
      return 'stable';
    }
  }

  private getEmptyStatistics(): HistoryStatistics {
    return {
      totalGames: 0,
      completedGames: 0,
      timedGames: 0,
      averageTime: 0,
      bestTime: 0,
      worstTime: 0,
      averageScore: 0,
      bestScore: 0,
      completionRate: 0,
      levelDistribution: {},
      performanceTrend: 'stable'
    };
  }
}

// Export singleton instance
export default new HistoryManagementService();
