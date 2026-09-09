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
  version?: number;
}

export interface QuestionRecord {
  questionId: string;
  questionVersion?: number; // 题目版本号，区分换题/修正题目的作答历史
  selectedAnswer: string;
  isCorrect: boolean;
  hintsUsed: number; // 当前作答使用的提示阶数 (0..3)
  firstAttemptCorrect: boolean | null; // 首次作答是否正确（null 表示旧版无法恢复首次历史；不可篡改历史）
  firstAttemptHints: number | null;    // 首次作答使用提示阶数（null 表示旧版未知）
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
  unknownFirstAttemptCount: number; // 首次情况未知题数（旧数据无法推断首次是否做对）
  masteredCount: number; // 经过复练已掌握题数
  errorReasonDistribution: Record<ErrorReason, number>;
  uncategorizedCount: number; // 尚未打归因标签的错题数
}

export const SPATIAL_INTUITION_STORAGE_KEY = 'kaogong_spatial_intuition_progress';

export interface SavedSpatialIntuitionProgress {
  guidedStep: 1 | 2 | 3 | 4 | 5;
  guidedStep1Found: boolean;
  guidedStep2Answer: string | null;
  guidedStep3Answer: string | null;
  guidedStep4Answer: string | null;
  step5SubQuestion: 1 | 2;
  guidedStep5Q1Answer: string | null;
  step5Q1FirstTryCorrect: boolean | null;
  guidedStep5Q2Answer: string | null;
  step5Q2FirstTryCorrect: boolean | null;
  guidedCompletedSteps: number[];
  netType?: '1-4-1' | '2-3-1' | '2-2-2' | '3-3';
}

function isValidSpatialProgress(obj: any): obj is SavedSpatialIntuitionProgress {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  if (![1, 2, 3, 4, 5].includes(obj.guidedStep)) return false;
  if (![1, 2].includes(obj.step5SubQuestion)) return false;
  if (typeof obj.guidedStep1Found !== 'boolean') return false;
  if (!Array.isArray(obj.guidedCompletedSteps)) return false;
  for (const s of obj.guidedCompletedSteps) {
    if (typeof s !== 'number' || s < 1 || s > 5) return false;
  }
  const stringOrNullFields = ['guidedStep2Answer', 'guidedStep3Answer', 'guidedStep4Answer', 'guidedStep5Q1Answer', 'guidedStep5Q2Answer'];
  for (const f of stringOrNullFields) {
    if (obj[f] !== null && typeof obj[f] !== 'string') return false;
  }
  const boolOrNullFields = ['step5Q1FirstTryCorrect', 'step5Q2FirstTryCorrect'];
  for (const f of boolOrNullFields) {
    if (obj[f] !== null && typeof obj[f] !== 'boolean') return false;
  }
  if (obj.netType !== undefined && !['1-4-1', '2-3-1', '2-2-2', '3-3'].includes(obj.netType)) {
    return false;
  }
  return true;
}

const STORAGE_KEY = 'kaogong_learning_records_v1';
const ACTIVE_Q_KEY = 'kaogong_quiz_active_id';
const HINTS_KEY = 'kaogong_unlocked_hints_v1';

