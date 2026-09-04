import axios, { AxiosError, isAxiosError } from 'axios';
import { User } from '../data/userTypes';
import { AIAnalysisResult, CognitiveAnalysis } from '../types/gamePerformance';
import LevelManagementService from './LevelManagementService';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = process.env.EXPO_PUBLIC_OPENROUTER_API_URL || '';
const AI_MODELS = process.env.EXPO_PUBLIC_AI_MODELS || '';
const AI_MODEL = process.env.EXPO_PUBLIC_AI_MODEL || '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = process.env.EXPO_PUBLIC_OPENAI_API_URL || '';
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || '';

interface PerformanceStatistics {
  totalLevels: number;
  uniqueLevels: number;
  avgTime: number;
  avgScore: number;
  fastestCompletion: {
    levelTitle: string;
    timeSpent: number;
  };
  bestScore: {
    levelTitle: string;
    score: number;
  };
  improvementTrend: string;
  totalPlayTime: number;
}

interface APIResponse {
  modelId: string;
  content: string;
  success: boolean;
  error?: string;
  analysis?: Omit<AIAnalysisResult, 'source'>;
  score?: number;
}

class AIAnalysisService {
  private readonly defaultOpenRouterEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly defaultOpenAIEndpoint = 'https://api.openai.com/v1/responses';
  private readonly defaultOpenAIModel = 'gpt-5.5';
  private readonly fallbackOpenRouterModelIds = [
    'openrouter/free',
    'openai/gpt-oss-120b:free',
    'qwen/qwen3-coder:free',
  ];

