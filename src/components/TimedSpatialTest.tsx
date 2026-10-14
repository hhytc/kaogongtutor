import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Image as ImageIcon, Loader2, X, XCircle } from 'lucide-react';
import { QUESTION_MANIFEST } from '../data/questionManifest';
import { isRecentNationalSpatialExam, SPATIAL_TOPICS, type SpatialCategory } from '../data/spatialTopics';
import type { QuestionManifestItem } from '../data/questionManifest';
import type { ExamQuestion } from '../data/examQuestions';
import { questionLoader } from '../utils/questionLoader';
import { learningStorage } from '../utils/learningStorage';
import { assessmentStorage, type SpatialAssessment } from '../utils/assessmentStorage';
import { ImageLightbox } from './ImageLightbox';

type SourceFilter = 'guokao' | 'original' | 'mixed';
type Phase = 'setup' | 'loading' | 'test' | 'result';

interface TimedSpatialTestProps {
  initialCategory?: SpatialCategory;
  onClose: () => void;
}

interface SelectedQuestion {
  question: ExamQuestion;
  firstTest: boolean;
  practicedBefore: boolean;
}

interface PreloadedImageResult {
  failed: string[];
}

const IMAGE_TIMEOUT_MS = 15000;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const done = (success: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(success);
    };
    const timeout = window.setTimeout(() => done(false), IMAGE_TIMEOUT_MS);
    image.onload = () => done(true);
    image.onerror = () => done(false);
    image.src = url;
    if (image.complete && image.naturalWidth > 0) done(true);
  });
}

function getQuestionImageUrls(question: ExamQuestion): string[] {
  return Array.from(new Set([
    ...(question.stemImages || []),
    ...(question.analysisImages || []),
    ...question.options.map((option) => option.imageUrl).filter((url): url is string => Boolean(url)),
  ]));
}

function belongsToSource(item: QuestionManifestItem, source: SourceFilter): boolean {
  const nationalExam = isRecentNationalSpatialExam(item);
  const original = item.packId === 'spatial_training';
  if (source === 'mixed') return nationalExam || original;
  if (source === 'guokao') return nationalExam;
  return original;
}

function isCoreSpatialCategory(item: QuestionManifestItem): boolean {
  return SPATIAL_TOPICS.some((topic) => topic.category === item.category);
}

