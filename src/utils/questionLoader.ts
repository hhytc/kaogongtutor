import { EXAM_QUESTIONS, type ExamQuestion } from '../data/examQuestions';
import {
  QUESTION_MANIFEST,
  type QuestionPackId,
  getManifestItem,
} from '../data/questionManifest';

// In-memory cache for loaded questions
const loadedQuestionsMap = new Map<string, ExamQuestion>();
const loadedPacks = new Set<QuestionPackId>(['builtin']);
const pendingPacks = new Map<QuestionPackId, Promise<ExamQuestion[]>>();
const packErrors = new Map<QuestionPackId, string>();

// Initialize with built-in teaching questions
EXAM_QUESTIONS.forEach((q) => {
  loadedQuestionsMap.set(q.id, q);
});

// Event listeners for question load updates
type LoadListener = () => void;
const listeners = new Set<LoadListener>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in questionLoader listener:', e);
    }
  });
}

const PACK_FILES: Record<Exclude<QuestionPackId, 'builtin'>, string> = {
  errrc_origami: 'data/errrc/origami.json',
  errrc_assembly: 'data/errrc/assembly.json',
  errrc_cross_section: 'data/errrc/cross_section.json',
  errrc_guokao_spatial: 'data/errrc/guokao_spatial_2022_2026.json',
  spatial_training: 'data/spatial/training.json',
};

function normalizeImageUrl(src: string, normalizedBase: string): string {
  if (/^(?:https?:|data:|blob:)/i.test(src) || src.startsWith('/')) return src;
  return `${normalizedBase}${src}`;
}

export const questionLoader = {
  // Check if a pack is currently loaded
  isPackLoaded(packId: QuestionPackId): boolean {
    return loadedPacks.has(packId);
  },

  getPackError(packId: QuestionPackId): string | null {
    return packErrors.get(packId) || null;
  },

  getQuestionLoadError(id: string): string | null {
    const manifestItem = getManifestItem(id);
    return manifestItem ? this.getPackError(manifestItem.packId) : null;
  },

  // Synchronous lookup for questions already in memory
  getQuestionSync(id: string): ExamQuestion | null {
    return loadedQuestionsMap.get(id) || null;
  },

  // Get all questions currently loaded in memory
  getAllLoadedQuestions(): ExamQuestion[] {
    return Array.from(loadedQuestionsMap.values());
  },

  // Load a topic pack asynchronously
  async loadPack(packId: QuestionPackId): Promise<ExamQuestion[]> {
    if (packId === 'builtin' || loadedPacks.has(packId)) {
      return this.getAllLoadedQuestions().filter((q) => {
        const item = getManifestItem(q.id);
        return item?.packId === packId;
      });
    }

    if (pendingPacks.has(packId)) {
      return pendingPacks.get(packId)!;
    }

    const relPath = PACK_FILES[packId as Exclude<QuestionPackId, 'builtin'>];
    if (!relPath) {
      return [];
    }

    const loadPromise = (async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL || './';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        const url = `${normalizedBase}${relPath}`;

        const resp = await fetch(url);
        if (!resp.ok) {
          throw new Error(`Failed to load pack ${packId}: HTTP ${resp.status}`);
        }

        const questions: ExamQuestion[] = await resp.json();
        if (!Array.isArray(questions) || questions.length === 0 || questions.some((q) => !q || typeof q.id !== 'string')) {
          throw new Error(`题包 ${packId} 格式不正确或没有题目`);
        }
        const loadedIds = new Set(questions.map((question) => question.id));
        const missingIds = QUESTION_MANIFEST
          .filter((item) => item.packId === packId && !loadedIds.has(item.id))
          .map((item) => item.id);
        if (missingIds.length > 0) {
          throw new Error(`题包 ${packId} 缺少 ${missingIds.length} 道清单题目`);
        }
        for (const q of questions) {
          // Normalize image paths if necessary
          if (q.stemImages) q.stemImages = q.stemImages.map((src) => normalizeImageUrl(src, normalizedBase));
          if (q.analysisImages) q.analysisImages = q.analysisImages.map((src) => normalizeImageUrl(src, normalizedBase));
          if (q.options) q.options = q.options.map((option) => ({
            ...option,
            ...(option.imageUrl ? { imageUrl: normalizeImageUrl(option.imageUrl, normalizedBase) } : {}),
          }));
          loadedQuestionsMap.set(q.id, q);
        }

        loadedPacks.add(packId);
        packErrors.delete(packId);
        notifyListeners();
        return questions;
      } catch (err) {
        console.error(`Error loading question pack ${packId}:`, err);
        packErrors.set(packId, err instanceof Error ? err.message : '未知错误');
        notifyListeners();
        return [];
      } finally {
        pendingPacks.delete(packId);
      }
    })();

    pendingPacks.set(packId, loadPromise);
    return loadPromise;
  },

  // Ensure a specific question is loaded (looks up pack in manifest if needed)
  async ensureQuestionLoaded(id: string): Promise<ExamQuestion | null> {
    const existing = loadedQuestionsMap.get(id);
    if (existing) return existing;

    const manifestItem = getManifestItem(id);
    if (!manifestItem) return null;

    await this.loadPack(manifestItem.packId);
    return loadedQuestionsMap.get(id) || null;
  },

  // Load every pack which contains questions in a category.
  async loadForCategory(category: string): Promise<void> {
    const packIds = Array.from(new Set(
      QUESTION_MANIFEST
        .filter((item) => item.category === category)
        .map((item) => item.packId)
        .filter((packId) => packId !== 'builtin')
    ));
    await Promise.all(packIds.map((packId) => this.loadPack(packId)));
  },

  // Subscribe to changes in loaded questions
  subscribe(listener: LoadListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