// Migration helper to ensure legacy records are converted safely
function migrateRawRecords(raw: Record<string, any>): { records: Record<string, QuestionRecord>; modified: boolean } {
  let modified = false;
  const migrated: Record<string, QuestionRecord> = {};

  for (const [qid, item] of Object.entries(raw)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const r = { ...item } as Partial<QuestionRecord>;

    const recVersion = typeof r.questionVersion === 'number' && Number.isInteger(r.questionVersion) && r.questionVersion >= 1
      ? r.questionVersion
      : 1;

    // Migrate missing firstAttempt fields from legacy records
    const hasValidFirstAttempt = typeof r.firstAttemptCorrect === 'boolean' || r.firstAttemptCorrect === null;
    if (!hasValidFirstAttempt) {
      if (Array.isArray(r.history) && r.history.length > 0) {
        r.firstAttemptCorrect = r.history[0].isCorrect;
        r.firstAttemptHints = typeof r.history[0].hintsUsed === 'number' ? r.history[0].hintsUsed : 0;
      } else if (typeof r.attempts === 'number' && r.attempts > 1) {
        // Legacy record with multiple attempts but lost history -> mark as unknown (null), cannot synthesize
        r.firstAttemptCorrect = null;
        r.firstAttemptHints = null;
      } else {
        // Single attempt legacy record -> can reliably recover from current record
        r.firstAttemptCorrect = typeof r.isCorrect === 'boolean' ? r.isCorrect : false;
        r.firstAttemptHints = typeof r.hintsUsed === 'number' ? r.hintsUsed : 0;
      }
      modified = true;
    }
    if (r.firstAttemptCorrect !== null && typeof r.firstAttemptHints !== 'number') {
      r.firstAttemptHints = typeof r.hintsUsed === 'number' ? r.hintsUsed : 0;
      modified = true;
    }
    if (!Array.isArray(r.history)) {
      r.history = r.selectedAnswer
        ? [
            {
              answer: r.selectedAnswer,
              isCorrect: Boolean(r.isCorrect),
              hintsUsed: typeof r.hintsUsed === 'number' ? r.hintsUsed : 0,
              timestamp: r.timestamp || Date.now(),
              version: recVersion,
            },
          ]
        : [];
      modified = true;
    } else {
      // Ensure existing history items have explicit versions assigned
      for (const h of r.history) {
        if (h && typeof h === 'object' && typeof h.version !== 'number') {
          h.version = recVersion;
          modified = true;
        }
      }
    }
    if (typeof r.attempts !== 'number' || r.attempts < 1) {
      r.attempts = r.history.length || (r.selectedAnswer ? 1 : 0);
      modified = true;
    }

    migrated[qid] = {
      questionId: qid,
      questionVersion: recVersion,
      selectedAnswer: typeof r.selectedAnswer === 'string' ? r.selectedAnswer : '',
      isCorrect: Boolean(r.isCorrect),
      hintsUsed: typeof r.hintsUsed === 'number' ? r.hintsUsed : 0,
      firstAttemptCorrect: r.firstAttemptCorrect !== undefined ? r.firstAttemptCorrect : null,
      firstAttemptHints: r.firstAttemptHints ?? null,
      isMastered: Boolean(r.isMastered),
      errorReason: r.errorReason,
      timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now(),
      attempts: r.attempts,
      history: r.history,
    };
  }

  return { records: migrated, modified };
}

