import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Sparkles, ArrowRight, Eye, Lightbulb, AlertTriangle, BookOpen } from 'lucide-react';
import { EXAM_QUESTIONS, type ExamQuestion } from '../data/examQuestions';
import { MathView } from './MathView';

interface ExamQuizModalProps {
  onLoadIntoSimulator: (config: ExamQuestion['simulatorConfig']) => void;
}

export const ExamQuizModal: React.FC<ExamQuizModalProps> = ({ onLoadIntoSimulator }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeQuestionId, setActiveQuestionId] = useState<string>(EXAM_QUESTIONS[0].id);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});

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
            <span className="text-[11px] text-slate-400 font-mono font-medium">
              共 {filteredQuestions.length} 道
            </span>
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
