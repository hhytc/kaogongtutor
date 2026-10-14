import React, { useState } from 'react';
import { BookOpen, ChevronDown, Clock3, Target } from 'lucide-react';
import { SPATIAL_TOPICS, type SpatialCategory } from '../data/spatialTopics';

export interface SpatialTopicCount {
  category: SpatialCategory;
  total: number;
  realExam: number;
  original: number;
}

interface SpatialTrainingHubProps {
  counts: SpatialTopicCount[];
  activeCategory?: string;
  onPractice: (category: SpatialCategory) => void;
  onTimedTest: (category: SpatialCategory) => void;
}

export const SpatialTrainingHub: React.FC<SpatialTrainingHubProps> = ({
  counts,
  activeCategory,
  onPractice,
  onTimedTest,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-2xl border border-sky-900/70 bg-slate-900/80 shadow-lg shadow-sky-950/20">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left sm:px-4"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Target className="h-4 w-4 shrink-0 text-sky-400" />
          <span className="min-w-0">
            <span className="block text-xs font-bold text-white">空间推理专项训练</span>
            <span className="block truncate text-[10px] text-slate-400">五类空间题型 · 专题练习与限时测验</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-slate-800 px-3 py-3 sm:px-4">
          <p className="text-[11px] leading-relaxed text-slate-300">
            官方大纲列明“图形推理”，并给出立体截面例题；下面五类是结合近年国考真题归纳的空间专项分类。题库标明近五年国考回忆题或原创训练题，回忆题答案以收录材料为准。
          </p>
          <div className="grid gap-2 xl:grid-cols-2">
            {SPATIAL_TOPICS.map((topic) => {
              const count = counts.find((item) => item.category === topic.category);
              const selected = activeCategory === topic.category;
              return (
                <article key={topic.category} className={`rounded-xl border p-3 ${selected ? 'border-sky-700 bg-sky-950/25' : 'border-slate-800 bg-slate-950/50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white">{topic.title}</h4>
                      <p className="mt-1 text-[10px] text-slate-400">{topic.examScope}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300">
                      {count?.total ?? 0} 题
                    </span>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-[10px] leading-relaxed text-slate-300">
                    {topic.focus.map((item) => <li key={item}>· {item}</li>)}
                  </ul>
                  <p className="mt-2 text-[9px] text-slate-500">
                    国考回忆题 {count?.realExam ?? 0} · 原创训练 {count?.original ?? 0}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setExpanded(false);
                        onPractice(topic.category);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                      <BookOpen className="h-3 w-3" /> 专题练习
                    </button>
                    <button
                      type="button"
                      onClick={() => onTimedTest(topic.category)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-600/70 bg-indigo-950/60 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-200 hover:bg-indigo-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <Clock3 className="h-3 w-3" /> 限时测验
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="border-t border-slate-800 pt-2 text-[10px] leading-relaxed text-slate-500">
            表面展开最短路、旋转体等几何计算保留为拓展练习；不计入本专项五类题型的覆盖统计与限时测验。
          </p>
        </div>
      )}
    </section>
  );
};
