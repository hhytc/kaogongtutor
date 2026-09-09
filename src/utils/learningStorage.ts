export type ErrorReason =
  | 'read_error'      // 读题粗心漏条件
  | 'relation_error'  // 数量/空间关系理解错
  | 'equation_error'  // 列式/方程转化错误
  | 'calc_error'      // 计算失误
  | 'spatial_error';  // 空间想象偏差

export const ERROR_REASON_LABELS: Record<ErrorReason, string> = {
  read_error: '读题漏看条件',
  relation_error: '数量/空间关系理解错',
  equation_error: '列式/方程转化错误',
  calc_error: '计算失误',
  spatial_error: '空间想象偏差',
};

export interface QuestionRecord {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  hintsUsed: number; // 0 = 独立完成, 1 = 看了关系, 2 = 看了图解, 3 = 看了列式
  errorReason?: ErrorReason;
  timestamp: number;
  attempts: number;
}

export interface LearningStats {
  totalAttempted: number;
  independentCorrect: number; // 首次无提示做对
  hintAssistedCorrect: number; // 借助提示做对
  wrongCount: number;
  errorReasonDistribution: Record<ErrorReason, number>;
}

const STORAGE_KEY = 'kaogong_learning_records_v1';
const ACTIVE_Q_KEY = 'kaogong_quiz_active_id';

export const learningStorage = {
  // Get all records
  getRecords(): Record<string, QuestionRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // Get a single question record
  getRecord(questionId: string): QuestionRecord | null {
    const records = this.getRecords();
    return records[questionId] || null;
  },

  // Save an answer attempt
  saveAttempt(
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean,
    hintsUsed: number,
    errorReason?: ErrorReason
  ): QuestionRecord {
    const records = this.getRecords();
    const existing = records[questionId];

    const updated: QuestionRecord = {
      questionId,
      selectedAnswer,
      isCorrect,
      hintsUsed,
      errorReason: errorReason || existing?.errorReason,
      timestamp: Date.now(),
      attempts: (existing?.attempts || 0) + 1,
    };

    records[questionId] = updated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save learning record:', e);
    }
    return updated;
  },

  // Update error reason for a mistake
  updateErrorReason(questionId: string, reason: ErrorReason) {
    const records = this.getRecords();
    if (records[questionId]) {
      records[questionId].errorReason = reason;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch {}
    }
  },

  // Get learning statistics
  getStats(): LearningStats {
    const records = this.getRecords();
    const stats: LearningStats = {
      totalAttempted: 0,
      independentCorrect: 0,
      hintAssistedCorrect: 0,
      wrongCount: 0,
      errorReasonDistribution: {
        read_error: 0,
        relation_error: 0,
        equation_error: 0,
        calc_error: 0,
        spatial_error: 0,
      },
    };

    Object.values(records).forEach((r) => {
      stats.totalAttempted++;
      if (r.isCorrect) {
        if (r.hintsUsed === 0) {
          stats.independentCorrect++;
        } else {
          stats.hintAssistedCorrect++;
        }
      } else {
        stats.wrongCount++;
        if (r.errorReason && stats.errorReasonDistribution[r.errorReason] !== undefined) {
          stats.errorReasonDistribution[r.errorReason]++;
        }
      }
    });

    return stats;
  },

  // Get list of question IDs that need review (wrong OR used hints)
  getQuestionsNeedingReview(): string[] {
    const records = this.getRecords();
    return Object.values(records)
      .filter((r) => !r.isCorrect || r.hintsUsed > 0)
      .map((r) => r.questionId);
  },

  // Active question ID tracking
  getActiveQuestionId(defaultId: string): string {
    try {
      return localStorage.getItem(ACTIVE_Q_KEY) || defaultId;
    } catch {
      return defaultId;
    }
  },

  setActiveQuestionId(id: string) {
    try {
      localStorage.setItem(ACTIVE_Q_KEY, id);
    } catch {}
  },

  // Export data as JSON string
  exportBackup(): string {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        records: this.getRecords(),
      },
      null,
      2
    );
  },

  // Import data from JSON string
  importBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed.records === 'object') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.records));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // Clear all learning data
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_Q_KEY);
    } catch {}
  },
};
