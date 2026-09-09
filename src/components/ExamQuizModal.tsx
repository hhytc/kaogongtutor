import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Eye,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  RotateCcw,
  BarChart2,
  Download,
  Upload,
  Compass,
  AlertCircle,
  X,
} from 'lucide-react';
import { EXAM_QUESTIONS, type ExamQuestion } from '../data/examQuestions';
import {
  learningStorage,
  type ErrorReason,
  ERROR_REASON_LABELS,
  type QuestionRecord,
  type LearningStats,
} from '../utils/learningStorage';
import { MathView } from './MathView';
import { WorkGridVisualizer } from './WorkGridVisualizer';
import { RatioBarVisualizer } from './RatioBarVisualizer';

interface ExamQuizModalProps {
  onLoadIntoSimulator: (
    config: ExamQuestion['simulatorConfig'],
    questionId: string,
    questionTitle: string
  ) => void;
  initialQuestionId?: string | null;
}

type TabTrackFilter = 'all' | 'geometry' | 'engineering' | 'tools' | 'review';

// Helper to render an isometric 3D voxel cube in SVG
function renderIsoVoxel(
  x: number,
  y: number,
  z: number,
  size: number,
  ox: number,
  oy: number,
  fillColor = '#38bdf8'
) {
  const cos30 = 0.866;
  const sin30 = 0.5;

  const sx = ox + (x - z) * size * cos30;
  const sy = oy - y * size + (x + z) * size * sin30;

  // Top Face (lightest)
  const topPoints = [
    `${sx},${sy - size * sin30}`,
    `${sx + size * cos30},${sy}`,
    `${sx},${sy + size * sin30}`,
    `${sx - size * cos30},${sy}`,
  ].join(' ');

  // Left Face (medium)
  const leftPoints = [
    `${sx - size * cos30},${sy}`,
    `${sx},${sy + size * sin30}`,
    `${sx},${sy + size * sin30 + size}`,
    `${sx - size * cos30},${sy + size}`,
  ].join(' ');

  // Right Face (darkest)
  const rightPoints = [
    `${sx},${sy + size * sin30}`,
    `${sx + size * cos30},${sy}`,
    `${sx + size * cos30},${sy + size}`,
    `${sx},${sy + size * sin30 + size}`,
  ].join(' ');

  return (
    <g key={`${x},${y},${z}`}>
      <polygon points={leftPoints} fill={fillColor} opacity={0.7} stroke="#0f172a" strokeWidth={0.8} />
      <polygon points={rightPoints} fill={fillColor} opacity={0.5} stroke="#0f172a" strokeWidth={0.8} />
      <polygon points={topPoints} fill={fillColor} opacity={0.95} stroke="#0f172a" strokeWidth={0.8} />
    </g>
  );
}

// Render a collection of 3D voxels in sorted isometric order
function renderVoxelCluster(
  voxels: [number, number, number][],
  size: number,
  ox: number,
  oy: number,
  color = '#38bdf8'
) {
  const sorted = [...voxels].sort((a, b) => {
    const depthA = (a[0] + a[2]) * 10 + a[1];
    const depthB = (b[0] + b[2]) * 10 + b[1];
    return depthA - depthB;
  });

  return sorted.map(([x, y, z]) => renderIsoVoxel(x, y, z, size, ox, oy, color));
}

