import { useState } from 'react';
import { Navbar, type ActiveTab } from './components/Navbar';
import { OrigamiViewer } from './components/OrigamiViewer';
import { AssemblyViewer } from './components/AssemblyViewer';
import { UnfoldingViewer } from './components/UnfoldingViewer';
import { RevolutionViewer } from './components/RevolutionViewer';
import { CrossSectionViewer } from './components/CrossSectionViewer';
import { ExamQuizModal } from './components/ExamQuizModal';
import { ExamCheatsheet } from './components/ExamCheatsheet';
import type { ExamQuestion } from './data/examQuestions';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('origami');

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
  const handleLoadIntoSimulator = (config: ExamQuestion['simulatorConfig']) => {
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
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

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
          <ExamQuizModal onLoadIntoSimulator={handleLoadIntoSimulator} />
        )}

        {activeTab === 'cheatsheet' && (
          <ExamCheatsheet onSelectTab={(tab) => setActiveTab(tab)} />
        )}
      </main>
    </div>
  );
}

export default App;
