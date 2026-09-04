/**
 * Scoring Engine
 * Semua rumus skor permainan dikumpulkan di sini.
 */

import { LevelPerformance, GamePerformance } from '../types/gamePerformance';

export interface ScoreInput {
  levelId: number;
  levelTitle: string;
  timeSpent: number;
  timeLimit: number;
  patternsCompleted: number;
  userId: string;
}

export interface ScoreResult {
  score: number;
  timeEfficiency: number;
  levelPerformance: LevelPerformance;
  gamePerformance: GamePerformance;
}

class ScoringEngine {
  calculateScore(
    timeSpent: number,
    timeLimit: number,
    patternsCompleted: number
  ): number {
    const safeTimeLimit = Math.max(1, timeLimit);
    const safeTimeSpent = Math.max(0, timeSpent);
    const safePatternsCompleted = Math.max(1, patternsCompleted);
    const timeEfficiency = (safeTimeSpent / safeTimeLimit) * 100;
    const rawScore = 100 - timeEfficiency + (safePatternsCompleted - 1) * 10;

    return Math.round(Math.max(0, Math.min(100, rawScore)));
  }

  calculateTimeEfficiency(timeSpent: number, timeLimit: number): number {
    return (Math.max(0, timeSpent) / Math.max(1, timeLimit)) * 100;
  }

  createLevelCompletion(input: ScoreInput): ScoreResult {
    const score = this.calculateScore(
      input.timeSpent,
      input.timeLimit,
      input.patternsCompleted
    );

    const levelPerformance: LevelPerformance = {
      levelId: input.levelId,
      levelTitle: input.levelTitle,
      completedAt: new Date().toISOString(),
      timeSpent: input.timeSpent,
      timeLimit: input.timeLimit,
      patternsCompleted: input.patternsCompleted,
      score,
    };

    const gamePerformance: GamePerformance = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: input.userId,
      levelNumber: input.levelId,
      completed: true,
      completionTime: input.timeSpent * 1000,
      score,
      timestamp: Date.now(),
      patterns: input.patternsCompleted,
    };

    return {
      score,
      timeEfficiency: this.calculateTimeEfficiency(input.timeSpent, input.timeLimit),
      levelPerformance,
      gamePerformance,
    };
  }
}

export default new ScoringEngine();