export const ExamQuizModal: React.FC<ExamQuizModalProps> = ({
  onLoadIntoSimulator,
  initialQuestionId,
}) => {
  // Records from local storage
  const [records, setRecords] = useState<Record<string, QuestionRecord>>(() =>
    learningStorage.getRecords()
  );

  // Active track filter: all, geometry, engineering, tools, review
  const [activeTrack, setActiveTrack] = useState<TabTrackFilter>('all');
  const [geometryCategory, setGeometryCategory] = useState<string>('all');

  // Active question ID
  const [activeQuestionId, setActiveQuestionId] = useState<string>(() => {
    if (initialQuestionId) return initialQuestionId;
    return learningStorage.getActiveQuestionId(EXAM_QUESTIONS[0].id);
  });

  // Hints unlocked per question, persisted in learningStorage
  const [unlockedHints, setUnlockedHints] = useState<Record<string, number>>(() =>
    learningStorage.getUnlockedHints()
  );

  // Toggle for full solution
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

  // Backup & Stats Modal state
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Adjust state when initialQuestionId prop changes
  const [prevInitialId, setPrevInitialId] = useState<string | null>(null);
  if (initialQuestionId && initialQuestionId !== prevInitialId) {
    setPrevInitialId(initialQuestionId);
    setActiveQuestionId(initialQuestionId);
    const targetQ = EXAM_QUESTIONS.find((q) => q.id === initialQuestionId);
    if (targetQ && targetQ.track) {
      setActiveTrack(targetQ.track);
    }
  }

  // Sync active question to storage
  useEffect(() => {
    learningStorage.setActiveQuestionId(activeQuestionId);
  }, [activeQuestionId]);

  // Compute stats
  const stats: LearningStats = learningStorage.getStats();
  const reviewIds = learningStorage.getQuestionsNeedingReview();
  const reviewIdSet = new Set(reviewIds);

  // Filter questions based on active track
  const filteredQuestions = EXAM_QUESTIONS.filter((q) => {
    if (activeTrack === 'review') {
      return reviewIdSet.has(q.id);
    }
    if (activeTrack === 'geometry') {
      if (q.track !== 'geometry') return false;
      if (geometryCategory !== 'all') return q.category === geometryCategory;
      return true;
    }
    if (activeTrack === 'engineering') {
      return q.track === 'engineering';
    }
    if (activeTrack === 'tools') {
      return q.track === 'tools';
    }
    return true;
  });

  // Ensure current question belongs to filtered questions
  const currentInFiltered = filteredQuestions.find((q) => q.id === activeQuestionId);
  const currentQ: ExamQuestion | null = currentInFiltered || (filteredQuestions.length > 0 ? filteredQuestions[0] : null);

  // Current record
  const currentRecord = currentQ ? records[currentQ.id] : null;
  const isAnswered = Boolean(currentRecord && currentRecord.selectedAnswer);
  const selectedAnswer = currentRecord?.selectedAnswer || '';
  const isCorrect = currentRecord?.isCorrect ?? false;
  const isExplVisible = currentQ ? (showExplanation[currentQ.id] ?? isAnswered) : false;

  // Hints used: if already answered, take recorded hints; otherwise take persistent unlocked level (defaults to 0)
  const hintsUsedCount = isAnswered
    ? (currentRecord?.hintsUsed ?? 0)
    : (currentQ ? (unlockedHints[currentQ.id] ?? 0) : 0);
  const currentHintsLevel = currentQ ? (unlockedHints[currentQ.id] ?? (isAnswered ? 3 : 0)) : 0;

  // Handle track filter change
  const handleTrackChange = (track: TabTrackFilter) => {
    setActiveTrack(track);
    const qList = EXAM_QUESTIONS.filter((q) => {
      if (track === 'review') return reviewIdSet.has(q.id);
      if (track === 'all') return true;
      return q.track === track;
    });
    if (qList.length > 0) {
      setActiveQuestionId(qList[0].id);
    }
  };

  // Handle option selection
  const handleSelectOption = (key: string) => {
    if (!currentQ || isAnswered) return;

    const answerCorrect = key === currentQ.correctAnswer;
    const hintsUsed = unlockedHints[currentQ.id] ?? 0;

    // Do NOT default to relation_error; leave as undefined until candidate explicitly chooses
    learningStorage.saveAttempt(
      currentQ.id,
      key,
      answerCorrect,
      hintsUsed,
      undefined
    );

    setRecords({ ...learningStorage.getRecords() });
    setShowExplanation((prev) => ({ ...prev, [currentQ.id]: true }));

    if (answerCorrect) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Unlock progressive hint (persisted in learningStorage)
  const handleUnlockHint = (level: number) => {
    if (!currentQ) return;
    learningStorage.saveUnlockedHint(currentQ.id, level);
    setUnlockedHints((prev) => ({
      ...prev,
      [currentQ.id]: Math.max(prev[currentQ.id] || 0, level),
    }));
  };

  // Update error reason
  const handleUpdateErrorReason = (reason: ErrorReason) => {
    if (!currentQ) return;
    learningStorage.updateErrorReason(currentQ.id, reason);
    setRecords({ ...learningStorage.getRecords() });
  };

  // Re-attempt question (clears current choice without erasing attempt history or first-attempt data)
  const handleReattempt = (qid: string) => {
    learningStorage.clearCurrentForReattempt(qid);
    setRecords({ ...learningStorage.getRecords() });
    setUnlockedHints((prev) => {
      const copy = { ...prev };
      delete copy[qid];
      return copy;
    });
    setShowExplanation((prev) => ({ ...prev, [qid]: false }));
  };

  // Mark as mastered (removes from review queue without fabricating independent correct history)
  const handleMarkMastered = (qid: string) => {
    learningStorage.markMastered(qid);
    setRecords({ ...learningStorage.getRecords() });
  };

  // Export records to JSON file
  const handleExportBackup = () => {
    const jsonStr = learningStorage.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaogong_records_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import records from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (learningStorage.importBackup(content)) {
        setRecords(learningStorage.getRecords());
        setUnlockedHints(learningStorage.getUnlockedHints());
        alert('数据导入验证通过，记录恢复成功！');
      } else {
        alert('导入失败：文件格式不符合要求或缺少必需字段。原始数据已完整保留。');
      }
    };
    reader.readAsText(file);
  };

  // Clear all data
  const handleClearAll = () => {
    if (confirm('确定要清空全部做题记录、错题本与答题统计吗？此操作无法撤销。')) {
      learningStorage.clearAll();
      setRecords({});
      setUnlockedHints({});
      setShowExplanation({});
      setShowStatsModal(false);
    }
  };

  // Parent example for variants
  const parentExample =
    currentQ && currentQ.questionRole === 'variant'
      ? EXAM_QUESTIONS.find((q) => q.variantIds?.includes(currentQ.id))
      : null;

  // Render question diagrams
  const renderDiagram = () => {
    if (!currentQ) return null;

    if (currentQ.diagramType === 'work-grid') {
      return (
        <div className="my-3">
          <WorkGridVisualizer
            key={`${currentQ.id}-${currentQ.diagramProps?.initialScenario || ''}`}
            {...currentQ.diagramProps}
            showSolution={isAnswered || currentHintsLevel >= 3}
            onInteract={() => !isAnswered && handleUnlockHint(2)}
          />
        </div>
      );
    }

    if (currentQ.diagramType === 'ratio-bar') {
      return (
        <div className="my-3">
          <RatioBarVisualizer
            key={currentQ.id}
            {...currentQ.diagramProps}
            showSolution={isAnswered || currentHintsLevel >= 3}
            onInteract={() => !isAnswered && handleUnlockHint(2)}
          />
        </div>
      );
    }

    if (currentQ.diagramType === 'origami-q7') {
      return (
        <div className="my-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col items-center">
          <div className="text-[11px] text-slate-400 mb-2 font-medium">【题干给定外表面展开图 (1-4-1 十字构型)】</div>
          <svg viewBox="0 0 240 180" className="w-64 max-w-full h-auto drop-shadow-md">
            {/* Col 0, Row 1: Double Circle */}
            <g transform="translate(15, 65)">
              <rect width="45" height="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <circle cx="22.5" cy="22.5" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="22.5" cy="22.5" r="8" fill="none" stroke="#38bdf8" strokeWidth="2" />
            </g>

            {/* Col 1, Row 0: Up Arrow */}
            <g transform="translate(65, 15)">
              <rect width="45" height="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <path d="M 22.5 8 L 33 22 L 26 22 L 26 37 L 19 37 L 19 22 L 12 22 Z" fill="#38bdf8" />
            </g>

            {/* Col 1, Row 1: Five-Pointed Star */}
            <g transform="translate(65, 65)">
              <rect width="45" height="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <polygon points="22.5,7 26.5,18 38,18 28.5,25 32,36 22.5,29.5 13,36 16.5,25 7,18 18.5,18" fill="#facc15" />
            </g>

            {/* Col 1, Row 2: Diagonal Hatched Lines */}
            <g transform="translate(65, 115)">
              <rect width="45" height="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <line x1="6" y1="39" x2="39" y2="6" stroke="#94a3b8" strokeWidth="2" />
              <line x1="6" y1="24" x2="24" y2="6" stroke="#94a3b8" strokeWidth="2" />
              <line x1="21" y1="39" x2="39" y2="21" stroke="#94a3b8" strokeWidth="2" />
            </g>

            {/* Col 2, Row 1: Diagonal Cross */}
            <g transform="translate(115, 65)">
              <rect width="45" height="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <line x1="10" y1="10" x2="35" y2="35" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="35" y1="10" x2="10" y2="35" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* Col 3, Row 1: Shaded Solid Square */}
            <g transform="translate(165, 65)">
              <rect width="45" height="45" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4" />
              <rect x="11.25" y="11.25" width="22.5" height="22.5" fill="#64748b" rx="2" />
            </g>
          </svg>
          {(isAnswered || currentHintsLevel >= 1) && (
            <div className="text-[10px] text-amber-300/90 mt-2 text-center bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 animate-in fade-in duration-300">
              提示：同行隔一格必为【相对面】（★五角星 与 ■阴影方块；◎双圆环 与 ✕对角叉）
            </div>
          )}
        </div>
      );
    }

    if (currentQ.diagramType === 'assembly-q8') {
      // 3D Isometric SVG diagrams for the Cavity and 4 Options
      const cavityVoxels: [number, number, number][] = [
        [2, 0, 0], [2, 0, 1], [1, 0, 0],
        [2, 1, 0], [2, 1, 1], [1, 1, 0],
        [2, 2, 0],
      ];
      const optAVoxels: [number, number, number][] = [
        [1, 0, 0], [1, 0, 1], [0, 0, 0], [0, 0, 1],
        [1, 1, 0], [1, 1, 1], [0, 1, 0], [0, 1, 1],
      ];
      const optBVoxels: [number, number, number][] = [
        [1, 0, 0], [1, 0, 1], [0, 0, 0],
        [1, 1, 0], [1, 1, 1], [0, 1, 0],
        [1, 2, 0],
      ];
      const optCVoxels: [number, number, number][] = [
        [1, 0, 0], [1, 0, 1], [0, 0, 0],
        [1, 1, 0], [1, 1, 1], [0, 1, 0],
      ];
      const optDVoxels: [number, number, number][] = [
        [2, 0, 0], [1, 0, 0], [0, 0, 0],
        [2, 1, 0], [1, 1, 0], [0, 1, 0],
        [2, 2, 0],
      ];

      return (
        <div className="my-3 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-col items-center gap-3">
          <div className="text-[11px] text-slate-300 font-semibold">
            【3×3×3 大正方体缺口与候选选项空间结构图】
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full max-w-2xl">
            {/* Target Cavity */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-emerald-500/40 flex flex-col items-center">
              <span className="text-[10px] font-bold text-emerald-400 mb-1">目标缺口 (7块)</span>
              <svg viewBox="0 0 110 90" className="w-24 h-20">
                {renderVoxelCluster(cavityVoxels, 9, 55, 55, '#10b981')}
              </svg>
              <span className="text-[9px] text-slate-400">底层3+中层3+顶层1</span>
            </div>

            {/* Option A */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-300 mb-1">A (8块 实心)</span>
              <svg viewBox="0 0 110 90" className="w-24 h-20">
                {renderVoxelCluster(optAVoxels, 9, 55, 55, '#94a3b8')}
              </svg>
              <span className="text-[9px] text-slate-500">2×2×2 角落实心</span>
            </div>

            {/* Option B */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-sky-500/30 flex flex-col items-center">
              <span className="text-[10px] font-bold text-sky-400 mb-1">B (7块 L型单凸)</span>
              <svg viewBox="0 0 110 90" className="w-24 h-20">
                {renderVoxelCluster(optBVoxels, 9, 55, 55, '#38bdf8')}
              </svg>
              <span className="text-[9px] text-slate-400">拐角带顶端单凸起</span>
            </div>

            {/* Option C */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-300 mb-1">C (6块 双层)</span>
              <svg viewBox="0 0 110 90" className="w-24 h-20">
                {renderVoxelCluster(optCVoxels, 9, 55, 55, '#94a3b8')}
              </svg>
              <span className="text-[9px] text-slate-500">双层缺少顶层</span>
            </div>

            {/* Option D */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-300 mb-1">D (7块 平板)</span>
              <svg viewBox="0 0 110 90" className="w-24 h-20">
                {renderVoxelCluster(optDVoxels, 9, 55, 55, '#94a3b8')}
              </svg>
              <span className="text-[9px] text-slate-500">3×2单面平板</span>
            </div>
          </div>

          {(isAnswered || currentHintsLevel >= 1) && (
            <div className="text-[10px] text-amber-300/90 text-center bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 animate-in fade-in duration-300">
              守恒排除：27 - (11 + 9) = 7 块，排除 A (8块) 和 C (6块)；空间结构契合度比对：只有 B 具三层咬合构型。
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Questions List Sidebar (Desktop lg:w-80) / Top Bar (Mobile) */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/70 flex flex-col flex-shrink-0">
        {/* Track & Topic Filter Header */}
        <div className="p-3 lg:p-4 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">真题实训体系</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowStatsModal(true)}
                title="学习轨迹与数据管理"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                <span>档案</span>
              </button>
            </div>
          </div>

          {/* Primary Track Tabs */}
          <div className="grid grid-cols-5 gap-1 text-[11px] font-semibold">
            <button
              onClick={() => handleTrackChange('all')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTrack === 'all'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              全部 ({EXAM_QUESTIONS.length})
            </button>
            <button
              onClick={() => handleTrackChange('geometry')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTrack === 'geometry'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              几何 (10)
            </button>
            <button
              onClick={() => handleTrackChange('engineering')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTrack === 'engineering'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              工程 (3)
            </button>
            <button
              onClick={() => handleTrackChange('tools')}
              className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTrack === 'tools'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              工具 (2)
            </button>
            <button
              onClick={() => handleTrackChange('review')}
              className={`py-1.5 rounded-lg text-center transition-all relative cursor-pointer ${
                activeTrack === 'review'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-rose-300 hover:bg-slate-800'
              }`}
            >
              错题
              {reviewIds.length > 0 && (
                <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-rose-600 text-white font-mono">
                  {reviewIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Geometry Subcategory Filter */}
          {activeTrack === 'geometry' && (
            <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1 text-[11px] touch-pan-x">
              {[
                { key: 'all', label: '全部' },
                { key: 'origami', label: '折纸盒' },
                { key: 'assembly', label: '拼合' },
                { key: 'unfold', label: '展开' },
                { key: 'revolution', label: '旋转' },
                { key: 'cross_section', label: '截面' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setGeometryCategory(c.key);
                    const matched = EXAM_QUESTIONS.filter(
                      (q) => q.track === 'geometry' && (c.key === 'all' || q.category === c.key)
                    );
                    if (matched.length > 0) setActiveQuestionId(matched[0].id);
                  }}
                  className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    geometryCategory === c.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile: Horizontal Pills Bar */}
        <div className="flex lg:hidden p-2 bg-slate-950/80 border-b border-slate-800/80 gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
          {filteredQuestions.length === 0 ? (
            <div className="text-xs text-slate-500 py-1 px-2">暂无符合条件的题目</div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const rec = records[q.id];
              const isCurrent = currentQ && q.id === currentQ.id;

              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isCurrent
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500'
                      : rec
                      ? 'bg-slate-900 border-slate-700 text-slate-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>第{idx + 1}题</span>
                  {rec && rec.selectedAnswer && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        rec.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Desktop: Vertical Question Cards Sidebar (with flex-col to prevent horizontal squeeze) */}
        <div className="hidden lg:flex flex-col flex-1 overflow-y-auto p-3 space-y-2">
          {filteredQuestions.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <p className="text-xs font-medium">当前分类下暂无题目</p>
              {activeTrack === 'review' && (
                <p className="text-[11px] text-slate-500">
                  错题与待练本目前为空，继续做题保持手感！
                </p>
              )}
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const rec = records[q.id];
              const isCurrent = currentQ && q.id === currentQ.id;
              const answered = Boolean(rec && rec.selectedAnswer);

              return (
                <button
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                    isCurrent
                      ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10'
                      : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400">
                        第 {idx + 1} 题 · {q.subType}
                      </span>
                      {q.questionRole === 'variant' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                          变式
                        </span>
                      )}
                    </div>
                    {answered && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          rec.isCorrect
                            ? rec.hintsUsed === 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-teal-500/20 text-teal-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {rec.isCorrect
                          ? rec.hintsUsed === 0
                            ? '独立答对'
                            : '提示答对'
                          : '已答错'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-slate-200 line-clamp-1">{q.title}</div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{q.source}</span>
                    <span>难度: {q.difficulty}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Question & Solution View with min-w-0 */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 lg:p-8 flex flex-col gap-4 lg:gap-6 pb-16">
        {!currentQ ? (
          /* Empty State when no questions match filter */
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">当前分类下暂无题目</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                {activeTrack === 'review'
                  ? '恭喜！您的错题本已全部清空，无待复习题目。'
                  : '请选择其他专题开始练习。'}
              </p>
            </div>
            <button
              onClick={() => handleTrackChange('all')}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-500/25 transition-all cursor-pointer"
            >
              查看全部题库 ({EXAM_QUESTIONS.length} 题)
            </button>
          </div>
        ) : (
          <>
            {/* Variant Linking Banner */}
            {parentExample && (
              <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Compass className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>
                    🎯 本题是【<strong>{parentExample.title}</strong>】的独立变式练习题。
                  </span>
                </div>
                <button
                  onClick={() => setActiveQuestionId(parentExample.id)}
                  className="text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1 flex-shrink-0 ml-2 cursor-pointer"
                >
                  <span>← 查看原例题</span>
                </button>
              </div>
            )}

            {/* Question Header Card */}
            <div className="bg-slate-900/90 p-4 lg:p-6 rounded-2xl border border-slate-800 space-y-3 lg:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {currentQ.source}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">难度: {currentQ.difficulty}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentQ.unitName}
                  </span>
                </div>

                {/* 3D Simulator Jump or Review Operations */}
                <div className="flex items-center gap-2">
                  {currentQ.simulatorConfig && (
                    <button
                      onClick={() => {
                        if (!isAnswered) {
                          handleUnlockHint(2);
                        }
                        onLoadIntoSimulator(currentQ.simulatorConfig, currentQ.id, currentQ.title);
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>载入 3D 演练台直观复盘</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isAnswered && (
                    <button
                      onClick={() => handleReattempt(currentQ.id)}
                      title="清空当前作答重新测试（历史作答记录仍保留在档案中）"
                      className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">重做</span>
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-relaxed">
                {currentQ.questionText}
              </h2>

              {/* Inline Diagram (without early answer spoilers) */}
              {renderDiagram()}

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isChosen = selectedAnswer === opt.key;
                  const isThisCorrect = opt.key === currentQ.correctAnswer;

                  let btnClass =
                    'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200 cursor-pointer';

                  if (isAnswered) {
                    if (isThisCorrect) {
                      btnClass =
                        'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20';
                    } else if (isChosen) {
                      btnClass = 'bg-rose-500/20 border-rose-500 text-rose-300';
                    } else {
                      btnClass = 'opacity-40 border-slate-800 text-slate-500';
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-3.5 rounded-xl border text-left flex items-center justify-between text-xs lg:text-sm font-medium transition-all ${btnClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300">
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isAnswered && isThisCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {isAnswered && isChosen && !isThisCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3-Tier Progressive Hints Accordion */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs lg:text-sm font-bold text-amber-400">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>三阶递进式启发提示 (按需逐步解锁)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">
                    {isAnswered ? (
                      <>
                        作答时使用提示: <strong className="text-amber-300">{hintsUsedCount}</strong> 阶
                      </>
                    ) : (
                      <>
                        已解锁: <strong className="text-amber-300">{currentHintsLevel}/3</strong> 阶
                      </>
                    )}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      hintsUsedCount === 0
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {hintsUsedCount === 0 ? '独立答对模式' : '提示辅助模式'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {/* Tier 1: Relation hint */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center text-[10px]">
                        1
                      </span>
                      第 1 阶：核心数量/空间关系定位
                    </span>
                    {currentHintsLevel < 1 && !isAnswered && (
                      <button
                        onClick={() => handleUnlockHint(1)}
                        className="text-xs px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
                      >
                        解锁提示 1
                      </button>
                    )}
                  </div>
                  {(currentHintsLevel >= 1 || isAnswered) && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 animate-in fade-in duration-200">
                      {currentQ.stepHints.relation}
                    </p>
                  )}
                </div>

                {/* Tier 2: Representation hint */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                        2
                      </span>
                      第 2 阶：图解表征与模型建构 (展开图/工作格/条形)
                    </span>
                    {currentHintsLevel < 2 && !isAnswered && (
                      <button
                        onClick={() => handleUnlockHint(2)}
                        className="text-xs px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-lg transition-colors cursor-pointer"
                      >
                        解锁提示 2
                      </button>
                    )}
                  </div>
                  {(currentHintsLevel >= 2 || isAnswered) && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 animate-in fade-in duration-200">
                      {currentQ.stepHints.representation}
                    </p>
                  )}
                </div>

                {/* Tier 3: Formula skeleton hint */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">
                        3
                      </span>
                      第 3 阶：列式算式骨架填空
                    </span>
                    {currentHintsLevel < 3 && !isAnswered && (
                      <button
                        onClick={() => handleUnlockHint(3)}
                        className="text-xs px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
                      >
                        解锁提示 3
                      </button>
                    )}
                  </div>
                  {(currentHintsLevel >= 3 || isAnswered) && (
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 animate-in fade-in duration-200">
                      {currentQ.stepHints.formula}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Mistake Reflection & 5-Category Attribution (Shown when wrong) */}
            {isAnswered && !isCorrect && (
              <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-4 lg:p-5 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs lg:text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>错因反思 · 归因标签（选填，点击选择本题出错关键）</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {currentRecord?.errorReason
                      ? `已标记为：${ERROR_REASON_LABELS[currentRecord.errorReason]}`
                      : '未选择归因标签（可跳过）'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.entries(ERROR_REASON_LABELS) as [ErrorReason, string][]).map(
                    ([reasonKey, label]) => {
                      const isChosenReason = currentRecord?.errorReason === reasonKey;
                      return (
                        <button
                          key={reasonKey}
                          onClick={() => handleUpdateErrorReason(reasonKey)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                            isChosenReason
                              ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-950'
                              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Review Queue Mastery Management Card (Independent of isCorrect: accessible whenever question needs review) */}
            {isAnswered && (activeTrack === 'review' || reviewIdSet.has(currentQ.id)) && (
              <div className="bg-slate-900/90 border border-emerald-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>错题回练 · 掌握状态管理</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {currentRecord?.isMastered
                      ? '✓ 本题已被标记为掌握，已移出错题回练队列。'
                      : isCorrect
                      ? '🎉 本次重做作答正确！如已完全吃透考点和解题思路，可点击移出错题本：'
                      : '若已对照上方详细解析弄清错因并完全搞懂，可点击移出错题本：'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentRecord?.isMastered ? (
                    <span className="text-xs px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      已掌握 · 不在错题本
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkMastered(currentQ.id)}
                      className="text-xs px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      确认已掌握 · 移出错题本
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Example to Variants Recommendation */}
            {currentQ.questionRole === 'example' &&
              currentQ.variantIds &&
              currentQ.variantIds.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-950/50 to-slate-900/80 border border-indigo-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>方法迁移 · 典型例题变式拓展</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      已理解本题解法？立即做一做同类独立变式题检验掌握度：
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {currentQ.variantIds.map((varId, idx) => {
                      const varQ = EXAM_QUESTIONS.find((q) => q.id === varId);
                      if (!varQ) return null;
                      const varRec = records[varId];

                      return (
                        <button
                          key={varId}
                          onClick={() => setActiveQuestionId(varId)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                        >
                          <span>变式 {idx + 1}: {varQ.subType}</span>
                          {varRec && varRec.selectedAnswer && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                varRec.isCorrect ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                          )}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Dynamic Solution Section (Shown when answered or toggled) */}
            {isAnswered && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Status Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    isCorrect
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>
                          恭喜回答正确！{hintsUsedCount === 0 ? '独立完成，掌握牢固！' : '借助启发提示顺利推演！'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400" />
                        <span>回答错误，正确答案是 【{currentQ.correctAnswer}】</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setShowExplanation((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
                    }
                    className="text-xs underline font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {isExplVisible ? '折叠解析' : '展开完整解析'}
                  </button>
                </div>

                {isExplVisible && (
                  <div className="space-y-4">
                    {/* 1. Fast Trick Box */}
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>公考 30 秒秒杀绝技</span>
                      </div>
                      <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                        {currentQ.fastTrick}
                      </p>
                    </div>

                    {/* 2. Common Traps Box */}
                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>考生最容易踩的坑（雷区警示）</span>
                      </div>
                      <p className="text-xs text-rose-200/90 leading-relaxed">
                        {currentQ.commonTraps}
                      </p>
                    </div>

                    {/* 3. Detailed Step-by-Step Derivation */}
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                        <Lightbulb className="w-4 h-4" />
                        <span>严谨数学推导与空间拆解</span>
                      </div>

                      <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                        {currentQ.detailedAnalysis}
                      </div>

                      {currentQ.mathFormula && (
                        <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <MathView math={currentQ.mathFormula} block className="text-xs text-sky-300" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Learning Stats & Data Backup Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">个人学习档案与数据管理</h3>
                  <p className="text-xs text-slate-400">本地持久化存储 · 支持多设备导出备份</p>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">累计作答</span>
                <span className="font-mono text-xl font-bold text-white">{stats.totalAttempted}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-emerald-400 block">首次独立答对</span>
                <span className="font-mono text-xl font-bold text-emerald-400">
                  {stats.independentCorrect}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-sky-400 block">提示答对</span>
                <span className="font-mono text-xl font-bold text-sky-400">
                  {stats.hintAssistedCorrect}
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-rose-400 block">错题待练</span>
                <span className="font-mono text-xl font-bold text-rose-400">{reviewIds.length}</span>
              </div>
            </div>

            {/* Error Reasons Breakdown */}
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-300">错因归因分布统计</h4>
                {stats.uncategorizedCount > 0 && (
                  <span className="text-[11px] text-slate-500">
                    有 {stats.uncategorizedCount} 题尚未标记标签
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {(Object.entries(ERROR_REASON_LABELS) as [ErrorReason, string][]).map(
                  ([key, label]) => {
                    const count = stats.errorReasonDistribution[key] || 0;
                    const pct =
                      stats.wrongCount > 0 ? Math.round((count / stats.wrongCount) * 100) : 0;

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">{label}</span>
                          <span className="font-mono text-slate-300">
                            {count} 次 ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Backup / Export / Reset Buttons */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                  <span>导出学习数据 (JSON)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>导入备份数据</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFile}
                  accept=".json"
                  className="hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">重置所有记录</span>
                <button
                  onClick={handleClearAll}
                  className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  清空全部进度
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
