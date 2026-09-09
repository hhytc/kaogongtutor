import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { OrigamiViewer } from './components/OrigamiViewer';
import { AssemblyViewer } from './components/AssemblyViewer';
import { UnfoldingViewer } from './components/UnfoldingViewer';
import { RevolutionViewer } from './components/RevolutionViewer';
import { CrossSectionViewer } from './components/CrossSectionViewer';
import { ExamQuizModal } from './components/ExamQuizModal';
import { ExamCheatsheet } from './components/ExamCheatsheet';
import type { ExamQuestion } from './data/examQuestions';
import { learningStorage } from './utils/learningStorage';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('kaogong_active_tab');
      if (saved) return saved as ActiveTab;
    } catch {}
    return 'quiz';
  });

  useEffect(() => {
    try {
      localStorage.setItem('kaogong_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Question context for returning from 3D viewers back to quiz
  const [returnQuestion, setReturnQuestion] = useState<{
    id: string;
    title: string;
    tab: string;
  } | null>(null);

  // Target question ID to activate in quiz
  const [quizActiveQuestionId, setQuizActiveQuestionId] = useState<string | null>(null);

  // Review questions count for badge in Navbar
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const updateReviewBadge = () => {
      const needed = learningStorage.getQuestionsNeedingReview();
      setReviewCount(needed.length);
    };
    updateReviewBadge();
    const timer = setInterval(updateReviewBadge, 2000);
    return () => clearInterval(timer);
  }, [activeTab]);

  // Parameters passed when clicking "载入 3D 演练台" from Quiz
  const [origamiParams, setOrigamiParams] = useState<Record<string, any>>({});
  const [assemblyParams, setAssemblyParams] = useState<Record<string, any>>({});

  const [unfoldParams, setUnfoldParams] = useState<Record<string, any>>({
    mode: 'cylinder',
    radius: 2,
    height: 6,
    turns: 0.5,
  });

  const [revolutionParams, setRevolutionParams] = useState<Record<string, any>>({
    mode: 'trapezoid',
    topR: 2,
    bottomR: 5,
    height: 4,
  });

  const [crossSectionParams, setCrossSectionParams] = useState<Record<string, any>>({
    preset: 'triangle',
  });

  // Handler to load question into 3D simulator
  const handleLoadIntoSimulator = (
    config: ExamQuestion['simulatorConfig'],
    questionId: string,
    questionTitle: string
  ) => {
    if (!config) return;

    setReturnQuestion({
      id: questionId,
      title: questionTitle,
      tab: config.tab,
    });

    if (config.tab === 'origami') {
      if (config.params) setOrigamiParams(config.params);
      setActiveTab('origami');
    } else if (config.tab === 'assembly') {
      if (config.params) setAssemblyParams(config.params);
      setActiveTab('assembly');
    } else if (config.tab === 'unfold') {
      if (config.params) {
        setUnfoldParams({
          mode: config.mode,
          ...config.params,
        });
      } else if (config.mode) {
        setUnfoldParams((prev) => ({ ...prev, mode: config.mode }));
      }
      setActiveTab('unfold');
    } else if (config.tab === 'revolution') {
      if (config.params) {
        setRevolutionParams({
          mode: config.mode,
          ...config.params,
        });
      } else if (config.mode) {
        setRevolutionParams((prev) => ({ ...prev, mode: config.mode }));
      }
      setActiveTab('revolution');
    } else if (config.tab === 'cross_section') {
      if (config.params?.preset) {
        setCrossSectionParams({ preset: config.params.preset });
      }
      setActiveTab('cross_section');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'quiz' && returnQuestion) {
            setQuizActiveQuestionId(returnQuestion.id);
          }
        }}
        reviewCount={reviewCount}
      />

      {/* Floating Return Pill (when user jumped from a question into 3D simulator) */}
      {returnQuestion && activeTab !== 'quiz' && (
        <div className="fixed top-18 right-4 sm:right-6 z-40 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 border border-sky-500/40 rounded-2xl shadow-2xl shadow-sky-950/80 p-2.5 pl-3.5 pr-2 flex items-center gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="text-slate-400 hidden sm:inline">3D演练复盘中：</span>
              <span className="font-bold text-white max-w-[140px] sm:max-w-[220px] truncate">
                {returnQuestion.title}
              </span>
            </div>
            <button
              onClick={() => {
                setQuizActiveQuestionId(returnQuestion.id);
                setActiveTab('quiz');
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl shadow-md shadow-sky-500/25 transition-all cursor-pointer"
            >
              <span>返回原题</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setReturnQuestion(null)}
              className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="关闭悬浮条"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Module Content */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'origami' && (
          <OrigamiViewer
            key={JSON.stringify(origamiParams)}
            initialParams={origamiParams}
          />
        )}

        {activeTab === 'assembly' && (
          <AssemblyViewer
            key={JSON.stringify(assemblyParams)}
            initialParams={assemblyParams}
          />
        )}

        {activeTab === 'unfold' && (
          <UnfoldingViewer
            key={JSON.stringify(unfoldParams)}
            initialMode={unfoldParams.mode || 'cylinder'}
            initialParams={unfoldParams}
          />
        )}

        {activeTab === 'revolution' && (
          <RevolutionViewer
            key={JSON.stringify(revolutionParams)}
            initialMode={revolutionParams.mode || 'trapezoid'}
            initialParams={revolutionParams}
          />
        )}

        {activeTab === 'cross_section' && (
          <CrossSectionViewer
            key={JSON.stringify(crossSectionParams)}
            initialPreset={crossSectionParams.preset || 'triangle'}
          />
        )}

        {activeTab === 'quiz' && (
          <ExamQuizModal
            onLoadIntoSimulator={handleLoadIntoSimulator}
            initialQuestionId={quizActiveQuestionId}
          />
        )}

        {activeTab === 'cheatsheet' && (
          <ExamCheatsheet onSelectTab={(tab) => setActiveTab(tab)} />
        )}
      </main>
    </div>
  );
}

export default App;
