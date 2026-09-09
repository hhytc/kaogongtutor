import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Eye, Lightbulb, AlertTriangle, BookOpen, RotateCcw } from 'lucide-react';
import { EXAM_QUESTIONS, type ExamQuestion } from '../data/examQuestions';
import { MathView } from './MathView';

interface ExamQuizModalProps {
  onLoadIntoSimulator: (config: ExamQuestion['simulatorConfig']) => void;
}

export const ExamQuizModal: React.FC<ExamQuizModalProps> = ({ onLoadIntoSimulator }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Persist active question and answers in localStorage
  const [activeQuestionId, setActiveQuestionId] = useState<string>(() => {
    try {
      return localStorage.getItem('kaogong_quiz_active_id') || EXAM_QUESTIONS[0].id;
    } catch {
      return EXAM_QUESTIONS[0].id;
    }
  });

  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('kaogong_quiz_answers');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('kaogong_quiz_expl');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kaogong_quiz_active_id', activeQuestionId);
    } catch {}
  }, [activeQuestionId]);

  useEffect(() => {
    try {
      localStorage.setItem('kaogong_quiz_answers', JSON.stringify(userAnswers));
    } catch {}
  }, [userAnswers]);

  useEffect(() => {
    try {
      localStorage.setItem('kaogong_quiz_expl', JSON.stringify(showExplanation));
    } catch {}
  }, [showExplanation]);

  const handleResetQuiz = () => {
    if (confirm('确定要清空做题记录并重新练习吗？')) {
      setUserAnswers({});
      setShowExplanation({});
      try {
        localStorage.removeItem('kaogong_quiz_answers');
        localStorage.removeItem('kaogong_quiz_expl');
      } catch {}
    }
  };

  const filteredQuestions = EXAM_QUESTIONS.filter((q) => {
    if (selectedCategory === 'all') return true;
    return q.category === selectedCategory;
  });

  const currentQ = EXAM_QUESTIONS.find((q) => q.id === activeQuestionId) || filteredQuestions[0];
  const selectedAnswer = userAnswers[currentQ.id];
  const isAnswered = Boolean(selectedAnswer);
  const isCorrect = selectedAnswer === currentQ.correctAnswer;
  const isExplVisible = showExplanation[currentQ.id];

  const handleSelectOption = (key: string) => {
    if (isAnswered) return;
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
    setShowExplanation((prev) => ({ ...prev, [currentQ.id]: true }));

    if (key === currentQ.correctAnswer) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Render question diagrams
  const renderDiagram = () => {
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
          <div className="text-[10px] text-slate-500 mt-2 text-center">
            提示：同行隔一格必为【相对面】（★五角星 与 ■阴影方块；◎双圆环 与 ✕对角叉）
          </div>
        </div>
      );
    }

    if (currentQ.diagramType === 'assembly-q8') {
      return (
        <div className="my-3 p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col items-center">
          <div className="text-[11px] text-slate-400 mb-2 font-medium">【3×3×3 大正方体拼合示意 (目标 27 块小立方体)】</div>
          <svg viewBox="0 0 280 110" className="w-72 max-w-full h-auto drop-shadow-md">
            <g transform="translate(10, 10)">
              <rect width="120" height="85" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" rx="8" />
              <text x="60" y="26" fill="#93c5fd" fontSize="11" fontWeight="bold" textAnchor="middle">图① + 图② (已有)</text>
              <text x="60" y="52" fill="#e2e8f0" fontSize="18" fontWeight="bold" textAnchor="middle">20 块</text>
              <text x="60" y="73" fill="#64748b" fontSize="9" textAnchor="middle">底层缺3 + 中层缺3 + 顶层缺1</text>
            </g>
            <text x="140" y="60" fill="#64748b" fontSize="20" fontWeight="bold" textAnchor="middle">+</text>
            <g transform="translate(150, 10)">
              <rect width="120" height="85" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" rx="8" />
              <text x="60" y="26" fill="#6ee7b7" fontSize="11" fontWeight="bold" textAnchor="middle">待拼合选项 (缺口)</text>
              <text x="60" y="52" fill="#34d399" fontSize="18" fontWeight="bold" textAnchor="middle">7 块</text>
              <text x="60" y="73" fill="#a7f3d0" fontSize="9" textAnchor="middle">27 - 20 = 7 块凹凸互补</text>
            </g>
          </svg>
          <div className="text-[10px] text-slate-500 mt-2 text-center">
            第一步按数量守恒排除：目标 27 - (11 + 9) = 7 块，排除 A (8块) 和 C (6块)
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Left Questions List Sidebar (Desktop) / Top Horizontal Question Bar (Mobile) */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/60 flex flex-col flex-shrink-0">
        {/* Category Filters */}
        <div className="p-3 lg:p-4 border-b border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2 lg:mb-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">真题题库</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono font-medium">
                共 {filteredQuestions.length} 道
              </span>
              <button
                onClick={handleResetQuiz}
                title="清空做题进度与答题记录"
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 text-xs touch-pan-x">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setSelectedCategory('origami')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'origami'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              折纸盒
            </button>
            <button
              onClick={() => setSelectedCategory('assembly')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'assembly'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              立体拼合
            </button>
            <button
              onClick={() => setSelectedCategory('unfold')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'unfold'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              展开路径
            </button>
            <button
              onClick={() => setSelectedCategory('revolution')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'revolution'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              旋转体
            </button>
            <button
              onClick={() => setSelectedCategory('cross_section')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === 'cross_section'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              空间截面
            </button>
          </div>
        </div>

        {/* Mobile: Horizontal Question Number Pills Bar */}
        <div className="flex lg:hidden p-2 bg-slate-950/80 border-b border-slate-800/80 gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
          {filteredQuestions.map((q, idx) => {
            const answered = userAnswers[q.id];
            const isCurrent = q.id === currentQ.id;

            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isCurrent
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500'
                    : answered
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <span>第{idx + 1}题</span>
                {answered && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      answered === q.correctAnswer ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop: Vertical Question Cards Sidebar */}
        <div className="hidden lg:flex flex-1 overflow-y-auto p-3 space-y-2">
          {filteredQuestions.map((q, idx) => {
            const answered = userAnswers[q.id];
            const correct = answered === q.correctAnswer;
            const isCurrent = q.id === currentQ.id;

            return (
              <button
                key={q.id}
                onClick={() => setActiveQuestionId(q.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                  isCurrent
                    ? 'bg-sky-500/10 border-sky-500 shadow-lg shadow-sky-500/10'
                    : 'bg-slate-900/80 border-slate-800/80 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    第 {idx + 1} 题 · {q.subType}
                  </span>
                  {answered && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {correct ? '正确' : '已答错'}
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-slate-200 line-clamp-1">{q.title}</div>
                <div className="text-[10px] text-slate-500">{q.source}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question & Solution View */}
      <div className="flex-1 h-full overflow-y-auto p-4 lg:p-8 flex flex-col gap-4 lg:gap-6 pb-12">
        {/* Question Header */}
        <div className="bg-slate-900/90 p-4 lg:p-6 rounded-2xl border border-slate-800 space-y-3 lg:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {currentQ.source}
              </span>
              <span className="text-xs text-slate-400 font-medium">难度: {currentQ.difficulty}</span>
            </div>

            {/* Load directly to 3D simulator */}
            <button
              onClick={() => onLoadIntoSimulator(currentQ.simulatorConfig)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>载入 3D 演练台直观复盘</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white leading-relaxed">
            {currentQ.questionText}
          </h2>

          {/* Inline Graphic Diagram (if question has diagram) */}
          {renderDiagram()}

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt) => {
              const isChosen = selectedAnswer === opt.key;
              const isThisCorrect = opt.key === currentQ.correctAnswer;

              let btnClass =
                'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-200';

              if (isAnswered) {
                if (isThisCorrect) {
                  btnClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20';
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
                    <span>恭喜回答正确！秒杀直觉很敏锐！</span>
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
                className="text-xs underline font-medium text-slate-400 hover:text-slate-200"
              >
                {isExplVisible ? '折叠解析' : '展开完整推演'}
              </button>
            </div>

            {isExplVisible && (
              <div className="space-y-4">
                {/* 1. Fast Trick Box (秒杀秘籍) */}
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>公考 30 秒秒杀绝技</span>
                  </div>
                  <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                    {currentQ.fastTrick}
                  </p>
                </div>

                {/* 2. Common Traps Box (高频雷区) */}
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
      </div>
    </div>
  );
};