function interleaveByCategory<T extends { category: string }>(items: T[]): T[] {
  const categories = Array.from(new Set(items.map((item) => item.category)));
  const groups = new Map<string, T[]>();
  for (const category of categories) groups.set(category, shuffle(items.filter((item) => item.category === category)));
  const result: T[] = [];
  let round = 0;
  while (Array.from(groups.values()).some((group) => round < group.length)) {
    for (const category of categories) {
      const item = groups.get(category)?.[round];
      if (item) result.push(item);
    }
    round += 1;
  }
  return result;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0');
  const remaining = (safe % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function getQuestionSource(question: ExamQuestion): string {
  return question.meta?.isRealExam ? '近五年国考回忆题' : '原创训练题';
}

export const TimedSpatialTest: React.FC<TimedSpatialTestProps> = ({ initialCategory, onClose }) => {
  const [phase, setPhase] = useState<Phase>('setup');
  const [category, setCategory] = useState<SpatialCategory | 'all'>(initialCategory || 'all');
  const [source, setSource] = useState<SourceFilter>('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(10);
  const [prepareError, setPrepareError] = useState('');
  const [questions, setQuestions] = useState<SelectedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [assessment, setAssessment] = useState<SpatialAssessment | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState(() => assessmentStorage.getHistory());
  const [assessmentPersisted, setAssessmentPersisted] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [confirmation, setConfirmation] = useState<'submit' | 'exit' | null>(null);
  const lightboxOpenRef = useRef(false);
  const startAtRef = useRef(0);
  const deadlineRef = useRef(0);
  const enteredQuestionAtRef = useRef(0);
  const enteredQuestionIdRef = useRef('');
  const questionSpentMsRef = useRef<Record<string, number>>({});
  const finishRef = useRef<(timedOut: boolean) => void>(() => undefined);
  const finishLockedRef = useRef(false);
  useEffect(() => {
    lightboxOpenRef.current = Boolean(lightbox);
  }, [lightbox]);

  const saveAndFinish = useCallback((timedOut: boolean) => {
    if (phase !== 'test' || assessment || finishLockedRef.current) return;
    finishLockedRef.current = true;
    const now = Math.min(Date.now(), deadlineRef.current);
    const spentMs = { ...questionSpentMsRef.current };
    if (enteredQuestionIdRef.current && enteredQuestionAtRef.current > 0) {
      const questionId = enteredQuestionIdRef.current;
      spentMs[questionId] = (spentMs[questionId] || 0) + Math.max(0, now - enteredQuestionAtRef.current);
    }
    const startedAt = startAtRef.current;
    const finishedAt = now;
    const elapsedSeconds = Math.max(0, Math.min(timeLimitMinutes * 60, Math.floor((finishedAt - startedAt) / 1000)));
    const detail = questions.map(({ question, firstTest, practicedBefore }) => {
      const answer = answers[question.id] || null;
      return {
        questionId: question.id,
        answer,
        correctAnswer: question.correctAnswer,
        isCorrect: answer === null ? null : answer === question.correctAnswer,
        firstTest,
        practicedBefore,
        secondsSpent: Math.round((spentMs[question.id] || 0) / 1000),
      };
    });
    const result = assessmentStorage.saveAssessment({
      startedAt,
      finishedAt,
      category,
      sourceFilter: source,
      timeLimitSeconds: timeLimitMinutes * 60,
      elapsedSeconds: timedOut ? timeLimitMinutes * 60 : elapsedSeconds,
      questions: detail,
    });
    setAssessment(result.assessment);
    setAssessmentHistory(assessmentStorage.getHistory());
    setAssessmentPersisted(result.persisted);
    setConfirmation(null);
    setLightbox(null);
    setPhase('result');
  }, [answers, assessment, category, phase, questions, source, timeLimitMinutes]);

  useEffect(() => {
    finishRef.current = saveAndFinish;
  }, [saveAndFinish]);

  useEffect(() => {
    if (phase !== 'test') return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        finishRef.current(true);
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  const finishQuestionVisit = (questionId: string) => {
    if (!enteredQuestionAtRef.current) return;
    const now = Math.min(Date.now(), deadlineRef.current);
    questionSpentMsRef.current[questionId] = (questionSpentMsRef.current[questionId] || 0) + Math.max(0, now - enteredQuestionAtRef.current);
    enteredQuestionAtRef.current = now;
  };

  const prepareAndStart = async () => {
    if (phase === 'loading') return;
    setPhase('loading');
    setPrepareError('');
    setAssessment(null);
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    questionSpentMsRef.current = {};
    enteredQuestionAtRef.current = 0;

    try {
      const manifests = QUESTION_MANIFEST.filter((item) =>
        item.track === 'geometry' &&
        isCoreSpatialCategory(item) &&
        (category === 'all' || item.category === category) &&
        belongsToSource(item, source)
      );
      if (manifests.length === 0) {
        throw new Error('当前题型与来源组合没有可用题目。请选择其他条件。');
      }

      const packIds = Array.from(new Set(manifests.map((item) => item.packId)));
      await Promise.all(packIds.map((packId) => questionLoader.loadPack(packId)));
      const loaded = new Map<string, ExamQuestion>();
      for (const question of questionLoader.getAllLoadedQuestions()) loaded.set(question.id, question);
      const missing = manifests.filter((item) => !loaded.has(item.id));
      if (missing.length > 0) {
        const packError = packIds.map((packId) => questionLoader.getPackError(packId)).find(Boolean);
        const detail = packError ? `（${packError}）` : `（有 ${missing.length} 道题尚未载入）`;
        throw new Error(`题包载入不完整${detail}。请重试，测验计时尚未开始。`);
      }

      const pool = manifests
        .map((item) => loaded.get(item.id))
        .filter((item): item is ExamQuestion => Boolean(item));
      const records = learningStorage.getRecords();
      const seen = assessmentStorage.getSeenQuestionIds();
      const trainingSeen = new Set(pool.filter((question) => {
        const record = records[question.id];
        return Boolean(record && (record.selectedAnswer || record.attempts > 0));
      }).map((question) => question.id));
      const tiers: ExamQuestion[][] = [[], [], [], []];
      for (const question of pool) {
        const practiced = trainingSeen.has(question.id);
        const tested = seen.has(question.id);
        const priority = !practiced && !tested ? 0 : !practiced ? 1 : !tested ? 2 : 3;
        tiers[priority].push(question);
      }
      const prioritized = tiers.flatMap((tier) => interleaveByCategory(tier)).slice(0, Math.min(questionCount, pool.length));
      const selected: SelectedQuestion[] = prioritized.map((question) => ({
        question,
        firstTest: !seen.has(question.id),
        practicedBefore: trainingSeen.has(question.id),
      }));
      if (selected.length === 0) throw new Error('当前条件下没有可用题目。');

      const imageUrls = Array.from(new Set(selected.flatMap(({ question }) => getQuestionImageUrls(question))));
      const imageResults: PreloadedImageResult[] = await Promise.all(
        imageUrls.map(async (url) => ({ failed: await preloadImage(url) ? [] : [url] }))
      );
      const failedImages = imageResults.flatMap((item) => item.failed);
      if (failedImages.length > 0) {
        throw new Error(`有 ${failedImages.length} 张题图载入失败。重试成功前不会开始计时。`);
      }

      setQuestions(selected);
      const durationSeconds = timeLimitMinutes * 60;
      const startedAt = Date.now();
      startAtRef.current = startedAt;
      deadlineRef.current = startedAt + durationSeconds * 1000;
      enteredQuestionAtRef.current = startedAt;
      enteredQuestionIdRef.current = selected[0].question.id;
      finishLockedRef.current = false;
      setSecondsLeft(durationSeconds);
      setPhase('test');
    } catch (error) {
      setPrepareError(error instanceof Error ? error.message : '载入失败，请重试。');
      setPhase('setup');
    }
  };

  const closeTest = () => {
    if (phase === 'test') {
      setConfirmation('exit');
      return;
    }
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !lightboxOpenRef.current) {
        if (confirmation) setConfirmation(null);
        else closeTest();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const setQuestion = (index: number) => {
    if (Date.now() >= deadlineRef.current) { saveAndFinish(true); return; }
    if (index < 0 || index >= questions.length || index === currentIndex) return;
    const current = questions[currentIndex]?.question;
    if (current) finishQuestionVisit(current.id);
    enteredQuestionIdRef.current = questions[index].question.id;
    setCurrentIndex(index);
  };

  const currentSelection = questions[currentIndex];
  const currentQuestion = currentSelection?.question;
  const score = assessment?.questions.filter((question) => question.isCorrect).length || 0;
  const unanswered = assessment?.questions.filter((question) => question.answer === null).length || 0;
  const firstSeenCount = assessment?.questions.filter((question) => question.firstTest).length || 0;

  const selectOption = useCallback((questionId: string, key: string) => {
    if (Date.now() >= deadlineRef.current) { saveAndFinish(true); return; }
    setAnswers((prev) => ({ ...prev, [questionId]: key }));
  }, [saveAndFinish]);

  const currentCategoryName = category === 'all'
    ? '全部空间题型'
    : SPATIAL_TOPICS.find((topic) => topic.category === category)?.title || '空间推理';
  const availableQuestionCount = QUESTION_MANIFEST.filter((item) =>
    item.track === 'geometry' &&
    isCoreSpatialCategory(item) &&
    (category === 'all' || item.category === category) &&
    belongsToSource(item, source)
  ).length;

  const imageButton = (src: string, alt: string, className: string) => (
    <button
      key={`${src}-${alt}`}
      type="button"
      onClick={() => setLightbox({ src, alt })}
      aria-label={`放大查看${alt}`}
      className={`block max-w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ${className}`}
    >
      <img src={src} alt={alt} className="max-h-64 max-w-full object-contain sm:max-h-80" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-2 sm:p-5" role="presentation">
      <section
        className="flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spatial-test-title"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
          <div>
            <h2 id="spatial-test-title" className="text-sm font-bold text-white sm:text-base">空间推理限时测验</h2>
          <p className="mt-0.5 text-[10px] text-slate-400">先独立作答，交卷后统一复盘</p>
          </div>
          <button type="button" onClick={closeTest} aria-label="关闭限时测验" className="rounded-lg bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400">
            <X className="h-4 w-4" />
          </button>
        </header>

        {phase === 'setup' && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            <div className="rounded-xl border border-indigo-900/70 bg-indigo-950/30 p-3 text-xs leading-relaxed text-indigo-100">
              交卷前不会显示解析、提示、知识点或 3D 入口。题目和图片会先载入；只有全部就绪后才开始倒计时。
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="space-y-2">
                <legend className="text-xs font-bold text-slate-200">题型范围</legend>
                <div className="grid gap-1.5">
                  <button type="button" onClick={() => setCategory('all')} className={`rounded-lg border px-3 py-2 text-left text-xs ${category === 'all' ? 'border-sky-500 bg-sky-950/50 text-sky-200' : 'border-slate-800 bg-slate-900 text-slate-300'}`}>全部五类空间题</button>
                  {SPATIAL_TOPICS.map((topic) => (
                    <button key={topic.category} type="button" onClick={() => setCategory(topic.category)} className={`rounded-lg border px-3 py-2 text-left text-xs ${category === topic.category ? 'border-sky-500 bg-sky-950/50 text-sky-200' : 'border-slate-800 bg-slate-900 text-slate-300'}`}>
                      {topic.title}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-bold text-slate-200">题目来源</legend>
                  <div className="grid grid-cols-1 gap-1.5">
                    {([
                      ['guokao', '近五年国考回忆题'],
                      ['original', '原创训练题'],
                      ['mixed', '混合练习'],
                    ] as [SourceFilter, string][]).map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setSource(value)} className={`rounded-lg border px-3 py-2 text-left text-xs ${source === value ? 'border-indigo-500 bg-indigo-950/50 text-indigo-200' : 'border-slate-800 bg-slate-900 text-slate-300'}`}>{label}</button>
                    ))}
                  </div>
                </fieldset>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs font-bold text-slate-200">
                    题量
                    <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
                      {[5, 10, 15, 20].map((value) => <option key={value} value={value}>{value} 题</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-bold text-slate-200">
                    时限
                    <select value={timeLimitMinutes} onChange={(event) => setTimeLimitMinutes(Number(event.target.value))} className="block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white">
                      {[1, 2, 5, 10, 15, 20, 30].map((value) => <option key={value} value={value}>{value} 分钟</option>)}
                    </select>
                  </label>
                </div>
                <p className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-300">
                  当前条件可选 <strong className="text-sky-300">{availableQuestionCount}</strong> 题；本次计划 {Math.min(questionCount, availableQuestionCount)} 题。
                  {availableQuestionCount < questionCount && '题库数量不足，按现有题量开始。'}
                </p>
              </div>
            </div>
            {prepareError && <div role="alert" className="rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-xs leading-relaxed text-rose-200">{prepareError}</div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
              <p className="text-[10px] text-slate-500">未做过的题会优先入选；超出可用题量时按实际题数开始。</p>
              <button type="button" onClick={prepareAndStart} className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-400">
                {prepareError ? '重试载入并开始' : '载入题目并开始'}
              </button>
            </div>
            {assessmentHistory.length > 0 && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h3 className="text-[11px] font-bold text-slate-300">最近测验</h3>
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {assessmentHistory.slice(-3).reverse().map((item) => {
                    const correctCount = item.questions.filter((question) => question.isCorrect).length;
                    const topicTitle = item.category === 'all'
                      ? '全部五类'
                      : SPATIAL_TOPICS.find((topic) => topic.category === item.category)?.title || item.category;
                    const sourceTitle = item.sourceFilter === 'guokao' ? '近五年国考' : item.sourceFilter === 'original' ? '原创' : '混合';
                    return (
                      <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-[10px] text-slate-400">
                        <div className="flex justify-between gap-2"><span>{new Date(item.finishedAt).toLocaleString()}</span><strong className="text-slate-200">{correctCount}/{item.questions.length}</strong></div>
                        <div className="mt-1">{topicTitle} · {formatTime(item.elapsedSeconds)} · {sourceTitle}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'loading' && (
          <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-sky-400" />
            <p className="text-sm font-semibold text-white">正在载入 {currentCategoryName}、题目图片和解析图片…</p>
            <p className="text-xs text-slate-400">尚未开始计时，载入失败可以重试。</p>
          </div>
        )}

        {phase === 'test' && currentQuestion && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/70 px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-bold text-white">第 {currentIndex + 1} / {questions.length} 题</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px]">{getQuestionSource(currentQuestion)}</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">练习{currentSelection.practicedBefore ? '已做' : '首见'}</span>
                <span className={`rounded-md px-2 py-0.5 text-[10px] ${currentSelection.firstTest ? 'bg-slate-800 text-slate-300' : 'bg-amber-950/60 text-amber-200'}`}>测验{currentSelection.firstTest ? '首测' : '复测'}</span>
              </div>
              <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-sm font-bold ${secondsLeft <= 60 ? 'bg-rose-950/60 text-rose-300' : 'bg-slate-800 text-sky-300'}`} aria-live="polite">
                <Clock3 className="h-3.5 w-3.5" /> {formatTime(secondsLeft)}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-3xl space-y-4">
                <h3 className="text-sm font-bold leading-relaxed text-white sm:text-base">{currentQuestion.questionText}</h3>
                {currentQuestion.stemImages && currentQuestion.stemImages.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                    {currentQuestion.stemImages.map((src, index) => imageButton(src, `题干图 ${index + 1}`, 'bg-white p-2'))}
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentQuestion.options.map((option) => {
                    const selected = answers[currentQuestion.id] === option.key;
                    return (
                      <div key={option.key} className={`rounded-xl border ${selected ? 'border-sky-500 bg-sky-950/40' : 'border-slate-800 bg-slate-900/70'}`}>
                        <button
                          type="button"
                          onClick={() => selectOption(currentQuestion.id, option.key)}
                          aria-pressed={selected}
                          className="flex min-h-12 w-full items-center gap-3 p-3 text-left text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-400"
                        >
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${selected ? 'border-sky-400 bg-sky-600 text-white' : 'border-slate-600 text-slate-300'}`}>{option.key}</span>
                          <span className="min-w-0 flex-1 whitespace-pre-wrap leading-relaxed">{option.text}</span>
                          {option.imageUrl && <img src={option.imageUrl} alt={`选项 ${option.key} 图`} className="max-h-20 max-w-[40%] rounded bg-white p-1 object-contain" />}
                        </button>
                        {option.imageUrl && (
                          <button type="button" onClick={() => setLightbox({ src: option.imageUrl!, alt: `选项 ${option.key} 图` })} className="mb-2 ml-12 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-sky-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400">
                            <ImageIcon className="h-3 w-3" /> 放大图片
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 bg-slate-900/70 px-3 py-2.5 sm:px-5">
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setQuestion(currentIndex - 1)} disabled={currentIndex === 0} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"><ArrowLeft className="h-3.5 w-3.5" />上一题</button>
                <button type="button" onClick={() => setQuestion(currentIndex + 1)} disabled={currentIndex === questions.length - 1} className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200 disabled:opacity-40">下一题<ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
              <div className="flex flex-1 flex-wrap justify-center gap-1.5 sm:px-3" aria-label="答题卡">
                {questions.map(({ question }, index) => (
                  <button key={question.id} type="button" onClick={() => setQuestion(index)} aria-label={`转到第 ${index + 1} 题${answers[question.id] ? '，已作答' : '，未作答'}`} aria-current={currentIndex === index ? 'step' : undefined} className={`h-7 min-w-7 rounded-md border px-1.5 text-[10px] font-bold ${currentIndex === index ? 'border-sky-400 bg-sky-600 text-white' : answers[question.id] ? 'border-emerald-700 bg-emerald-950/50 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>{index + 1}</button>
                ))}
              </div>
              <button type="button" onClick={() => setConfirmation('submit')} className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500">交卷</button>
            </footer>
          </div>
        )}

        {phase === 'result' && assessment && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="mx-auto max-w-4xl space-y-4">
                <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-[10px] text-slate-400">得分</p><p className="mt-1 text-xl font-black text-white">{score} / {assessment.questions.length}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-[10px] text-slate-400">答对率</p><p className="mt-1 text-xl font-black text-emerald-300">{assessment.questions.length ? Math.round(score / assessment.questions.length * 100) : 0}%</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-[10px] text-slate-400">用时</p><p className="mt-1 text-xl font-black text-sky-300">{formatTime(assessment.elapsedSeconds)}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-[10px] text-slate-400">首次测验 / 复测</p><p className="mt-1 text-xl font-black text-indigo-300">{firstSeenCount} / {assessment.questions.length - firstSeenCount}</p></div>
              </div>
              {unanswered > 0 && <p className="text-xs text-amber-200">有 {unanswered} 题未作答，已按错误计入得分。</p>}
              {!assessmentPersisted && <p role="status" className="text-xs text-amber-200">本次结果仅保留在当前页面，浏览器存储空间不可用。</p>}
              <div className="space-y-3">
                {assessment.questions.map((result, index) => {
                  const question = questions.find((item) => item.question.id === result.questionId)?.question;
                  if (!question) return null;
                  const correct = result.isCorrect === true;
                  const answerText = result.answer ? question.options.find((option) => option.key === result.answer)?.text : undefined;
                  const correctText = question.options.find((option) => option.key === result.correctAnswer)?.text;
                  return (
                    <article key={result.questionId} className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-white">第 {index + 1} 题 · {question.title}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${correct ? 'bg-emerald-950/70 text-emerald-300' : 'bg-rose-950/70 text-rose-300'}`}>
                          {correct ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {correct ? '正确' : '错误'} · 训练{result.practicedBefore ? '已练' : '首见'} · 测验{result.firstTest ? '首测' : '复测'} · {result.secondsSpent} 秒
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-200">{question.questionText}</p>
                      {question.stemImages?.map((src, imageIndex) => imageButton(src, `第 ${index + 1} 题干图 ${imageIndex + 1}`, 'mt-2 bg-white p-1'))}
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        你的答案：<strong className={correct ? 'text-emerald-300' : 'text-rose-300'}>{result.answer ? `${result.answer} · ${answerText || ''}` : '未作答'}</strong>
                        <span className="mx-2 text-slate-600">|</span>
                        正确答案：<strong className="text-emerald-300">{result.correctAnswer} · {correctText || ''}</strong>
                      </p>
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <p className="text-[10px] font-bold text-sky-300">参考解析 · {getQuestionSource(question)}（答案按收录材料整理）</p>
                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{question.detailedAnalysis}</p>
                        {question.analysisImages?.map((src, imageIndex) => imageButton(src, `第 ${index + 1} 题解析图 ${imageIndex + 1}`, 'mt-2 bg-white p-1'))}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button type="button" onClick={() => { setAssessment(null); setPhase('setup'); setPrepareError(''); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800">再测一次</button>
                <button type="button" onClick={onClose} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-500">完成</button>
              </div>
            </div>
          </div>
        )}
      </section>
      {confirmation && phase === 'test' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="spatial-confirm-title" className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-xl">
            <h3 id="spatial-confirm-title" className="font-bold">{confirmation === 'submit' ? '确定交卷？' : '退出本次测验？'}</h3>
            <p className="mt-2 text-sm text-slate-300">{confirmation === 'submit' ? '交卷后将显示成绩与解析。未作答题按错误计分。' : '退出会丢弃本次作答，不保存测验记录。'}</p>
            <p className="mt-2 text-xs text-amber-300">计时继续，剩余 {formatTime(secondsLeft)}；到时自动交卷。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => setConfirmation(null)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm">继续作答</button>
              <button type="button" onClick={() => confirmation === 'submit' ? saveAndFinish(false) : onClose()} className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-bold">{confirmation === 'submit' ? '确认交卷' : '确认退出'}</button>
            </div>
          </section>
        </div>
      )}
      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}
    </div>
  );
};
