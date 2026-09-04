/**
 * Analytics Engine
 * Rumus analisis kognitif lokal dikumpulkan di sini.
 */

import { CognitiveAnalysis } from '../types/gamePerformance';
import LevelManagementService from './LevelManagementService';

export interface PerformanceStatistics {
  totalLevels: number;
  uniqueLevels: number;
  avgTime: number;
  avgScore: number;
  fastestCompletion: {
    levelTitle: string;
    timeSpent: number;
  };
  slowestCompletion?: {
    levelTitle: string;
    timeSpent: number;
  };
  bestScore: {
    levelTitle: string;
    score: number;
  };
  worstScore?: {
    levelTitle: string;
    score: number;
  };
  improvementTrend: string;
  totalPlayTime: number;
  lastPlayedAt?: string;
}

class AnalyticsEngine {
  createEmptyStatistics(): PerformanceStatistics {
    return {
      totalLevels: 0,
      uniqueLevels: 0,
      avgTime: 0,
      avgScore: 0,
      fastestCompletion: {
        levelTitle: 'Belum ada level selesai',
        timeSpent: 0,
      },
      slowestCompletion: {
        levelTitle: 'Belum ada level selesai',
        timeSpent: 0,
      },
      bestScore: {
        levelTitle: 'Belum ada level selesai',
        score: 0,
      },
      worstScore: {
        levelTitle: 'Belum ada level selesai',
        score: 0,
      },
      improvementTrend: 'stable',
      totalPlayTime: 0,
      lastPlayedAt: new Date().toISOString(),
    };
  }

  generateCognitiveAnalysis(stats: PerformanceStatistics): CognitiveAnalysis {
    const totalLevels = LevelManagementService.getTotalLevels();
    const visualSpatialScore = Math.min(100, stats.avgScore || 0);
    const problemSolvingScore = Math.min(100, (stats.uniqueLevels / totalLevels) * 100);
    const avgTimeRatio = stats.avgTime > 0 ? stats.avgTime / 120 : 1;
    const speedScore = stats.totalLevels > 0
      ? Math.max(0, Math.min(100, (1 - avgTimeRatio) * 100 + 50))
      : 0;
    const accuracyScore = stats.bestScore?.score || 0;
    const overallScore = Math.round(
      (visualSpatialScore * 0.3) +
      (problemSolvingScore * 0.25) +
      (speedScore * 0.25) +
      (accuracyScore * 0.2)
    );

    const strengths: string[] = [];
    if (visualSpatialScore >= 75) strengths.push('Kemampuan visual-spatial yang baik');
    if (speedScore >= 75) strengths.push('Kecepatan berpikir yang tinggi');
    if (accuracyScore >= 75) strengths.push('Akurasi dan ketelitian yang baik');
    if (stats.improvementTrend === 'improving') strengths.push('Menunjukkan peningkatan konsisten');
    if (stats.uniqueLevels >= 5) strengths.push('Kemampuan adaptasi yang baik');
    if (stats.totalLevels === 0) strengths.push('Siap memulai pengukuran kemampuan block design');

    const areasForImprovement: string[] = [];
    if (visualSpatialScore < 60) areasForImprovement.push('Pemahaman pola visual');
    if (speedScore < 60) areasForImprovement.push('Kecepatan pemrosesan informasi');
    if (accuracyScore < 60) areasForImprovement.push('Ketelitian dalam menyelesaikan tugas');
    if (stats.improvementTrend === 'declining') areasForImprovement.push('Konsistensi performa');
    if (stats.uniqueLevels < 3) areasForImprovement.push('Eksplorasi berbagai jenis pola');

    const recommendations: string[] = [];
    if (visualSpatialScore < 70) {
      recommendations.push('Latih kemampuan visual-spatial dengan puzzle dan permainan konstruksi');
    }
    if (speedScore < 70) {
      recommendations.push('Praktikkan latihan dengan batasan waktu untuk meningkatkan kecepatan');
    }
    if (stats.uniqueLevels < 5) {
      recommendations.push('Coba selesaikan lebih banyak level untuk mengembangkan kemampuan');
    }
    if (stats.improvementTrend === 'stable' || stats.improvementTrend === 'declining') {
      recommendations.push('Lakukan latihan rutin untuk meningkatkan konsistensi');
    }
    recommendations.push('Terus berlatih secara teratur untuk hasil optimal');

    return {
      visualSpatialScore: Math.round(visualSpatialScore),
      problemSolvingScore: Math.round(problemSolvingScore),
      speedScore: Math.round(speedScore),
      accuracyScore: Math.round(accuracyScore),
      overallScore,
      strengths,
      areasForImprovement,
      recommendations,
    };
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  }

  getScoreLabel(score: number): string {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Baik';
    if (score >= 40) return 'Cukup';
    return 'Perlu Ditingkatkan';
  }
}

export default new AnalyticsEngine();
