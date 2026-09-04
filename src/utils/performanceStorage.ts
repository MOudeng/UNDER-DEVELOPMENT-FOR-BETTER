import AsyncStorage from '@react-native-async-storage/async-storage';
import { GamePerformanceData, LevelPerformance } from '../types/gamePerformance';

const PERFORMANCE_KEY = 'gamePerformanceData';

// Simpan performa level yang baru diselesaikan
export const saveLevelPerformance = async (
  userId: string,
  userName: string,
  performance: LevelPerformance
): Promise<void> => {
  try {
    const existingData = await getGamePerformanceData(userId);
    
    const updatedData: GamePerformanceData = {
      userId,
      userName,
      performances: [...(existingData?.performances || []), performance],
      totalLevelsCompleted: (existingData?.totalLevelsCompleted || 0) + 1,
      averageTimePerLevel: 0, // will calculate below
      totalPlayTime: (existingData?.totalPlayTime || 0) + performance.timeSpent,
      lastPlayedAt: new Date().toISOString(),
    };

    // Calculate average time per level
    if (updatedData.performances.length > 0) {
      const totalTime = updatedData.performances.reduce((sum, p) => sum + p.timeSpent, 0);
      updatedData.averageTimePerLevel = totalTime / updatedData.performances.length;
    }

    await AsyncStorage.setItem(
      `${PERFORMANCE_KEY}_${userId}`,
      JSON.stringify(updatedData)
    );
  } catch (error) {
    console.error('Error saving level performance:', error);
  }
};

// Ambil data performa game user
export const getGamePerformanceData = async (
  userId: string
): Promise<GamePerformanceData | null> => {
  try {
    const data = await AsyncStorage.getItem(`${PERFORMANCE_KEY}_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting game performance data:', error);
    return null;
  }
};

// Ambil performa untuk level tertentu
export const getLevelPerformances = async (
  userId: string,
  levelId: number
): Promise<LevelPerformance[]> => {
  try {
    const data = await getGamePerformanceData(userId);
    if (!data) return [];
    
    return data.performances.filter(p => p.levelId === levelId);
  } catch (error) {
    console.error('Error getting level performances:', error);
    return [];
  }
};

// Hapus semua data performa (untuk reset)
export const clearPerformanceData = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${PERFORMANCE_KEY}_${userId}`);
  } catch (error) {
    console.error('Error clearing performance data:', error);
  }
};

// Get statistics untuk analisis
export const getPerformanceStatistics = async (userId: string) => {
  try {
    const data = await getGamePerformanceData(userId);
    if (!data || data.performances.length === 0) {
      return null;
    }

    const performances = data.performances;
    
    // Calculate statistics
    const totalLevels = performances.length;
    const uniqueLevels = new Set(performances.map(p => p.levelId)).size;
    
    const avgTime = performances.reduce((sum, p) => sum + p.timeSpent, 0) / totalLevels;
    const avgScore = performances.reduce((sum, p) => sum + p.score, 0) / totalLevels;
    
    // Find fastest and slowest completion
    const sortedByTime = [...performances].sort((a, b) => a.timeSpent - b.timeSpent);
    const fastestCompletion = sortedByTime[0];
    const slowestCompletion = sortedByTime[sortedByTime.length - 1];
    
    // Find best and worst score
    const sortedByScore = [...performances].sort((a, b) => b.score - a.score);
    const bestScore = sortedByScore[0];
    const worstScore = sortedByScore[sortedByScore.length - 1];
    
    // Calculate improvement trend (compare first 3 vs last 3)
    let improvementTrend = 'stable';
    if (totalLevels >= 6) {
      const firstThree = performances.slice(0, 3);
      const lastThree = performances.slice(-3);
      const firstAvg = firstThree.reduce((sum, p) => sum + p.score, 0) / 3;
      const lastAvg = lastThree.reduce((sum, p) => sum + p.score, 0) / 3;
      
      if (lastAvg > firstAvg * 1.1) improvementTrend = 'improving';
      else if (lastAvg < firstAvg * 0.9) improvementTrend = 'declining';
    }
    
    return {
      totalLevels,
      uniqueLevels,
      avgTime,
      avgScore,
      fastestCompletion,
      slowestCompletion,
      bestScore,
      worstScore,
      improvementTrend,
      totalPlayTime: data.totalPlayTime,
      lastPlayedAt: data.lastPlayedAt,
    };
  } catch (error) {
    console.error('Error getting performance statistics:', error);
    return null;
  }
};
