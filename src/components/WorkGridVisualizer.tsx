import React, { useState } from 'react';
import { RotateCcw, Users } from 'lucide-react';

interface WorkGridProps {
  totalWork?: number;
  workerAEff?: number;
  workerBEff?: number;
  initialScenario?: 'cooperate' | 'phase' | 'alternate';
  showSolution?: boolean;
}

export const WorkGridVisualizer: React.FC<WorkGridProps> = ({
  totalWork = 60,
  workerAEff = 3,
  workerBEff = 2,
  initialScenario = 'cooperate',
  showSolution = false,
}) => {
  const [scenario, setScenario] = useState<'cooperate' | 'phase' | 'alternate'>(initialScenario);
  const [currentDay, setCurrentDay] = useState<number>(0);

  // Determine daily contributions based on scenario
  // Scenario 1: Cooperate: every day A does 3, B does 2 (total 5)
  // Scenario 2: Phase: Days 1-5: A only (3/day, 15 total); Day 6 onwards: A+B (5/day)
  // Scenario 3: Alternate: Day 1 A (3), Day 2 B (2), Day 3 A (3)...

  const getDayPlan = () => {
    const plan: { day: number; aWork: number; bWork: number }[] = [];
    let accumulated = 0;
    let d = 1;

    while (accumulated < totalWork && d <= 30) {
      let a = 0;
      let b = 0;

      if (scenario === 'cooperate') {
        a = workerAEff;
        b = workerBEff;
      } else if (scenario === 'phase') {
        if (d <= 5) {
          a = workerAEff;
          b = 0;
        } else {
          a = workerAEff;
          b = workerBEff;
        }
      } else if (scenario === 'alternate') {
        if (d % 2 === 1) {
          a = workerAEff;
          b = 0;
        } else {
          a = 0;
          b = workerBEff;
        }
      }

      // Check if finished partially on this day
      const remaining = totalWork - accumulated;
      if (a + b > remaining) {
        if (a >= remaining) {
          a = remaining;
          b = 0;
        } else {
          b = remaining - a;
        }
      }

      accumulated += a + b;
      plan.push({ day: d, aWork: a, bWork: b });
      d++;
    }
    return plan;
  };

  const plan = getDayPlan();
  const totalDaysNeeded = plan.length;

  // Calculate current grid fill up to currentDay
  let filledA = 0;
  let filledB = 0;
  for (let i = 0; i < Math.min(currentDay, plan.length); i++) {
    filledA += plan[i].aWork;
    filledB += plan[i].bWork;
  }
  const totalFilled = filledA + filledB;
  const isFinished = totalFilled >= totalWork;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 space-y-4">
      {/* Header & Scenario Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>工程问题“工作格”图解（特值法 $W={totalWork}$）</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            设工作总量为天数的公倍数 {totalWork} 格，甲效率 {workerAEff} 格/天，乙效率 {workerBEff} 格/天。
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => { setScenario('cooperate'); setCurrentDay(0); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              scenario === 'cooperate' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            两人合作
          </button>
          <button
            onClick={() => { setScenario('phase'); setCurrentDay(0); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              scenario === 'phase' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            甲先做5天后合作
          </button>
          <button
            onClick={() => { setScenario('alternate'); setCurrentDay(0); }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              scenario === 'alternate' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            甲乙轮流交替
          </button>
        </div>
      </div>

      {/* Progress & Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">当前进行天数</span>
          <span className="font-mono text-base font-bold text-white">第 {currentDay} 天</span>
          <span className="text-[10px] text-slate-500 block">
            {showSolution
              ? `共需 ${totalDaysNeeded} 天完工`
              : isFinished
              ? `推演完成！共耗时 ${currentDay} 天`
              : '拖动下方滑块推演进度'}
          </span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">甲完成工作量</span>
          <span className="font-mono text-base font-bold text-sky-400">{filledA} 格</span>
          <span className="text-[10px] text-sky-400/80 block">效率 {workerAEff} 格/天</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">乙完成工作量</span>
          <span className="font-mono text-base font-bold text-amber-400">{filledB} 格</span>
          <span className="text-[10px] text-amber-400/80 block">效率 {workerBEff} 格/天</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">总工程进度</span>
          <span className={`font-mono text-base font-bold ${isFinished ? 'text-emerald-400' : 'text-slate-200'}`}>
            {totalFilled} / {totalWork} 格
          </span>
          <span className="text-[10px] text-slate-400 block">{((totalFilled / totalWork) * 100).toFixed(0)}% 已完成</span>
        </div>
      </div>

      {/* 60-Cell Grid Visualizer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>工作格总览 (每格代表 1 单位工作量)：</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
              <span>甲贡献 ({filledA})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>乙贡献 ({filledB})</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
              <span>待完工 ({totalWork - totalFilled})</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 sm:grid-cols-20 gap-1 p-3 bg-slate-950 rounded-xl border border-slate-800">
          {Array.from({ length: totalWork }).map((_, idx) => {
            let colorClass = 'bg-slate-800/80 border-slate-700/40';
            if (idx < filledA) {
              colorClass = 'bg-sky-500 border-sky-400 text-sky-950 font-bold';
            } else if (idx < filledA + filledB) {
              colorClass = 'bg-amber-500 border-amber-400 text-amber-950 font-bold';
            }

            return (
              <div
                key={idx}
                className={`h-6 sm:h-7 rounded-md border flex items-center justify-center text-[10px] font-mono transition-all duration-300 ${colorClass}`}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Slider & Stepper */}
      <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setCurrentDay((d) => Math.max(0, d - 1))}
          disabled={currentDay <= 0}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40"
        >
          上一天
        </button>

        <input
          type="range"
          min="0"
          max={totalDaysNeeded}
          step="1"
          value={currentDay}
          onChange={(e) => setCurrentDay(parseInt(e.target.value))}
          className="flex-1 accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        <button
          onClick={() => setCurrentDay((d) => Math.min(totalDaysNeeded, d + 1))}
          disabled={currentDay >= totalDaysNeeded}
          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold disabled:opacity-40"
        >
          下一天
        </button>

        <button
          onClick={() => setCurrentDay(0)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          title="重置进度"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
