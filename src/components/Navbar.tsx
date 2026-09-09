import React from 'react';
import { Box, RefreshCw, Scissors, Award, BookMarked, Layers, Puzzle } from 'lucide-react';

export type ActiveTab = 'unfold' | 'revolution' | 'cross_section' | 'origami' | 'assembly' | 'quiz' | 'cheatsheet';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 lg:px-8 py-2 lg:py-0 lg:h-16 flex flex-col lg:flex-row lg:items-center justify-between z-30 sticky top-0 gap-2 lg:gap-4">
      {/* Brand Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
            <Box className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-sm lg:text-base text-white tracking-tight">
              公考几何 3D 透视台
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              行测空间秒杀
            </span>
          </div>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 overflow-x-auto no-scrollbar max-w-full touch-pan-x">
        <button
          onClick={() => onTabChange('origami')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'origami'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>折纸盒重构</span>
        </button>

        <button
          onClick={() => onTabChange('assembly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'assembly'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Puzzle className="w-3.5 h-3.5" />
          <span>立体拼合</span>
        </button>

        <button
          onClick={() => onTabChange('unfold')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'unfold'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>表面展开</span>
        </button>

        <button
          onClick={() => onTabChange('revolution')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'revolution'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>旋转体</span>
        </button>

        <button
          onClick={() => onTabChange('cross_section')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'cross_section'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>截面切切乐</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1 hidden md:block" />

        <button
          onClick={() => onTabChange('quiz')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'quiz'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
              : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>真题实训</span>
        </button>

        <button
          onClick={() => onTabChange('cheatsheet')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === 'cheatsheet'
              ? 'bg-slate-800 text-slate-100 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>秒杀定律</span>
        </button>
      </nav>
    </header>
  );
};
