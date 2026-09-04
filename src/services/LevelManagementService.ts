/**
 * Level Management Service
 * Mengelola data level, level terbuka, level selesai, dan final level.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVELS, Level, BlockPattern } from '../data/levels';

const COMPLETED_LEVELS_KEY = 'completedLevels';

class LevelManagementService {
  getLevels(): Level[] {
    return LEVELS;
  }

  getTotalLevels(): number {
    return LEVELS.length;
  }

  getLevelById(levelId: number): Level | undefined {
    return LEVELS.find(level => level.id === levelId);
  }

  getFinalLevel(): Level | undefined {
    return LEVELS[LEVELS.length - 1];
  }

  isFinalLevel(levelId: number): boolean {
    return levelId === this.getFinalLevel()?.id;
  }

  getRandomPattern(levelId: number): BlockPattern | null {
    const level = this.getLevelById(levelId);
    if (!level?.patterns.length) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * level.patterns.length);
    return level.patterns[randomIndex] || null;
  }

  async getCompletedLevelIds(): Promise<number[]> {
    try {
      const completedLevelsJson = await AsyncStorage.getItem(COMPLETED_LEVELS_KEY);
      const completedLevels = completedLevelsJson ? JSON.parse(completedLevelsJson) : [];
      return Array.isArray(completedLevels) ? completedLevels : [];
    } catch (error) {
      console.error('Error loading completed levels:', error);
      return [];
    }
  }

  async getUnlockedLevelIds(): Promise<number[]> {
    const completedLevels = await this.getCompletedLevelIds();
    const unlocked = [1];

    completedLevels.forEach(levelId => {
      if (!unlocked.includes(levelId)) {
        unlocked.push(levelId);
      }

      if (levelId < LEVELS.length && !unlocked.includes(levelId + 1)) {
        unlocked.push(levelId + 1);
      }
    });

    return unlocked.sort((a, b) => a - b);
  }

  async isLevelUnlocked(levelId: number): Promise<boolean> {
    const unlockedLevels = await this.getUnlockedLevelIds();
    return unlockedLevels.includes(levelId);
  }

  async markLevelCompleted(levelId: number): Promise<number[]> {
    const completedLevels = await this.getCompletedLevelIds();

    if (!completedLevels.includes(levelId)) {
      completedLevels.push(levelId);
      await AsyncStorage.setItem(COMPLETED_LEVELS_KEY, JSON.stringify(completedLevels));
    }

    return completedLevels.sort((a, b) => a - b);
  }

  getLevelColor(index: number): string {
    const colors = [
      '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D',
      '#C780FA', '#FF8C42', '#00D9FF', '#FF5757',
    ];
    return colors[index % colors.length];
  }
}

export default new LevelManagementService();
