// Types untuk menyimpan performa game
export interface LevelPerformance {
  levelId: number;
  levelTitle: string;
  completedAt: string; // ISO date string
  timeSpent: number; // dalam detik
  timeLimit: number; // time limit level dalam detik
  patternsCompleted: number; // jumlah pattern yang diselesaikan
  score: number; // calculated score based on time and accuracy
}

export interface GamePerformanceData {
  userId: string;
  userName: string;
  performances: LevelPerformance[];
  totalLevelsCompleted: number;
  averageTimePerLevel: number;
  totalPlayTime: number; // total waktu bermain dalam detik
  lastPlayedAt: string;
}

export interface GamePerformance {
  id: string;
  userId: string;
  levelNumber: number;
  completed: boolean;
  completionTime?: number; // dalam milidetik
  score?: number;
  timestamp: number;
  patterns?: number;
}

export interface CognitiveAnalysis {
  visualSpatialScore: number; // 0-100
  problemSolvingScore: number; // 0-100
  speedScore: number; // 0-100
  accuracyScore: number; // 0-100
  overallScore: number; // 0-100
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  ageComparison?: string; // perbandingan dengan usia
}

export interface AIAnalysisResult {
  explanation: string;
  conclusion: string;
  suggestions: string;
  source: 'openrouter' | 'openai' | 'local';
  modelId?: string;
  candidateCount?: number;
  fallbackReason?: string;
}
