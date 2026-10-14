export const SPATIAL_ASSESSMENTS_STORAGE_KEY = 'kaogong_spatial_assessments_v1';
export const MAX_SPATIAL_ASSESSMENTS = 20;

export interface AssessmentQuestionResult {
  questionId: string;
  answer: string | null;
  correctAnswer: string;
  isCorrect: boolean | null;
  /** True when this question has not appeared in an earlier completed timed test. */
  firstTest: boolean;
  /** Whether the learner already answered this question in the ordinary practice flow. */
  practicedBefore: boolean;
  secondsSpent: number;
}

export interface SpatialAssessment {
  id: string;
  startedAt: number;
  finishedAt: number;
  category: string;
  sourceFilter: 'guokao' | 'original' | 'mixed';
  timeLimitSeconds: number;
  elapsedSeconds: number;
  questions: AssessmentQuestionResult[];
}

interface AssessmentState {
  version: 1;
  history: SpatialAssessment[];
  /** Kept separately from the last-20 history so repeat labels remain stable. */
  seenQuestionIds: string[];
}

const EMPTY_STATE: AssessmentState = { version: 1, history: [], seenQuestionIds: [] };
let memoryState: AssessmentState = EMPTY_STATE;

function isValidQuestionResult(value: unknown): value is AssessmentQuestionResult {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssessmentQuestionResult>;
  return typeof item.questionId === 'string' &&
    (typeof item.answer === 'string' || item.answer === null) &&
    typeof item.correctAnswer === 'string' &&
    (typeof item.isCorrect === 'boolean' || item.isCorrect === null) &&
    typeof item.firstTest === 'boolean' &&
    typeof item.practicedBefore === 'boolean' &&
    typeof item.secondsSpent === 'number' && Number.isFinite(item.secondsSpent);
}

function isValidAssessment(value: unknown): value is SpatialAssessment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SpatialAssessment>;
  return typeof item.id === 'string' &&
    typeof item.startedAt === 'number' &&
    typeof item.finishedAt === 'number' &&
    typeof item.category === 'string' &&
    ['guokao', 'original', 'mixed'].includes(item.sourceFilter || '') &&
    typeof item.timeLimitSeconds === 'number' &&
    typeof item.elapsedSeconds === 'number' &&
    Array.isArray(item.questions) && item.questions.every(isValidQuestionResult);
}

function readState(): AssessmentState {
  try {
    const raw = localStorage.getItem(SPATIAL_ASSESSMENTS_STORAGE_KEY);
    if (!raw) return memoryState;
    const parsed = JSON.parse(raw) as Partial<AssessmentState>;
    if (parsed.version !== 1 || !Array.isArray(parsed.history)) return memoryState;
    const history = parsed.history.filter(isValidAssessment).slice(-MAX_SPATIAL_ASSESSMENTS);
    const fromHistory = history.flatMap((item) => item.questions.map((question) => question.questionId));
    const seenQuestionIds = Array.isArray(parsed.seenQuestionIds)
      ? parsed.seenQuestionIds.filter((id): id is string => typeof id === 'string')
      : fromHistory;
    memoryState = { version: 1, history, seenQuestionIds: Array.from(new Set([...seenQuestionIds, ...fromHistory])) };
    return memoryState;
  } catch {
    return memoryState;
  }
}

function writeState(state: AssessmentState): boolean {
  memoryState = state;
  try {
    localStorage.setItem(SPATIAL_ASSESSMENTS_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export const assessmentStorage = {
  getHistory(): SpatialAssessment[] {
    return readState().history;
  },

  getSeenQuestionIds(): Set<string> {
    return new Set(readState().seenQuestionIds);
  },

  saveAssessment(assessment: Omit<SpatialAssessment, 'id'>): { assessment: SpatialAssessment; persisted: boolean } {
    const state = readState();
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `spatial-${assessment.finishedAt}-${Math.random().toString(36).slice(2, 9)}`;
    const saved: SpatialAssessment = { ...assessment, id };
    const next: AssessmentState = {
      version: 1,
      history: [...state.history, saved].slice(-MAX_SPATIAL_ASSESSMENTS),
      seenQuestionIds: Array.from(new Set([
        ...state.seenQuestionIds,
        ...saved.questions.map((question) => question.questionId),
      ])),
    };
    return { assessment: saved, persisted: writeState(next) };
  },

  clear(): boolean {
    memoryState = EMPTY_STATE;
    try {
      localStorage.removeItem(SPATIAL_ASSESSMENTS_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  },
};