  async analyzePerformance(
    user: User,
    statistics: PerformanceStatistics,
    localAnalysis: CognitiveAnalysis
  ): Promise<AIAnalysisResult> {
    const prompt = this.buildPrompt(user, statistics, localAnalysis);
    const errors: string[] = [];
    
    try {
      if (this.hasValidOpenRouterKey()) {
        const responses = await this.sendOpenRouterParallelRequests(prompt);
        const bestResponse = this.selectBestResponse(responses);
        const parsed = bestResponse.analysis || this.parseResponse(bestResponse.content);

        if (this.hasAnyAIText(parsed)) {
          return this.mergeWithLocalFallback(
            parsed,
            'openrouter',
            localAnalysis,
            statistics,
            bestResponse.modelId,
            responses.filter(response => response.success).length
          );
        }
      } else {
        errors.push('OpenRouter API key belum dikonfigurasi');
      }
    } catch (error) {
      errors.push(`OpenRouter gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('[AIAnalysisService] OpenRouter analysis failed, trying OpenAI:', error);
    }

    try {
      if (this.hasValidOpenAIKey()) {
        const openAIResponse = await this.sendOpenAIResponseRequest(prompt);
        const parsed = this.parseResponse(openAIResponse);

        if (this.hasAnyAIText(parsed)) {
          return this.mergeWithLocalFallback(parsed, 'openai', localAnalysis, statistics);
        }
      } else {
        errors.push('OpenAI API key belum dikonfigurasi');
      }
    } catch (error) {
      errors.push(`OpenAI gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.log('[AIAnalysisService] OpenAI analysis failed, falling back to local:', error);
    }

    return this.createLocalResult(localAnalysis, statistics, errors.join('; '));
  }

  private hasValidOpenRouterKey(): boolean {
    const key = OPENROUTER_API_KEY?.trim();
    return Boolean(key && key !== 'your_api_key_here');
  }

  private hasValidOpenAIKey(): boolean {
    const key = OPENAI_API_KEY?.trim();
    return Boolean(key && key !== 'your_openai_api_key_here');
  }

  private getOpenRouterModelIds(): string[] {
    const configuredModels = this.parseModelList(AI_MODELS);
    const legacyModels = this.parseModelList(AI_MODEL);
    const modelIds = [
      ...configuredModels,
      ...legacyModels,
      ...this.fallbackOpenRouterModelIds,
    ].filter(modelId => modelId !== 'your_model_here');

    return [...new Set(modelIds)].slice(0, 5);
  }

  private parseModelList(value: string): string[] {
    return value
      .split(/[,\n]/)
      .map(modelId => modelId.trim())
      .filter(Boolean);
  }

  private buildPrompt(
    user: User,
    statistics: PerformanceStatistics,
    localAnalysis: CognitiveAnalysis
  ): string {
    const age = user.age ? `${user.age} tahun` : 'tidak tersedia';
    const height = user.height ? `${user.height} cm` : 'tidak tersedia';
    const bestLevel = statistics.bestScore?.levelTitle || 'belum tersedia';
    const fastestLevel = statistics.fastestCompletion?.levelTitle || 'belum tersedia';
    const totalLevels = LevelManagementService.getTotalLevels();

    return `Anda adalah ahli psikologi perkembangan anak. Buat analisis kognitif singkat namun detail, jelas, dan langsung berdasarkan data berikut:

Data Anak:
- Nama: ${user.name}
- Umur: ${age}
- Tinggi Badan: ${height}

Data Aktivitas Block Design:
- Total level diselesaikan: ${statistics.totalLevels}
- Level unik: ${statistics.uniqueLevels} dari ${totalLevels}
- Rata-rata skor: ${Math.round(statistics.avgScore)} dari 100
- Rata-rata waktu pengerjaan: ${Math.round(statistics.avgTime)} detik
- Total waktu bermain: ${Math.round(statistics.totalPlayTime)} detik
- Level tercepat: ${fastestLevel}
- Skor terbaik: ${bestLevel} dengan skor ${statistics.bestScore?.score ?? 0} dari 100
- Tren performa: ${statistics.improvementTrend}

Skor lokal aplikasi:
- Visual-spatial: ${localAnalysis.visualSpatialScore}/100
- Problem solving: ${localAnalysis.problemSolvingScore}/100
- Kecepatan: ${localAnalysis.speedScore}/100
- Akurasi: ${localAnalysis.accuracyScore}/100
- Skor keseluruhan: ${localAnalysis.overallScore}/100

Gunakan satuan DETIK sesuai data. Jangan mengubahnya menjadi menit.
Jangan gunakan markdown, tanda bintang, bullet, atau penomoran.
Jika umur atau tinggi tidak tersedia, jangan menebak; fokus pada data performa aktivitas.
Gunakan heading persis seperti format berikut:

PENJELASAN:
[4-6 kalimat. Jelaskan kemampuan kognitif anak berdasarkan performa block design, dengan mempertimbangkan level, skor, waktu pengerjaan dalam detik, fokus, ketelitian, dan strategi berpikir. Gunakan bahasa Indonesia natural. Jangan menyebut analisis lokal, sistem, API, atau keterbatasan teknis. Minimal 350 karakter.]

KESIMPULAN:
[2-3 kalimat tentang tingkat perkembangan kognitif berdasarkan data aktivitas. Minimal 120 karakter.]

SARAN:
[2-3 kalimat berisi saran konkret untuk latihan berikutnya. Tambahkan catatan singkat bahwa hasil ini bukan diagnosis klinis. Minimal 120 karakter.]`;
  }

  private async sendOpenRouterParallelRequests(prompt: string): Promise<APIResponse[]> {
    const modelIds = this.getOpenRouterModelIds();
    const requests = modelIds.map(async modelId => {
      try {
        const content = await this.sendOpenRouterRequest(prompt, modelId);
        const analysis = this.parseResponse(content);

        return {
          modelId,
          content,
          success: true,
          analysis,
          score: this.scoreAnalysis(analysis, content),
        };
      } catch (error) {
        return {
          modelId,
          content: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          score: 0,
        };
      }
    });

    return Promise.all(requests);
  }

  private async sendOpenRouterRequest(prompt: string, modelId: string): Promise<string> {
    try {
      const endpoint = OPENROUTER_API_URL?.trim() || this.defaultOpenRouterEndpoint;
      const response = await axios.post(
        endpoint,
        {
          model: modelId,
          max_tokens: 750,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY.trim()}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://logic-block-design.local',
            'X-Title': 'Logic Block Design',
          },
          timeout: 20000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from AI model');
      }

      return content;
    } catch (error) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('timeout: Request exceeded timeout limit');
        }

        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          throw new Error('401: Authentication failed');
        }

        if (!axiosError.response) {
          throw new Error('Network: Unable to connect to API');
        }
      }

      throw error;
    }
  }

  private async sendOpenAIResponseRequest(prompt: string): Promise<string> {
    try {
      const endpoint = OPENAI_API_URL?.trim() || this.defaultOpenAIEndpoint;
      const model = OPENAI_MODEL?.trim() || this.defaultOpenAIModel;
      const response = await axios.post(
        endpoint,
        {
          model,
          instructions: 'Anda adalah ahli psikologi perkembangan anak. Jawab dalam bahasa Indonesia natural dan ikuti format heading yang diminta.',
          input: prompt,
          store: false,
          text: {
            verbosity: 'medium',
          },
          reasoning: {
            effort: 'low',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      const outputText = response.data?.output_text;
      if (typeof outputText === 'string' && outputText.trim()) {
        return outputText;
      }

      const output = response.data?.output;
      if (Array.isArray(output)) {
        const text = output
          .flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
          .map((content: any) => content?.text)
          .filter((textValue: any) => typeof textValue === 'string')
          .join('\n')
          .trim();

        if (text) {
          return text;
        }
      }

      throw new Error('No response content from OpenAI');
    } catch (error) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          throw new Error('timeout: OpenAI request exceeded timeout limit');
        }

        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          throw new Error('401: OpenAI authentication failed');
        }

        if (!axiosError.response) {
          throw new Error('Network: Unable to connect to OpenAI API');
        }
      }

      throw error;
    }
  }

  private selectBestResponse(responses: APIResponse[]): APIResponse {
    const successfulResponses = responses.filter(response => response.success);
    if (successfulResponses.length === 0) {
      const errorSummary = responses
        .map(response => `${response.modelId}: ${response.error || 'gagal tanpa pesan error'}`)
        .join('; ');
      throw new Error(errorSummary || 'No successful AI responses');
    }

    return successfulResponses.reduce((best, current) =>
      (current.score || 0) > (best.score || 0) ? current : best
    );
  }

  private parseResponse(responseText: string): Omit<AIAnalysisResult, 'source'> {
    const normalizedText = responseText.replace(
      /(^|\n|:)[ \t]*(?:\*\*)?[ \t]*(PENJELASAN|KESIMPULAN|SARAN)[ \t]*(?:\*\*)?[ \t]*:/gi,
      (_match, prefix: string, header: string) => `${prefix}${header.toUpperCase()}:`
    );

    const explanation = this.extractSection(normalizedText, 'PENJELASAN:', 'KESIMPULAN:');
    const conclusion = this.extractSection(normalizedText, 'KESIMPULAN:', 'SARAN:');
    const suggestions = this.extractSection(normalizedText, 'SARAN:');

    return {
      explanation: explanation || responseText.trim(),
      conclusion,
      suggestions,
    };
  }

  private extractSection(text: string, startHeader: string, endHeader?: string): string {
    const startIndex = text.toUpperCase().indexOf(startHeader);
    if (startIndex === -1) {
      return '';
    }

    const contentStart = startIndex + startHeader.length;
    const endIndex = endHeader ? text.toUpperCase().indexOf(endHeader, contentStart) : -1;
    const section = endIndex === -1 ? text.substring(contentStart) : text.substring(contentStart, endIndex);

    return section.replace(/\*\*/g, '').trim();
  }

  private isComplete(analysis: Omit<AIAnalysisResult, 'source'>): boolean {
    return (
      analysis.explanation.trim().length >= 100 &&
      analysis.conclusion.trim().length >= 50 &&
      analysis.suggestions.trim().length >= 50
    );
  }

  private scoreAnalysis(analysis: Omit<AIAnalysisResult, 'source'>, rawContent: string): number {
    let score = 0;
    const explanationLength = analysis.explanation.trim().length;
    const conclusionLength = analysis.conclusion.trim().length;
    const suggestionsLength = analysis.suggestions.trim().length;
    const normalizedContent = rawContent.toUpperCase();

    if (this.isComplete(analysis)) {
      score += 40;
    }

    if (explanationLength >= 350) {
      score += 25;
    } else if (explanationLength >= 180) {
      score += 12;
    }

    if (conclusionLength >= 120) {
      score += 15;
    } else if (conclusionLength >= 70) {
      score += 8;
    }

    if (suggestionsLength >= 120) {
      score += 15;
    } else if (suggestionsLength >= 70) {
      score += 8;
    }

    if (
      normalizedContent.includes('PENJELASAN:') &&
      normalizedContent.includes('KESIMPULAN:') &&
      normalizedContent.includes('SARAN:')
    ) {
      score += 15;
    }

    const combinedText = `${analysis.explanation} ${analysis.conclusion} ${analysis.suggestions}`.toLowerCase();
    ['skor', 'level', 'detik', 'visual', 'problem', 'akurasi'].forEach(keyword => {
      if (combinedText.includes(keyword)) {
        score += 3;
      }
    });

    if (/[*#]|^\s*[-\d]+[.)]/m.test(rawContent)) {
      score -= 10;
    }

    if (explanationLength < 80 || conclusionLength < 30 || suggestionsLength < 30) {
      score -= 25;
    }

    return score;
  }

  private hasAnyAIText(analysis: Omit<AIAnalysisResult, 'source'>): boolean {
    return (
      analysis.explanation.trim().length >= 40 ||
      analysis.conclusion.trim().length >= 40 ||
      analysis.suggestions.trim().length >= 40
    );
  }

  private mergeWithLocalFallback(
    aiAnalysis: Omit<AIAnalysisResult, 'source'>,
    source: 'openrouter' | 'openai',
    localAnalysis: CognitiveAnalysis,
    statistics: PerformanceStatistics,
    modelId?: string,
    candidateCount?: number
  ): AIAnalysisResult {
    const localResult = this.createLocalResult(localAnalysis, statistics);

    return {
      source,
      modelId,
      candidateCount,
      explanation: aiAnalysis.explanation.trim() || localResult.explanation,
      conclusion: aiAnalysis.conclusion.trim() || localResult.conclusion,
      suggestions: aiAnalysis.suggestions.trim() || localResult.suggestions,
    };
  }

  private createLocalResult(
    analysis: CognitiveAnalysis,
    statistics: PerformanceStatistics,
    fallbackReason?: string
  ): AIAnalysisResult {
    const strengths = analysis.strengths.length > 0
      ? analysis.strengths.join(', ')
      : 'kemampuan dasar block design mulai terbentuk';
    const improvements = analysis.areasForImprovement.length > 0
      ? analysis.areasForImprovement.join(', ')
      : 'konsistensi latihan dan variasi pola';

    return {
      source: 'local',
      explanation:
        `Berdasarkan ${statistics.totalLevels} level yang sudah diselesaikan, performa menunjukkan skor keseluruhan ${analysis.overallScore}/100. ` +
        `Kemampuan visual-spatial berada pada ${analysis.visualSpatialScore}/100, problem solving ${analysis.problemSolvingScore}/100, kecepatan ${analysis.speedScore}/100, dan akurasi ${analysis.accuracyScore}/100. ` +
        `Kekuatan utama yang terlihat adalah ${strengths}, sementara area yang masih dapat dikembangkan adalah ${improvements}.`,
      conclusion:
        `Performa saat ini menunjukkan kemampuan kognitif yang ${analysis.overallScore >= 70 ? 'baik dan cukup stabil' : 'masih perlu dikuatkan melalui latihan bertahap'}. ` +
        `Kesimpulan ini dibuat dari data permainan yang tersedia dan akan semakin akurat setelah lebih banyak level diselesaikan.`,
      suggestions:
        `${analysis.recommendations.join(' ')} Hasil ini bukan diagnosis klinis, melainkan ringkasan performa latihan untuk membantu memilih aktivitas berikutnya.`,
      fallbackReason,
    };
  }
}

export default new AIAnalysisService();
