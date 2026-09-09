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

export interface AttemptHistoryItem {
  answer: string;
  isCorrect: boolean;
  hintsUsed: number;
  timestamp: number;
}

export interface QuestionRecord {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  hintsUsed: number; // 当前作答使用的提示阶数 (0..3)
  firstAttemptCorrect: boolean; // 首次作答是否正确（不可篡改历史）
  firstAttemptHints: number;    // 首次作答使用提示阶数
  isMastered?: boolean;         // 是否被考生手动标记为已攻克掌握（移出错题队列，不破坏首次数据）
  errorReason?: ErrorReason;
  timestamp: number;
  attempts: number;
  history: AttemptHistoryItem[];
}

export interface LearningStats {
  totalAttempted: number;
  independentCorrect: number; // 首次无提示独立做对
  hintAssistedCorrect: number; // 首次借助提示做对
  wrongCount: number; // 首次未做对题数
  masteredCount: number; // 经过复练已掌握题数
  errorReasonDistribution: Record<ErrorReason, number>;
  uncategorizedCount: number; // 尚未打归因标签的错题数
}

const STORAGE_KEY = 'kaogong_learning_records_v1';
const ACTIVE_Q_KEY = 'kaogong_quiz_active_id';
const HINTS_KEY = 'kaogong_unlocked_hints_v1';

export const learningStorage = {
  // Get all records
  getRecords(): Record<string, QuestionRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      return {};
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

    const isFirstAttempt = !existing || existing.attempts === 0;
    const firstAttemptCorrect = isFirstAttempt ? isCorrect : (existing.firstAttemptCorrect ?? isCorrect);
    const firstAttemptHints = isFirstAttempt ? hintsUsed : (existing.firstAttemptHints ?? hintsUsed);

    const historyItem: AttemptHistoryItem = {
      answer: selectedAnswer,
      isCorrect,
      hintsUsed,
      timestamp: Date.now(),
    };

    const updated: QuestionRecord = {
      questionId,
      selectedAnswer,
      isCorrect,
      hintsUsed,
      firstAttemptCorrect,
      firstAttemptHints,
      isMastered: isCorrect && existing?.isMastered ? true : false,
      errorReason: errorReason !== undefined ? errorReason : existing?.errorReason,
      timestamp: Date.now(),
      attempts: (existing?.attempts || 0) + 1,
      history: [...(existing?.history || []), historyItem],
    };

    records[questionId] = updated;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save learning record:', e);
    }
    return updated;
  },

  // Mark a question as mastered (removes from review queue without rewriting first-attempt history)
  markMastered(questionId: string): boolean {
    const records = this.getRecords();
    const existing = records[questionId];
    if (existing) {
      existing.isMastered = true;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return true;
      } catch {}
    }
    return false;
  },

  // Prepare a question for reattempt (clears current selection while preserving attempt history)
  clearCurrentForReattempt(questionId: string): QuestionRecord | null {
    const records = this.getRecords();
    const existing = records[questionId];
    if (existing) {
      existing.selectedAnswer = '';
      existing.isMastered = false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch {}
      this.clearUnlockedHint(questionId);
      return existing;
    }
    return null;
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
      masteredCount: 0,
      uncategorizedCount: 0,
      errorReasonDistribution: {
        read_error: 0,
        relation_error: 0,
        equation_error: 0,
        calc_error: 0,
        spatial_error: 0,
      },
    };

    Object.values(records).forEach((r) => {
      // Must have attempted at least once
      if (r.attempts > 0 || r.selectedAnswer) {
        stats.totalAttempted++;
        if (r.isMastered) {
          stats.masteredCount++;
        }

        if (r.firstAttemptCorrect) {
          if (r.firstAttemptHints === 0) {
            stats.independentCorrect++;
          } else {
            stats.hintAssistedCorrect++;
          }
        } else {
          stats.wrongCount++;
          if (r.errorReason && stats.errorReasonDistribution[r.errorReason] !== undefined) {
            stats.errorReasonDistribution[r.errorReason]++;
          } else {
            stats.uncategorizedCount++;
          }
        }
      }
    });

    return stats;
  },

  // Get list of question IDs that need review (wrong on first attempt OR used hints, and not yet mastered)
  getQuestionsNeedingReview(): string[] {
    const records = this.getRecords();
    return Object.values(records)
      .filter((r) => {
        if (r.isMastered) return false;
        // Needs review if current answer is wrong OR first attempt wasn't independent correct
        return !r.isCorrect || !r.firstAttemptCorrect || r.firstAttemptHints > 0;
      })
      .map((r) => r.questionId);
  },

  // Persistent unlocked hints (so hints aren't lost when switching tabs or jumping to 3D)
  getUnlockedHints(): Record<string, number> {
    try {
      const data = localStorage.getItem(HINTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveUnlockedHint(questionId: string, level: number) {
    const hints = this.getUnlockedHints();
    hints[questionId] = Math.max(hints[questionId] || 0, level);
    try {
      localStorage.setItem(HINTS_KEY, JSON.stringify(hints));
    } catch {}
  },

  clearUnlockedHint(questionId: string) {
    const hints = this.getUnlockedHints();
    delete hints[questionId];
    try {
      localStorage.setItem(HINTS_KEY, JSON.stringify(hints));
    } catch {}
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
        version: 2,
        exportedAt: new Date().toISOString(),
        records: this.getRecords(),
        unlockedHints: this.getUnlockedHints(),
      },
      null,
      2
    );
  },

  // Import data with comprehensive schema and field validation
  importBackup(jsonString: string): boolean {
    try {
      if (typeof jsonString !== 'string' || !jsonString.trim()) return false;
      const parsed = JSON.parse(jsonString);

      // Validate root object
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return false;
      }

      // Validate records container
      if (!parsed.records || typeof parsed.records !== 'object' || Array.isArray(parsed.records)) {
        return false;
      }

      const validatedRecords: Record<string, QuestionRecord> = {};

      for (const [qid, rec] of Object.entries(parsed.records)) {
        if (!qid || typeof qid !== 'string') return false;
        if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return false;

        const r = rec as Partial<QuestionRecord>;
        if (typeof r.isCorrect !== 'boolean') return false;
        if (typeof r.hintsUsed !== 'number') return false;
        if (typeof r.selectedAnswer !== 'string') return false;

        validatedRecords[qid] = {
          questionId: qid,
          selectedAnswer: r.selectedAnswer,
          isCorrect: r.isCorrect,
          hintsUsed: r.hintsUsed,
          firstAttemptCorrect: typeof r.firstAttemptCorrect === 'boolean' ? r.firstAttemptCorrect : r.isCorrect,
          firstAttemptHints: typeof r.firstAttemptHints === 'number' ? r.firstAttemptHints : r.hintsUsed,
          isMastered: Boolean(r.isMastered),
          errorReason: r.errorReason,
          timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now(),
          attempts: typeof r.attempts === 'number' && r.attempts > 0 ? r.attempts : 1,
          history: Array.isArray(r.history) ? r.history : [],
        };
      }

      // If all valid, save safely
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedRecords));

      if (parsed.unlockedHints && typeof parsed.unlockedHints === 'object' && !Array.isArray(parsed.unlockedHints)) {
        localStorage.setItem(HINTS_KEY, JSON.stringify(parsed.unlockedHints));
      }

      return true;
    } catch {
      return false;
    }
  },

  // Clear all learning data
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_Q_KEY);
      localStorage.removeItem(HINTS_KEY);
    } catch {}
  },
};