export const learningStorage = {
  // Get all records with automatic legacy migration
  getRecords(): Record<string, QuestionRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const { records, modified } = migrateRawRecords(parsed);
        if (modified) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
          } catch {}
        }
        return records;
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
    errorReason?: ErrorReason,
    questionVersion: number = 1
  ): QuestionRecord {
    const records = this.getRecords();
    const existing = records[questionId];
    const isVersionMatch = Boolean(existing && (existing.questionVersion || 1) === questionVersion);

    const historyItem: AttemptHistoryItem = {
      answer: selectedAnswer,
      isCorrect,
      hintsUsed,
      timestamp: Date.now(),
      version: questionVersion,
    };

    // Keep ALL history across all versions intact - never overwrite historical attempts
    const fullHistory = [...(existing?.history || []), historyItem];

    // Filter history specifically for the current questionVersion
    const currentVersionHistory = fullHistory.filter((h) => (h.version || 1) === questionVersion);

    let firstAttemptCorrect: boolean | null;
    let firstAttemptHints: number | null;
    let attempts: number;

    if (isVersionMatch) {
      // Prior attempts exist for this version if attempts > 0 or selectedAnswer was present or firstAttemptCorrect is defined
      const hasPriorAttempts = Boolean(
        (existing.attempts && existing.attempts > 0) ||
        existing.selectedAnswer ||
        existing.firstAttemptCorrect !== undefined
      );

      if (hasPriorAttempts) {
        // Redo for the same version: ALWAYS retain original first-attempt fields!
        firstAttemptCorrect = existing.firstAttemptCorrect !== undefined ? existing.firstAttemptCorrect : null;
        firstAttemptHints = existing.firstAttemptHints !== undefined ? existing.firstAttemptHints : null;
        attempts = Math.max((existing.attempts || 0) + 1, currentVersionHistory.length);
      } else {
        // Very first attempt for this version
        firstAttemptCorrect = isCorrect;
        firstAttemptHints = hintsUsed;
        attempts = 1;
      }
    } else {
      // Version does not match existing record (e.g. existing was v1, now answering v2)
      // Check if this version has any prior history in fullHistory (excluding the item we just added)
      const priorHistoryForVersion = (existing?.history || []).filter((h) => (h.version || 1) === questionVersion);
      if (priorHistoryForVersion.length > 0) {
        // Was attempted before in an earlier session for this version
        firstAttemptCorrect = priorHistoryForVersion[0].isCorrect;
        firstAttemptHints = priorHistoryForVersion[0].hintsUsed;
        attempts = priorHistoryForVersion.length + 1;
      } else {
        // Genuine first attempt for this new version!
        firstAttemptCorrect = isCorrect;
        firstAttemptHints = hintsUsed;
        attempts = 1;
      }
    }

    const updated: QuestionRecord = {
      questionId,
      questionVersion,
      selectedAnswer,
      isCorrect,
      hintsUsed,
      firstAttemptCorrect,
      firstAttemptHints,
      isMastered: isCorrect && isVersionMatch && Boolean(existing?.isMastered),
      errorReason: errorReason !== undefined ? errorReason : (isVersionMatch ? existing?.errorReason : undefined),
      timestamp: Date.now(),
      attempts,
      history: fullHistory,
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
  markMastered(questionId: string, questionVersion?: number): boolean {
    const records = this.getRecords();
    const existing = records[questionId];
    if (existing) {
      if (questionVersion && (existing.questionVersion || 1) !== questionVersion) {
        // Reject cross-version alteration of existing record
        return false;
      }
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
      existing.hintsUsed = 0; // Reset hintsUsed for fresh attempt
      existing.isMastered = false;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch {}
      this.clearUnlockedHint(questionId, existing.questionVersion);
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
      unknownFirstAttemptCount: 0,
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

        if (r.firstAttemptCorrect === true) {
          if (r.firstAttemptHints === 0) {
            stats.independentCorrect++;
          } else {
            stats.hintAssistedCorrect++;
          }
        } else if (r.firstAttemptCorrect === false) {
          stats.wrongCount++;
          if (r.errorReason && stats.errorReasonDistribution[r.errorReason] !== undefined) {
            stats.errorReasonDistribution[r.errorReason]++;
          } else {
            stats.uncategorizedCount++;
          }
        } else {
          // Unknown legacy record (firstAttemptCorrect === null):
          // Record as unknown, do NOT assume it was correct or wrong on first attempt!
          stats.unknownFirstAttemptCount++;
          // Only attribute to uncategorized if it is currently wrong (an actual wrong answer)
          if (!r.isCorrect) {
            if (r.errorReason && stats.errorReasonDistribution[r.errorReason] !== undefined) {
              stats.errorReasonDistribution[r.errorReason]++;
            } else {
              stats.uncategorizedCount++;
            }
          }
        }
      }
    });

    return stats;
  },

  // Get list of question IDs that need review (wrong on first attempt OR used hints, and not yet mastered)
  getQuestionsNeedingReview(questionVersions?: Record<string, number>): string[] {
    const records = this.getRecords();
    return Object.values(records)
      .filter((r) => {
        if (questionVersions && questionVersions[r.questionId] !== undefined) {
          if ((r.questionVersion || 1) !== questionVersions[r.questionId]) {
            return false;
          }
        }
        if (r.isMastered) return false;
        // Needs review if current answer is wrong OR first attempt wasn't independent correct
        if (!r.isCorrect) return true;
        if (r.firstAttemptCorrect === false) return true;
        if (typeof r.firstAttemptHints === 'number' && r.firstAttemptHints > 0) return true;
        if (r.firstAttemptCorrect === null && r.hintsUsed > 0) return true;
        return false;
      })
      .map((r) => r.questionId);
  },

  // Persistent unlocked hints isolated by question version
  getUnlockedHints(): Record<string, number> {
    try {
      const data = localStorage.getItem(HINTS_KEY);
      if (!data) return {};
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const clean: Record<string, number> = {};
        let needsMigration = false;
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 3) {
            if (k.includes('_v')) {
              clean[k] = v;
            } else {
              // Legacy unversioned key "qid": migrate to "qid_v1"
              clean[`${k}_v1`] = Math.max(clean[`${k}_v1`] || 0, v);
              needsMigration = true;
            }
          }
        }
        if (needsMigration) {
          try {
            localStorage.setItem(HINTS_KEY, JSON.stringify(clean));
          } catch {}
        }
        return clean;
      }
      return {};
    } catch {
      return {};
    }
  },

  saveUnlockedHint(versionedKey: string, level: number) {
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > 3) return;
    const hints = this.getUnlockedHints();
    hints[versionedKey] = Math.max(hints[versionedKey] || 0, level);
    try {
      localStorage.setItem(HINTS_KEY, JSON.stringify(hints));
    } catch {}
  },

  clearUnlockedHint(questionIdOrKey: string, version?: number) {
    const hints = this.getUnlockedHints();
    let changed = false;
    if (hints[questionIdOrKey] !== undefined) {
      delete hints[questionIdOrKey];
      changed = true;
    }
    if (version !== undefined) {
      const vKey = `${questionIdOrKey}_v${version}`;
      if (hints[vKey] !== undefined) {
        delete hints[vKey];
        changed = true;
      }
    }
    const prefix = `${questionIdOrKey}_v`;
    for (const k of Object.keys(hints)) {
      if (k.startsWith(prefix)) {
        delete hints[k];
        changed = true;
      }
    }
    if (changed) {
      try {
        localStorage.setItem(HINTS_KEY, JSON.stringify(hints));
      } catch {}
    }
  },

  // Spatial intuition progress methods
  getSpatialIntuitionProgress(): SavedSpatialIntuitionProgress | null {
    try {
      const data = localStorage.getItem(SPATIAL_INTUITION_STORAGE_KEY);
      if (!data) return null;
      const parsed = JSON.parse(data);
      if (isValidSpatialProgress(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  },

  saveSpatialIntuitionProgress(progress: SavedSpatialIntuitionProgress) {
    if (!isValidSpatialProgress(progress)) return;
    try {
      localStorage.setItem(SPATIAL_INTUITION_STORAGE_KEY, JSON.stringify(progress));
    } catch {}
  },

  clearSpatialIntuitionProgress() {
    try {
      localStorage.removeItem(SPATIAL_INTUITION_STORAGE_KEY);
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
        version: 1,
        exportedAt: new Date().toISOString(),
        records: this.getRecords(),
        unlockedHints: this.getUnlockedHints(),
        spatialIntuitionProgress: this.getSpatialIntuitionProgress(),
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

      // Validate version if present
      if (parsed.version !== undefined && (typeof parsed.version !== 'number' || parsed.version < 1)) {
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
        if (r.questionId !== undefined && r.questionId !== qid) return false;
        if (typeof r.isCorrect !== 'boolean') return false;
        if (typeof r.hintsUsed !== 'number' || !Number.isInteger(r.hintsUsed) || r.hintsUsed < 0 || r.hintsUsed > 3) return false;
        if (typeof r.selectedAnswer !== 'string') return false;

        // Validate errorReason if present
        if (r.errorReason !== undefined && !(r.errorReason in ERROR_REASON_LABELS)) {
          return false;
        }

        // Validate history items if present
        const validatedHistory: AttemptHistoryItem[] = [];
        if (r.history !== undefined) {
          if (!Array.isArray(r.history)) return false;
          for (const h of r.history) {
            if (!h || typeof h !== 'object' || Array.isArray(h)) return false;
            if (typeof h.answer !== 'string') return false;
            if (typeof h.isCorrect !== 'boolean') return false;
            if (typeof h.hintsUsed !== 'number' || !Number.isInteger(h.hintsUsed) || h.hintsUsed < 0 || h.hintsUsed > 3) return false;
            if (typeof h.timestamp !== 'number') return false;
            if (h.version !== undefined && (typeof h.version !== 'number' || h.version < 1)) return false;
            validatedHistory.push(h);
          }
        }

        // Validate or migrate firstAttemptCorrect
        let firstAttemptCorrect: boolean | null;
        if (typeof r.firstAttemptCorrect === 'boolean') {
          firstAttemptCorrect = r.firstAttemptCorrect;
        } else if (r.firstAttemptCorrect === null) {
          firstAttemptCorrect = null;
        } else if (validatedHistory.length > 0) {
          firstAttemptCorrect = validatedHistory[0].isCorrect;
        } else if (typeof r.attempts === 'number' && r.attempts > 1) {
          firstAttemptCorrect = null;
        } else {
          firstAttemptCorrect = r.isCorrect;
        }

        // Validate or migrate firstAttemptHints
        let firstAttemptHints: number | null;
        if (typeof r.firstAttemptHints === 'number' && Number.isInteger(r.firstAttemptHints) && r.firstAttemptHints >= 0 && r.firstAttemptHints <= 3) {
          firstAttemptHints = r.firstAttemptHints;
        } else if (r.firstAttemptHints === null || firstAttemptCorrect === null) {
          firstAttemptHints = null;
        } else if (validatedHistory.length > 0) {
          firstAttemptHints = validatedHistory[0].hintsUsed;
        } else {
          firstAttemptHints = r.hintsUsed;
        }

        validatedRecords[qid] = {
          questionId: qid,
          questionVersion: typeof r.questionVersion === 'number' && Number.isInteger(r.questionVersion) && r.questionVersion >= 1 ? r.questionVersion : 1,
          selectedAnswer: r.selectedAnswer,
          isCorrect: r.isCorrect,
          hintsUsed: r.hintsUsed,
          firstAttemptCorrect,
          firstAttemptHints,
          isMastered: Boolean(r.isMastered),
          errorReason: r.errorReason,
          timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now(),
          attempts: typeof r.attempts === 'number' && Number.isInteger(r.attempts) && r.attempts > 0 ? r.attempts : 1,
          history: validatedHistory,
        };
      }

      // Validate unlockedHints container strictly (reject objects or invalid numbers)
      const validatedHints: Record<string, number> = {};
      if (parsed.unlockedHints !== undefined) {
        if (!parsed.unlockedHints || typeof parsed.unlockedHints !== 'object' || Array.isArray(parsed.unlockedHints)) {
          return false;
        }
        for (const [qid, val] of Object.entries(parsed.unlockedHints)) {
          if (!qid || typeof qid !== 'string') return false;
          if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 3) {
            return false;
          }
          validatedHints[qid] = val;
        }
      }

      // Validate spatialIntuitionProgress container if present
      let validatedSpatial: SavedSpatialIntuitionProgress | null = null;
      if (parsed.spatialIntuitionProgress !== undefined && parsed.spatialIntuitionProgress !== null) {
        if (!isValidSpatialProgress(parsed.spatialIntuitionProgress)) {
          return false;
        }
        validatedSpatial = parsed.spatialIntuitionProgress;
      }

      // Snapshot previous state for atomic rollback if quota exceeded or write fails
      const prevStorage = localStorage.getItem(STORAGE_KEY);
      const prevHints = localStorage.getItem(HINTS_KEY);
      const prevSpatial = localStorage.getItem(SPATIAL_INTUITION_STORAGE_KEY);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validatedRecords));
        if (parsed.unlockedHints !== undefined) {
          localStorage.setItem(HINTS_KEY, JSON.stringify(validatedHints));
        }
        if (validatedSpatial !== null) {
          localStorage.setItem(SPATIAL_INTUITION_STORAGE_KEY, JSON.stringify(validatedSpatial));
        }
        return true;
      } catch {
        // Strict rollback on storage write error
        if (prevStorage !== null) {
          localStorage.setItem(STORAGE_KEY, prevStorage);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
        if (prevHints !== null) {
          localStorage.setItem(HINTS_KEY, prevHints);
        } else {
          localStorage.removeItem(HINTS_KEY);
        }
        if (prevSpatial !== null) {
          localStorage.setItem(SPATIAL_INTUITION_STORAGE_KEY, prevSpatial);
        } else {
          localStorage.removeItem(SPATIAL_INTUITION_STORAGE_KEY);
        }
        return false;
      }
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
      localStorage.removeItem(SPATIAL_INTUITION_STORAGE_KEY);
    } catch {}
  },
};
