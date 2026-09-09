import React from 'react';
import { CHEATSHEETS } from '../data/cheatsheets';
import { MathView } from './MathView';
import { Sparkles, ArrowRight, Zap, Target } from 'lucide-react';

interface ExamCheatsheetProps {
  onSelectTab: (tab: 'unfold' | 'revolution' | 'cross_section' | 'origami' | 'assembly') => void;
}

export const ExamCheatsheet: React.FC<ExamCheatsheetProps> = ({ onSelectTab }) => {
  return (
    <div className="w-full h-[calc(100vh-5rem)] bg-slate-950 overflow-y-auto p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>考前 10 分钟冲刺 · 直觉速成秘籍</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            公考行测数量 & 图推 · 3D空间秒杀定律卡
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            空间思维考场上时间紧迫，切忌凭空虚构空间形状！牢记以下五大核心模型的结构规律，把复杂推演压缩到 30 秒内秒选。
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHEATSHEETS.map((card) => {
            let borderHover = 'hover:border-sky-500/50';
            let bgGlow = 'from-sky-500/10';
            let badgeBg = 'bg-sky-500/20 text-sky-300 border-sky-500/30';

            if (card.category === 'origami') {
              borderHover = 'hover:border-indigo-500/50';
              bgGlow = 'from-indigo-500/10';
              badgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            } else if (card.category === 'assembly') {
              borderHover = 'hover:border-amber-500/50';
              bgGlow = 'from-amber-500/10';
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            } else if (card.category === 'revolution') {
              borderHover = 'hover:border-purple-500/50';
              bgGlow = 'from-purple-500/10';
              badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            } else if (card.category === 'cross_section') {
              borderHover = 'hover:border-rose-500/50';
              bgGlow = 'from-rose-500/10';
              badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            }

            return (
              <div
                key={card.id}
                className={`bg-gradient-to-b ${bgGlow} to-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between transition-all duration-300 ${borderHover} hover:shadow-xl hover:shadow-slate-950/50`}
              >
                <div className="space-y-4">
                  {/* Top Category Badge & Title */}
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}>
                      {card.category === 'origami' && '折纸盒重构'}
                      {card.category === 'assembly' && '立体拼合'}
                      {card.category === 'unfold' && '表面展开'}
                      {card.category === 'revolution' && '旋转动态'}
                      {card.category === 'cross_section' && '空间截面'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{card.title}</h3>
                  </div>

                  {/* Slogan Pill */}
                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="font-bold text-xs text-amber-300 tracking-wide">
                      {card.slogan}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed">{card.description}</p>

                  {/* Rules Bullet list */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    {card.rules.map((r, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 font-mono mt-0.5">•</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Key Formula */}
                  {card.formula && (
                    <div className="pt-2">
                      <div className="text-[11px] text-slate-500 font-semibold mb-1">核心秒杀公式：</div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <MathView math={card.formula} block className="text-xs text-slate-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Jump to Simulator */}
                <div className="pt-6">
                  <button
                    onClick={() => onSelectTab(card.category)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>前往 3D 实景演练台</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
