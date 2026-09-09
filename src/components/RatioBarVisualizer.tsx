import React, { useState } from 'react';
import { Layers } from 'lucide-react';

interface RatioBarProps {
  initialTotal?: number;
  partA?: number;
  partB?: number;
  labelA?: string;
  labelB?: string;
  unitLabel?: string;
}

export const RatioBarVisualizer: React.FC<RatioBarProps> = ({
  initialTotal = 80,
  partA = 3,
  partB = 5,
  labelA = '甲部门人数',
  labelB = '乙部门人数',
  unitLabel = '人',
}) => {
  const [total, setTotal] = useState<number>(initialTotal);
  const totalParts = partA + partB;
  const unitValue = total / totalParts;
  const valueA = partA * unitValue;
  const valueB = partB * unitValue;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 space-y-4">
      <div className="border-b border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>数量关系“份数法”直观拆解 ({partA} : {partB})</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          将总数划分为等额的“份数”，求出 <strong>每份代表的实际量</strong>，化繁为简。
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">总量</span>
          <span className="font-mono text-base font-bold text-white">{total} {unitLabel}</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">总份数 (A+B)</span>
          <span className="font-mono text-base font-bold text-sky-400">{partA} + {partB} = {totalParts} 份</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">核心：每 1 份代表</span>
          <span className="font-mono text-base font-bold text-emerald-400">{unitValue.toFixed(1)} {unitLabel}</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px] block">两量差值 (B - A)</span>
          <span className="font-mono text-base font-bold text-amber-400">
            {(partB - partA) * unitValue} {unitLabel} ({partB - partA} 份)
          </span>
        </div>
      </div>

      {/* Proportional Segment Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>份数条形图划分：</span>
          <span className="font-mono text-slate-300">
            {labelA}: <strong className="text-sky-400">{valueA.toFixed(0)}{unitLabel}</strong> vs {labelB}: <strong className="text-emerald-400">{valueB.toFixed(0)}{unitLabel}</strong>
          </span>
        </div>

        {/* Outer bar container */}
        <div className="flex h-12 w-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-1 gap-1">
          {/* Part A segments */}
          {Array.from({ length: partA }).map((_, i) => (
            <div
              key={`a-${i}`}
              className="flex-1 bg-sky-500/80 border border-sky-400 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono text-white"
              title={`甲 1 份 = ${unitValue.toFixed(1)}`}
            >
              <span>1份</span>
              <span className="text-[8px] text-sky-200">({unitValue.toFixed(0)})</span>
            </div>
          ))}

          {/* Part B segments */}
          {Array.from({ length: partB }).map((_, i) => (
            <div
              key={`b-${i}`}
              className="flex-1 bg-emerald-500/80 border border-emerald-400 rounded-lg flex flex-col items-center justify-center text-[10px] font-mono text-white"
              title={`乙 1 份 = ${unitValue.toFixed(1)}`}
            >
              <span>1份</span>
              <span className="text-[8px] text-emerald-200">({unitValue.toFixed(0)})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive slider for test total */}
      <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 whitespace-nowrap">调整实际总量测试：</span>
        <input
          type="range"
          min="16"
          max="160"
          step={totalParts}
          value={total}
          onChange={(e) => setTotal(parseInt(e.target.value))}
          className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />
        <span className="font-mono font-bold text-emerald-400 w-12 text-right">{total}</span>
      </div>
    </div>
  );
};
