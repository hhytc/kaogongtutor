import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertOctagon,
  BookOpen,
  Crown,
  MousePointerClick,
  RefreshCw,
  GraduationCap,
  Compass,
  ChevronRight,
  ChevronLeft,
  Camera,
  Check,
  HelpCircle,
} from 'lucide-react';
import { learningStorage, type SavedSpatialIntuitionProgress } from '../utils/learningStorage';

export type NetType = '1-4-1' | '2-3-1' | '2-2-2' | '3-3';

interface OrigamiViewerProps {
  initialMode?: string;
  initialParams?: Record<string, any>;
}

interface FacePattern {
  id: number;
  letter: string;
  name: string;
  color: string;
  oppositeId: number;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

const PATTERNS: FacePattern[] = [
  {
    id: 0,
    letter: 'A',
    name: 'A面 · 双同心圆',
    color: '#0284c7',
    oppositeId: 2,
    draw: (ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, s * 0.18, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  {
    id: 1,
    letter: 'B',
    name: 'B面 · 红色右箭头',
    color: '#ef4444',
    oppositeId: 3,
    draw: (ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(s * 0.2, s * 0.38);
      ctx.lineTo(s * 0.55, s * 0.38);
      ctx.lineTo(s * 0.55, s * 0.22);
      ctx.lineTo(s * 0.85, s * 0.5);
      ctx.lineTo(s * 0.55, s * 0.78);
      ctx.lineTo(s * 0.55, s * 0.62);
      ctx.lineTo(s * 0.2, s * 0.62);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 2,
    letter: 'C',
    name: 'C面 · 金色五角星',
    color: '#f59e0b',
    oppositeId: 0,
    draw: (ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      const cx = s / 2;
      const cy = s / 2;
      const spikes = 5;
      const outerR = s * 0.38;
      const innerR = s * 0.18;
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerR;
        y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: 3,
    letter: 'D',
    name: 'D面 · 黑色实心方',
    color: '#1e293b',
    oppositeId: 1,
    draw: (ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(s * 0.25, s * 0.25, s * 0.5, s * 0.5);
    },
  },
  {
    id: 4,
    letter: 'E',
    name: 'E面 · 紫色对角大叉',
    color: '#8b5cf6',
    oppositeId: 5,
    draw: (ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = s * 0.12;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.22, s * 0.22);
      ctx.lineTo(s * 0.78, s * 0.78);
      ctx.moveTo(s * 0.78, s * 0.22);
      ctx.lineTo(s * 0.22, s * 0.78);
      ctx.stroke();
    },
  },
  {
    id: 5,
    letter: 'F',
    name: 'F面 · 对角半黑半白',
    color: '#10b981',
    oppositeId: 4,
    draw: (ctx, s) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.closePath();
      ctx.fill();
    },
  },
];

const FaceThumbnail: React.FC<{ pattern: FacePattern; size?: number; className?: string }> = ({
  pattern,
  size = 36,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    pattern.draw(ctx, size);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  }, [pattern, size]);

  return (
    <div className={`relative flex-shrink-0 inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-md shadow-sm block"
      />
      <span className="absolute -top-1 -left-1 px-1 py-0.2 text-[9px] font-black bg-slate-900 text-sky-300 rounded border border-slate-700 shadow-sm leading-tight">
        {pattern.letter}
      </span>
    </div>
  );
};

interface NetDefinition {
  faces: Record<number, [number, number]>;
  edges: [number, number][];
}

const NET_DEFINITIONS: Record<NetType, NetDefinition> = {
  '1-4-1': {
    faces: {
      0: [0, 0],   // Top
      1: [0, 1],   // Front
      2: [0, 2],   // Bottom
      3: [0, -1],  // Back
      4: [-1, 0],  // Left
      5: [1, 0],   // Right
    },
    edges: [
      [0, 1],
      [1, 2],
      [0, 3],
      [0, 4],
      [0, 5],
    ],
  },
  '2-3-1': {
    faces: {
      0: [0, 0],
      1: [0, 1],
      5: [1, 0],
      2: [2, 0],
      3: [0, -1],
      4: [-1, -1],
    },
    edges: [
      [0, 1],
      [0, 5],
      [5, 2],
      [0, 3],
      [3, 4],
    ],
  },
  '2-2-2': {
    faces: {
      0: [0, 0],
      3: [0, -1],
      4: [-1, -1],
      5: [1, 0],
      1: [1, 1],
      2: [2, 1],
    },
    edges: [
      [0, 3],
      [3, 4],
      [0, 5],
      [5, 1],
      [1, 2],
    ],
  },
  '3-3': {
    faces: {
      3: [0, 0],
      4: [-1, 0],
      5: [1, 0],
      0: [1, 1],
      1: [2, 1],
      2: [3, 1],
    },
    edges: [
      [3, 4],
      [3, 5],
      [5, 0],
      [0, 1],
      [1, 2],
    ],
  },
};

interface GuidedStep3Case {
  id: number;
  title: string;
  targetFaceId: number;
  targetFaceLetter: string;
  targetEdgeName: string;
  matchingFaceId: number;
  matchingFaceLetter: string;
  matchingEdgeName: string;
  targetEdge: { axis: 'x' | 'z'; offset: number };
  matchingEdge: { axis: 'x' | 'z'; offset: number };
  options: { key: string; name: string; desc: string; correct: boolean }[];
  explanation: string;
}

const GUIDED_STEP3_CASES: GuidedStep3Case[] = [
  {
    id: 0,
    title: '案例 1 (经典)：B面右边 ➔ F面底边',
    targetFaceId: 1,
    targetFaceLetter: 'B',
    targetEdgeName: 'B面 · 红色右箭头【右侧边】',
    matchingFaceId: 5,
    matchingFaceLetter: 'F',
    matchingEdgeName: 'F面 · 半黑半白【底侧边】',
    targetEdge: { axis: 'x', offset: 1 },
    matchingEdge: { axis: 'z', offset: 1 },
    options: [
      { key: 'F', name: 'F面 · 对角半黑半白', desc: '右翼折起90°向内翻卷贴合', correct: true },
      { key: 'D', name: 'D面 · 黑色实心方', desc: '在最上端折向后方，无法相交', correct: false },
      { key: 'C', name: 'C面 · 金色五角星', desc: '位于最下端底面，平行相对', correct: false },
    ],
    explanation: 'B 面向前折起 90°，F 面向右向上翻折 90°。两条外围边缘在立体盒子的侧棱处严密对接缝合，成为同一条空间公共棱！',
  },
  {
    id: 1,
    title: '案例 2 (变式)：E面上边 ➔ D面左边',
    targetFaceId: 4,
    targetFaceLetter: 'E',
    targetEdgeName: 'E面 · 紫色大叉【上侧边】',
    matchingFaceId: 3,
    matchingFaceLetter: 'D',
    matchingEdgeName: 'D面 · 黑色实心方【左侧边】',
    targetEdge: { axis: 'z', offset: -1 },
    matchingEdge: { axis: 'x', offset: -1 },
    options: [
      { key: 'D', name: 'D面 · 黑色实心方', desc: '上方D面向后折起，左侧边贴合', correct: true },
      { key: 'B', name: 'B面 · 红色右箭头', desc: '在前侧，方向朝下无法碰合', correct: false },
      { key: 'C', name: 'C面 · 金色五角星', desc: '在最底端，隔着两格', correct: false },
    ],
    explanation: 'E 面向左折起 90°，D 面向后折起 90°。展开图上看似分开的外围直角边缘，在左后侧棱严密对接汇合！',
  },
  {
    id: 2,
    title: '案例 3 (变式)：C面右边 ➔ F面右边',
    targetFaceId: 2,
    targetFaceLetter: 'C',
    targetEdgeName: 'C面 · 金色五角星【右侧边】',
    matchingFaceId: 5,
    matchingFaceLetter: 'F',
    matchingEdgeName: 'F面 · 半黑半白【右侧边】',
    targetEdge: { axis: 'x', offset: 1 },
    matchingEdge: { axis: 'x', offset: 1 },
    options: [
      { key: 'F', name: 'F面 · 对角半黑半白', desc: '右翼向右向下翻折贴合底面', correct: true },
      { key: 'A', name: 'A面 · 双同心圆', desc: '基准面，与C平行正对不接触', correct: false },
      { key: 'E', name: 'E面 · 紫色大叉', desc: '在左翼，与右侧边互不接触', correct: false },
    ],
    explanation: 'C 面顺次折到底面，F 面从右侧翻折包覆。两条边缘在右底侧棱精准对接重合！',
  },
];

interface GuidedStep4Case {
  id: number;
  vertexName: string;
  title: string;
  faces: number[];
  mainVertexFaceId: number;
  mainVertexPos: [number, number];
  beadPositions: { faceId: number; pos: [number, number]; color: number }[];
  options: { key: string; label: string; correct: boolean; desc: string }[];
  explanation: string;
}

const GUIDED_STEP4_CASES: GuidedStep4Case[] = [
  {
    id: 0,
    vertexName: '顶点 P (左前)',
    title: '顶点 P：A面角隅 (左前)',
    faces: [0, 1, 4],
    mainVertexFaceId: 0,
    mainVertexPos: [-1, 1],
    beadPositions: [
      { faceId: 1, pos: [-1, -1], color: 0x38bdf8 },
      { faceId: 4, pos: [1, 1], color: 0xa855f7 },
    ],
    options: [
      { key: 'A-B-E', label: 'A面 + B面 + E面', correct: true, desc: '基准底面 + 前面 + 左面' },
      { key: 'A-B-F', label: 'A面 + B面 + F面', correct: false, desc: 'F在右侧，无法到达左前角' },
      { key: 'A-C-E', label: 'A面 + C面 + E面', correct: false, desc: 'A与C是相对面，永不共顶点' },
    ],
    explanation: '顶点 P 位于 A 面的左前角。折成立体盒后，A(基准)、B(前)、E(左) 三个相邻面在此顶点紧密汇聚！围绕顶点 P 顺时针看为 A ➔ E ➔ B，平面与立体时针方向保持不变！',
  },
  {
    id: 1,
    vertexName: '顶点 Q (右前)',
    title: '顶点 Q：A面角隅 (右前)',
    faces: [0, 1, 5],
    mainVertexFaceId: 0,
    mainVertexPos: [1, 1],
    beadPositions: [
      { faceId: 1, pos: [1, -1], color: 0x38bdf8 },
      { faceId: 5, pos: [-1, 1], color: 0x10b981 },
    ],
    options: [
      { key: 'A-B-F', label: 'A面 + B面 + F面', correct: true, desc: '基准底面 + 前面 + 右面' },
      { key: 'A-B-D', label: 'A面 + B面 + D面', correct: false, desc: 'B与D是相对面，永不共点' },
      { key: 'B-C-E', label: 'B面 + C面 + E面', correct: false, desc: 'E在左侧，无法到达右前角' },
    ],
    explanation: '顶点 Q 位于 A 面的右前角。折成立体盒后，A(基准)、B(前)、F(右) 三个面在此顶点紧密汇聚！围绕顶点 Q 顺时针看为 A ➔ B ➔ F。',
  },
  {
    id: 2,
    vertexName: '顶点 R (左后)',
    title: '顶点 R：A面角隅 (左后)',
    faces: [0, 3, 4],
    mainVertexFaceId: 0,
    mainVertexPos: [-1, -1],
    beadPositions: [
      { faceId: 3, pos: [-1, 1], color: 0x64748b },
      { faceId: 4, pos: [1, -1], color: 0xa855f7 },
    ],
    options: [
      { key: 'A-D-E', label: 'A面 + D面 + E面', correct: true, desc: '基准底面 + 后面 + 左面' },
      { key: 'A-B-E', label: 'A面 + B面 + E面', correct: false, desc: 'B在前侧，此为顶点 P' },
      { key: 'C-D-F', label: 'C面 + D面 + F面', correct: false, desc: '在底面右后远端' },
    ],
    explanation: '顶点 R 位于 A 面的左后角。折成立体盒后，A(基准)、D(后)、E(左) 三个面在此顶点紧密相交！围绕顶点 R 顺时针看为 A ➔ D ➔ E。',
  },
];

export const OrigamiViewer: React.FC<OrigamiViewerProps> = ({
  initialParams = {},
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Load saved intuition progress from learningStorage
  const savedProgress = useMemo(() => learningStorage.getSpatialIntuitionProgress(), []);

  // Determine if caller specifically requested free mode or a specific archetype
  const isFreeRequested = Boolean(
    initialParams.mode === 'free' ||
    (initialParams.mode && ['1-4-1', '2-3-1', '2-2-2', '3-3'].includes(initialParams.mode))
  );

  const initialViewMode: 'guided' | 'free' = isFreeRequested ? 'free' : 'guided';
  const initialGuidedStep: 1 | 2 | 3 | 4 | 5 = savedProgress?.guidedStep || 1;
  const initialStep5SubQ: 1 | 2 | 3 = savedProgress?.step5SubQuestion || 1;

  const deriveGuidedNetType = (step: number, subQ: number): NetType => {
    if (step === 5) {
      if (subQ === 3) return '3-3';
      if (subQ === 2) return '2-2-2';
      return '2-3-1';
    }
    return '1-4-1';
  };

  // Active net archetype: 1-4-1, 2-3-1, 2-2-2, 3-3
  const [netType, setNetType] = useState<NetType>(() => {
    if (initialParams.mode && ['1-4-1', '2-3-1', '2-2-2', '3-3'].includes(initialParams.mode)) {
      return initialParams.mode as NetType;
    }
    if (initialViewMode === 'guided') {
      return deriveGuidedNetType(initialGuidedStep, initialStep5SubQ);
    }
    return savedProgress?.netType || '1-4-1';
  });

  // Folding progress: 0 (completely flat 2D net) -> 1 (fully folded 3D cube)
  const [foldProgress, setFoldProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Active anchor face (the base face that stays flat on ground, others fold towards it)
  const [anchorFaceId, setAnchorFaceId] = useState<number>(() => {
    if (typeof initialParams.anchorFace === 'number' && initialParams.anchorFace >= 0 && initialParams.anchorFace <= 5) {
      return initialParams.anchorFace;
    }
    return savedProgress?.anchorFaceId ?? 0;
  });
  const [hoveredFaceId, setHoveredFaceId] = useState<number | null>(null);

  // Helper toggles
  const [highlightOpposite, setHighlightOpposite] = useState<boolean>(() => {
    return initialParams.highlight === 'opposite';
  });
  const [showClockwiseVertex, setShowClockwiseVertex] = useState<boolean>(true);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);

  // Mode: 'guided' (空间直觉阶梯引导) vs 'free' (自由探索与11种构型)
  const [viewMode, setViewMode] = useState<'guided' | 'free'>(initialViewMode);

  // Guided Ladder states (5 steps) with persistence
  const [guidedStep, setGuidedStep] = useState<1 | 2 | 3 | 4 | 5>(initialGuidedStep);
  const [guidedStep1Phase, setGuidedStep1Phase] = useState<'pick' | 'verify'>('pick');
  const [guidedStep1Found, setGuidedStep1Found] = useState<boolean>(() => Boolean(savedProgress?.guidedStep1Found));
  const [guidedStep1Feedback, setGuidedStep1Feedback] = useState<{
    type: 'success' | 'hint' | 'error';
    text: string;
  } | null>(null);
  const [guidedStep2TargetFaceId, setGuidedStep2TargetFaceId] = useState<number>(() => {
    return savedProgress?.guidedStep2TargetFaceId ?? savedProgress?.anchorFaceId ?? 0;
  });
  const [guidedStep2Answer, setGuidedStep2Answer] = useState<string | null>(() => savedProgress?.guidedStep2Answer ?? null);
  const [step3CaseIndex, setStep3CaseIndex] = useState<number>(() => savedProgress?.step3CaseIndex ?? 0);
  const [guidedStep3Answer, setGuidedStep3Answer] = useState<string | null>(() => savedProgress?.guidedStep3Answer ?? null);
  const [step4CaseIndex, setStep4CaseIndex] = useState<number>(() => savedProgress?.step4CaseIndex ?? 0);
  const [guidedStep4Answer, setGuidedStep4Answer] = useState<string | null>(() => savedProgress?.guidedStep4Answer ?? null);
  const [step5SubQuestion, setStep5SubQuestion] = useState<1 | 2 | 3>(initialStep5SubQ);
  const [guidedStep5Q1Answer, setGuidedStep5Q1Answer] = useState<string | null>(() => savedProgress?.guidedStep5Q1Answer ?? null);
  const [step5Q1FirstTryCorrect, setStep5Q1FirstTryCorrect] = useState<boolean | null>(() => savedProgress?.step5Q1FirstTryCorrect ?? null);
  const [guidedStep5Q2Answer, setGuidedStep5Q2Answer] = useState<string | null>(() => savedProgress?.guidedStep5Q2Answer ?? null);
  const [step5Q2FirstTryCorrect, setStep5Q2FirstTryCorrect] = useState<boolean | null>(() => savedProgress?.step5Q2FirstTryCorrect ?? null);
  const [guidedStep5Q3Answer, setGuidedStep5Q3Answer] = useState<string | null>(() => savedProgress?.guidedStep5Q3Answer ?? null);
  const [step5Q3FirstTryCorrect, setStep5Q3FirstTryCorrect] = useState<boolean | null>(() => savedProgress?.step5Q3FirstTryCorrect ?? null);
  const [guidedCompletedSteps, setGuidedCompletedSteps] = useState<number[]>(() => savedProgress?.guidedCompletedSteps || []);

  // Step 5 anti-peeking: track if model was folded before answering
  const step5Q1FoldedRef = useRef<boolean>(false);
  const step5Q2FoldedRef = useRef<boolean>(false);
  const step5Q3FoldedRef = useRef<boolean>(false);

  // Sync intuition progress to learningStorage
  useEffect(() => {
    const progressData: SavedSpatialIntuitionProgress = {
      guidedStep,
      guidedStep1Found,
      guidedStep2Answer,
      guidedStep3Answer,
      guidedStep4Answer,
      step5SubQuestion,
      guidedStep5Q1Answer,
      step5Q1FirstTryCorrect,
      guidedStep5Q2Answer,
      step5Q2FirstTryCorrect,
      guidedStep5Q3Answer,
      step5Q3FirstTryCorrect,
      guidedCompletedSteps,
      netType,
      anchorFaceId,
      guidedStep2TargetFaceId,
      step3CaseIndex,
      step4CaseIndex,
    };
    learningStorage.saveSpatialIntuitionProgress(progressData);
  }, [
    guidedStep,
    guidedStep1Found,
    guidedStep2Answer,
    guidedStep3Answer,
    guidedStep4Answer,
    step5SubQuestion,
    guidedStep5Q1Answer,
    step5Q1FirstTryCorrect,
    guidedStep5Q2Answer,
    step5Q2FirstTryCorrect,
    guidedStep5Q3Answer,
    step5Q3FirstTryCorrect,
    guidedCompletedSteps,
    netType,
    anchorFaceId,
    guidedStep2TargetFaceId,
    step3CaseIndex,
    step4CaseIndex,
  ]);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const faceMeshesRef = useRef<THREE.Mesh[]>([]);

  // Unified Animation Controller with timestamp-based delta
  const foldAnimFrameRef = useRef<number | null>(null);

  const stopAnimation = () => {
    if (foldAnimFrameRef.current !== null) {
      cancelAnimationFrame(foldAnimFrameRef.current);
      foldAnimFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  const startAnimation = (targetProgress = 1, durationMs = 2000, startFromCurrent = true) => {
    stopAnimation();
    if (viewModeRef.current === 'guided' && guidedStepRef.current === 5) {
      if (step5SubQuestion === 1 && !guidedStep5Q1Answer) step5Q1FoldedRef.current = true;
      if (step5SubQuestion === 2 && !guidedStep5Q2Answer) step5Q2FoldedRef.current = true;
      if (step5SubQuestion === 3 && !guidedStep5Q3Answer) step5Q3FoldedRef.current = true;
    }
    setIsPlaying(true);
    let startVal = foldProgressRef.current;
    if (!startFromCurrent || (targetProgress >= 1 && startVal >= 0.999)) {
      startVal = 0;
      setFoldProgress(0);
    }
    const distance = targetProgress - startVal;
    if (Math.abs(distance) < 0.001) {
      setIsPlaying(false);
      return;
    }
    const actualDuration = Math.max(150, Math.abs(distance) * durationMs);
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / actualDuration);
      const current = startVal + distance * t;
      setFoldProgress(current);

      if (t < 1) {
        foldAnimFrameRef.current = requestAnimationFrame(tick);
      } else {
        foldAnimFrameRef.current = null;
        setIsPlaying(false);
      }
    };

    foldAnimFrameRef.current = requestAnimationFrame(tick);
  };

  // Pivots ref for 0-allocation folding
  const pivotsRef = useRef<{ pivot: THREE.Group; axis: 'x' | 'z'; sign: number }[]>([]);

  // Refs for current states to avoid stale closure in pointer handlers
  const viewModeRef = useRef(viewMode);
  const guidedStepRef = useRef(guidedStep);
  const foldProgressRef = useRef(foldProgress);
  const anchorFaceIdRef = useRef(anchorFaceId);
  const guidedStep1PhaseRef = useRef(guidedStep1Phase);

  useEffect(() => {
    viewModeRef.current = viewMode;
    guidedStepRef.current = guidedStep;
    foldProgressRef.current = foldProgress;
    anchorFaceIdRef.current = anchorFaceId;
    guidedStep1PhaseRef.current = guidedStep1Phase;
  }, [viewMode, guidedStep, foldProgress, anchorFaceId, guidedStep1Phase]);

  // Camera presets
  const setCameraView = (view: 'top' | 'front' | 'iso' | 'reset') => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    if (view === 'top') {
      cam.position.set(0, 11, 0.001);
    } else if (view === 'front') {
      cam.position.set(0, 2, 9);
    } else if (view === 'iso') {
      cam.position.set(6, 6, 6);
    } else {
      cam.position.set(5, 9, 10);
    }
    ctrl.target.set(0, 0, 0);
    ctrl.update();
  };

  // Step-folding controls
  const handleStepFold = (delta: number) => {
    stopAnimation();
    if (viewModeRef.current === 'guided' && guidedStepRef.current === 5) {
      if (step5SubQuestion === 1 && !guidedStep5Q1Answer) step5Q1FoldedRef.current = true;
      if (step5SubQuestion === 2 && !guidedStep5Q2Answer) step5Q2FoldedRef.current = true;
      if (step5SubQuestion === 3 && !guidedStep5Q3Answer) step5Q3FoldedRef.current = true;
    }
    setFoldProgress((prev) => Math.max(0, Math.min(1, Math.round((prev + delta) * 100) / 100)));
  };

  const handleAnimateToPause = (targetProgress: number = 0.85) => {
    startAnimation(targetProgress, 2000, false);
  };

  const handleSelectGuidedStep = (step: 1 | 2 | 3 | 4 | 5) => {
    stopAnimation();
    setGuidedStep(step);
    setGuidedStep1Feedback(null);
    setFoldProgress(0);
    if (step === 1) {
      setGuidedStep1Phase('pick');
    } else if (step === 2) {
      setGuidedStep2TargetFaceId(anchorFaceId);
    } else if (step === 5) {
      step5Q1FoldedRef.current = false;
      step5Q2FoldedRef.current = false;
      step5Q3FoldedRef.current = false;
      setNetType(step5SubQuestion === 3 ? '3-3' : step5SubQuestion === 2 ? '2-2-2' : '2-3-1');
    } else {
      setNetType('1-4-1');
    }
  };

  // Reset all guided ladder progress to clean initial state (ideal for sharing with friends)
  const handleResetGuidedProgress = () => {
    if (window.confirm('确定要重置空间直觉引导教学的全部进度，从第 1 阶从头开始吗？（适合给新朋友重新体验）')) {
      stopAnimation();
      learningStorage.clearSpatialIntuitionProgress();
      setGuidedStep(1);
      setGuidedStep1Phase('pick');
      setGuidedStep1Found(false);
      setGuidedStep1Feedback(null);
      setGuidedStep2TargetFaceId(0);
      setGuidedStep2Answer(null);
      setStep3CaseIndex(0);
      setGuidedStep3Answer(null);
      setStep4CaseIndex(0);
      setGuidedStep4Answer(null);
      setStep5SubQuestion(1);
      setGuidedStep5Q1Answer(null);
      setStep5Q1FirstTryCorrect(null);
      setGuidedStep5Q2Answer(null);
      setStep5Q2FirstTryCorrect(null);
      setGuidedStep5Q3Answer(null);
      setStep5Q3FirstTryCorrect(null);
      setGuidedCompletedSteps([]);
      setAnchorFaceId(0);
      setFoldProgress(0);
      setNetType('1-4-1');
      step5Q1FoldedRef.current = false;
      step5Q2FoldedRef.current = false;
      step5Q3FoldedRef.current = false;
    }
  };
  const faceTextures = useMemo(() => {
    return PATTERNS.map((p) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      p.draw(ctx, 512);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 500, 500);

      // Distinct permanent letter tag badge in corner
      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(14, 14, 76, 76, 16);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 46px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.letter, 52, 54);
      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      return texture;
    });
  }, []);

  const faceTexturesRef = useRef(faceTextures);
  useEffect(() => {
    faceTexturesRef.current = faceTextures;
  }, [faceTextures]);

  // Setup Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5, 9, 10);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    grid.position.y = -2;
    scene.add(grid);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let pointerDownTime = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const onPointerDown = (e: PointerEvent) => {
      pointerDownTime = Date.now();
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      const elapsed = Date.now() - pointerDownTime;

      // Only treat as click if pointer moved minimally (< 6px) and quickly (< 450ms)
      if (dist < 6 && elapsed < 450) {
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(faceMeshesRef.current, false);
        if (intersects.length > 0) {
          const hitMesh = intersects[0].object;
          const fid = hitMesh.userData?.faceId;
          if (typeof fid === 'number' && fid >= 0 && fid <= 5) {
            const curMode = viewModeRef.current;
            const curStep = guidedStepRef.current;
            const curProgress = foldProgressRef.current;

            if (curMode === 'guided' && curStep === 1) {
              if (guidedStep1PhaseRef.current === 'pick') {
                // In picking phase, clicking any face selects it as the base anchor face!
                setAnchorFaceId(fid);
              } else {
                // In verification phase, clicking is identifying the anchor face on the 3D box!
                if (fid === anchorFaceIdRef.current) {
                  if (curProgress >= 0.75) {
                    setGuidedStep1Found(true);
                    setGuidedStep1Feedback({
                      type: 'success',
                      text: `🎉 太棒了！你在折叠后的立体盒子上成功定位到了基准面【${PATTERNS[fid].name}】！`,
                    });
                    setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
                  } else {
                    setGuidedStep1Feedback({
                      type: 'hint',
                      text: `💡 请先拉动折叠滑块（或点击下方折叠按钮）将纸盒折起到 75% 以上，再在立体盒子上点击【${PATTERNS[anchorFaceIdRef.current].letter}面】确认！`,
                    });
                  }
                } else {
                  setGuidedStep1Feedback({
                    type: 'error',
                    text: `你点击的是【${PATTERNS[fid].name}】，请旋转视角寻找你设定的基准面【${PATTERNS[anchorFaceIdRef.current].name}】！`,
                  });
                }
              }
            } else {
              setAnchorFaceId(fid);
            }
          }
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(faceMeshesRef.current, false);
      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const fid = hitMesh.userData?.faceId;
        if (typeof fid === 'number') {
          container.style.cursor = 'pointer';
          setHoveredFaceId(fid);
          return;
        }
      }
      container.style.cursor = 'grab';
      setHoveredFaceId(null);
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointermove', onPointerMove);

    let isMounted = true;
    const animate = () => {
      if (!isMounted) return;
      controls.update();
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      stopAnimation();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointermove', onPointerMove);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      grid.geometry.dispose();
      if (Array.isArray(grid.material)) {
        grid.material.forEach((m) => m.dispose());
      } else {
        grid.material.dispose();
      }
      faceTexturesRef.current.forEach((tex) => tex.dispose());
      renderer.dispose();
    };
  }, []);

  // Build the folding mechanism based on netType and step
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Full recursive disposal of all previous geometries and materials
    const disposeHierarchy = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if ((child as any).geometry) {
          (child as any).geometry.dispose();
        }
        if ((child as any).material) {
          const mat = (child as any).material;
          if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
    };

    disposeHierarchy(group);
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    pivotsRef.current = [];
    faceMeshesRef.current = [];

    const a = 2.4; // Edge length
    const h = a / 2; // Half length (1.2)
    const netDef = NET_DEFINITIONS[netType];
    const rootId = anchorFaceId;

    // In Guided Mode, determine which faces are dimmed to focus on current task
    let guidedDimmedFaces: number[] = [];
    if (viewMode === 'guided') {
      if (guidedStep === 1) {
        // Step 1: In picking phase, do NOT dim any faces so user can observe and pick freely!
        // In verification phase, keep all visible for realistic visual search
        guidedDimmedFaces = [];
      } else if (guidedStep === 2) {
        // Step 2: focus on Target face and its opposite face only after correct answer
        const correctOpp = PATTERNS[guidedStep2TargetFaceId].oppositeId;
        guidedDimmedFaces = guidedStep2Answer === PATTERNS[correctOpp].letter
          ? [0, 1, 2, 3, 4, 5].filter((f) => f !== guidedStep2TargetFaceId && f !== correctOpp)
          : [];
      } else if (guidedStep === 3) {
        // Step 3: dim unrelated faces only AFTER answering to avoid pre-selection clue
        const curC = GUIDED_STEP3_CASES[step3CaseIndex];
        guidedDimmedFaces = guidedStep3Answer !== null
          ? [0, 1, 2, 3, 4, 5].filter((f) => f !== curC.targetFaceId && f !== curC.matchingFaceId)
          : [];
      } else if (guidedStep === 4) {
        // Step 4: dim unrelated faces only AFTER answering to avoid pre-selection clue
        const curC = GUIDED_STEP4_CASES[step4CaseIndex];
        guidedDimmedFaces = guidedStep4Answer !== null
          ? [0, 1, 2, 3, 4, 5].filter((f) => !curC.faces.includes(f))
          : [];
      } else if (guidedStep === 5) {
        // Step 5: blind test, no dimming
        guidedDimmedFaces = [];
      }
    }

    const getPairIndex = (patternId: number) => {
      if (patternId === 1 || patternId === 3) return 0; // Front & Back
      if (patternId === 4 || patternId === 5) return 1; // Left & Right
      return 2; // Top & Bottom
    };

    const createFaceMesh = (patternIndex: number) => {
      const geom = new THREE.PlaneGeometry(a, a);
      geom.rotateX(-Math.PI / 2); // Flat horizontal on XZ plane, normal +Y
      const isAnchor = patternIndex === anchorFaceId;
      const isDimmed = viewMode === 'guided' && guidedDimmedFaces.includes(patternIndex);

      const mat = new THREE.MeshStandardMaterial({
        map: faceTextures[patternIndex],
        roughness: 0.25,
        metalness: 0.05,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isDimmed ? 0.2 : 1.0,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = `face_${patternIndex}`;
      mesh.userData = { faceId: patternIndex };
      faceMeshesRef.current.push(mesh);

      // Edge borders
      const edgeGeom = new THREE.EdgesGeometry(geom);
      if (isAnchor) {
        // Prominent Golden / Amber border for the anchor face
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 6 });
        mesh.add(new THREE.LineSegments(edgeGeom, edgeMat));

        // Add a subtle golden base glow plate under the anchor face
        const plateGeom = new THREE.PlaneGeometry(a * 1.05, a * 1.05);
        plateGeom.rotateX(-Math.PI / 2);
        const plateMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: isDimmed ? 0.08 : 0.22,
          side: THREE.DoubleSide,
        });
        const plateMesh = new THREE.Mesh(plateGeom, plateMat);
        plateMesh.position.y = -0.01;
        mesh.add(plateMesh);
      } else if (highlightOpposite && viewMode === 'free') {
        const pairIndex = getPairIndex(patternIndex);
        let color = 0x38bdf8;
        if (pairIndex === 0) color = 0xef4444; // Front & Back (Red)
        if (pairIndex === 1) color = 0x22c55e; // Left & Right (Green)
        if (pairIndex === 2) color = 0x3b82f6; // Top & Bottom (Blue)

        const edgeMat = new THREE.LineBasicMaterial({ color, linewidth: 4 });
        mesh.add(new THREE.LineSegments(edgeGeom, edgeMat));
      } else {
        const edgeMat = new THREE.LineBasicMaterial({
          color: isDimmed ? 0x1e293b : 0x475569,
          linewidth: 2,
        });
        mesh.add(new THREE.LineSegments(edgeGeom, edgeMat));
      }

      // Step 3 edge tracking in Guided Mode:
      if (viewMode === 'guided' && guidedStep === 3) {
        const curCase = GUIDED_STEP3_CASES[step3CaseIndex];
        if (patternIndex === curCase.targetFaceId) {
          // Orange glowing cylinder along target edge
          const edgeCyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, a, 16),
            new THREE.MeshStandardMaterial({
              color: 0xf97316,
              emissive: 0xf97316,
              emissiveIntensity: 1.0,
              roughness: 0.2,
            })
          );
          if (curCase.targetEdge.axis === 'x') {
            edgeCyl.rotation.x = Math.PI / 2;
            edgeCyl.position.set(curCase.targetEdge.offset * h, 0.04, 0);
          } else {
            edgeCyl.rotation.z = Math.PI / 2;
            edgeCyl.position.set(0, 0.04, curCase.targetEdge.offset * h);
          }
          mesh.add(edgeCyl);
        } else if (patternIndex === curCase.matchingFaceId && guidedStep3Answer !== null) {
          // Sky blue glowing cylinder along matching edge ONLY after answering
          const edgeCyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, a, 16),
            new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0284c7,
              emissiveIntensity: 1.0,
              roughness: 0.2,
            })
          );
          if (curCase.matchingEdge.axis === 'x') {
            edgeCyl.rotation.x = Math.PI / 2;
            edgeCyl.position.set(curCase.matchingEdge.offset * h, 0.04, 0);
          } else {
            edgeCyl.rotation.z = Math.PI / 2;
            edgeCyl.position.set(0, 0.04, curCase.matchingEdge.offset * h);
          }
          mesh.add(edgeCyl);
        }
      }

      // Step 4 vertex tracking in Guided Mode:
      if (viewMode === 'guided' && guidedStep === 4) {
        const curCase = GUIDED_STEP4_CASES[step4CaseIndex];
        if (patternIndex === curCase.mainVertexFaceId) {
          // Golden glowing sphere at corner of main face (e.g. Vertex P/Q/R)
          const vertexSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 24, 24),
            new THREE.MeshStandardMaterial({
              color: 0xfacc15,
              emissive: 0xf59e0b,
              emissiveIntensity: 1.2,
              roughness: 0.2,
            })
          );
          const [vx, vz] = curCase.mainVertexPos;
          vertexSphere.position.set(vx * h, 0.08, vz * h);
          mesh.add(vertexSphere);
        } else if (guidedStep4Answer !== null) {
          const bead = curCase.beadPositions.find((b) => b.faceId === patternIndex);
          if (bead) {
            const vertexSphere = new THREE.Mesh(
              new THREE.SphereGeometry(0.11, 16, 16),
              new THREE.MeshBasicMaterial({ color: bead.color })
            );
            const [bx, bz] = bead.pos;
            vertexSphere.position.set(bx * h, 0.08, bz * h);
            mesh.add(vertexSphere);
          }
        }
      }

      return mesh;
    };

    // Build adjacency tree
    const adj: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] };
    for (const [uNode, vNode] of netDef.edges) {
      adj[uNode].push(vNode);
      adj[vNode].push(uNode);
    }

    const visited = new Set<number>([rootId]);

    // Root face (Anchor)
    const rootMesh = createFaceMesh(rootId);
    rootMesh.position.set(0, h, 0);
    group.add(rootMesh);

    const traverse = (currId: number, parentObj: THREE.Object3D, isRoot: boolean) => {
      for (const neighborId of adj[currId]) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const [px, py] = netDef.faces[currId];
        const [cx, cy] = netDef.faces[neighborId];
        const dx = cx - px;
        const dy = cy - py;

        const pivot = new THREE.Group();
        const childMeshPos = new THREE.Vector3();

        if (dx === 1 && dy === 0) {
          // East (local +X)
          pivot.position.set(h, isRoot ? h : 0, 0);
          childMeshPos.set(h, 0, 0);
          pivotsRef.current.push({ pivot, axis: 'z', sign: -1 });
        } else if (dx === -1 && dy === 0) {
          // West (local -X)
          pivot.position.set(-h, isRoot ? h : 0, 0);
          childMeshPos.set(-h, 0, 0);
          pivotsRef.current.push({ pivot, axis: 'z', sign: 1 });
        } else if (dx === 0 && dy === 1) {
          // South (local +Z)
          pivot.position.set(0, isRoot ? h : 0, h);
          childMeshPos.set(0, 0, h);
          pivotsRef.current.push({ pivot, axis: 'x', sign: 1 });
        } else if (dx === 0 && dy === -1) {
          // North (local -Z)
          pivot.position.set(0, isRoot ? h : 0, -h);
          childMeshPos.set(0, 0, -h);
          pivotsRef.current.push({ pivot, axis: 'x', sign: -1 });
        }

        const nodeGroup = new THREE.Group();
        nodeGroup.position.copy(childMeshPos);
        pivot.add(nodeGroup);

        const childMesh = createFaceMesh(neighborId);
        childMesh.position.set(0, 0, 0);
        nodeGroup.add(childMesh);

        parentObj.add(pivot);

        traverse(neighborId, nodeGroup, false);
      }
    };

    traverse(rootId, group, true);

    if (showClockwiseVertex && viewMode === 'free') {
      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      // Position at front-right-top corner
      pin.position.set(h, h + 0.05, h);
      group.add(pin);
    }

    // Immediately apply current fold rotation to the new hierarchy
    const u = foldProgressRef.current;
    const foldAngle = u * (Math.PI / 2);
    const [rx, ry] = netDef.faces[rootId];
    let sumDx = 0;
    let sumDz = 0;
    for (let i = 0; i < 6; i++) {
      const [fx, fy] = netDef.faces[i];
      sumDx += (fx - rx) * a;
      sumDz += (fy - ry) * a;
    }
    const avgDx = sumDx / 6;
    const avgDz = sumDz / 6;
    group.position.set(-avgDx * (1 - u), 0, -avgDz * (1 - u));

    for (const item of pivotsRef.current) {
      if (item.axis === 'x') item.pivot.rotation.x = item.sign * foldAngle;
      if (item.axis === 'z') item.pivot.rotation.z = item.sign * foldAngle;
    }

    return () => {
      disposeHierarchy(group);
      while (group.children.length > 0) {
        group.remove(group.children[0]);
      }
    };
  }, [
    netType,
    anchorFaceId,
    viewMode,
    guidedStep,
    guidedStep2TargetFaceId,
    guidedStep2Answer,
    step3CaseIndex,
    guidedStep3Answer,
    step4CaseIndex,
    guidedStep4Answer,
    step5SubQuestion,
    faceTextures,
    highlightOpposite,
    showClockwiseVertex,
  ]);

  // Fast 0-allocation fold rotation update (60/120fps smooth, 0 memory leaks)
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;
    const a = 2.4;
    const u = foldProgress;
    const foldAngle = u * (Math.PI / 2);
    const netDef = NET_DEFINITIONS[netType];
    const rootId = anchorFaceId;
    const [rx, ry] = netDef.faces[rootId];
    let sumDx = 0;
    let sumDz = 0;
    for (let i = 0; i < 6; i++) {
      const [fx, fy] = netDef.faces[i];
      sumDx += (fx - rx) * a;
      sumDz += (fy - ry) * a;
    }
    const avgDx = sumDx / 6;
    const avgDz = sumDz / 6;
    group.position.set(-avgDx * (1 - u), 0, -avgDz * (1 - u));

    for (const item of pivotsRef.current) {
      if (item.axis === 'x') item.pivot.rotation.x = item.sign * foldAngle;
      if (item.axis === 'z') item.pivot.rotation.z = item.sign * foldAngle;
    }
  }, [foldProgress, netType, anchorFaceId]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* 3D Canvas */}
      <div className="relative w-full h-[52vh] min-h-[340px] sm:min-h-[380px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Unified Collision-Free Top Toolbars Container */}
        <div className="absolute top-2 left-2 right-2 flex flex-col gap-1.5 z-10 pointer-events-none">
          {/* Row 1: Mode Switcher + Camera Preset Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            {/* Main Mode Toggle: Guided Ladder vs Free Exploration */}
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto">
              <button
                onClick={() => {
                  stopAnimation();
                  setViewMode('guided');
                  handleSelectGuidedStep(guidedStep);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'guided'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>💡 阶梯引导教学</span>
              </button>
              <button
                onClick={() => {
                  stopAnimation();
                  setViewMode('free');
                  setFoldProgress(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'free'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🎮 自由探索图鉴</span>
              </button>
            </div>

            {/* Camera View Presets */}
            <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto">
              <button
                onClick={() => setCameraView('top')}
                title="俯视视角（正对平面展开图）"
                className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">俯视</span>
              </button>
              <button
                onClick={() => setCameraView('front')}
                title="前视视角（正对正面）"
                className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">正视</span>
              </button>
              <button
                onClick={() => setCameraView('iso')}
                title="45° 轴测立体视角"
                className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Compass className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">立体</span>
              </button>
              <button
                onClick={() => setCameraView('reset')}
                title="复位默认视角"
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Row 2: Secondary Toolbar (Guided Step Pills OR Free Archetype Selector) */}
          {viewMode === 'guided' ? (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto">
              <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-amber-500/30 shadow-lg">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mr-1 flex-shrink-0">
                  <span>阶梯任务:</span>
                </span>

                {[
                  { step: 1 as const, name: '① 认基准面', done: guidedStep1Found || guidedCompletedSteps.includes(1) },
                  { step: 2 as const, name: '② 辨相对面', done: guidedStep2Answer === 'C' || guidedCompletedSteps.includes(2) },
                  { step: 3 as const, name: '③ 跟踪公共边', done: guidedStep3Answer === 'F' || guidedCompletedSteps.includes(3) },
                  { step: 4 as const, name: '④ 跟踪公共顶点', done: guidedStep4Answer === 'ABE' || guidedCompletedSteps.includes(4) },
                  { step: 5 as const, name: '⑤ 变式盲测', done: guidedCompletedSteps.includes(5) },
                ].map((item) => (
                  <button
                    key={item.step}
                    onClick={() => handleSelectGuidedStep(item.step)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                      guidedStep === item.step
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30 ring-1 ring-amber-300'
                        : item.done
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {item.done && <Check className="w-3 h-3 text-emerald-400" />}
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pointer-events-auto">
              {/* Free Archetype Selector */}
              <div className="flex overflow-x-auto no-scrollbar gap-1.5">
                <button
                  onClick={() => { stopAnimation(); setNetType('1-4-1'); setFoldProgress(0); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap cursor-pointer ${
                    netType === '1-4-1'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  ⭐ 1-4-1型 (经典十字 · 6种)
                </button>
                <button
                  onClick={() => { stopAnimation(); setNetType('2-3-1'); setFoldProgress(0); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap cursor-pointer ${
                    netType === '2-3-1'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  📐 2-3-1型 (楼梯拐角 · 3种)
                </button>
                <button
                  onClick={() => { stopAnimation(); setNetType('2-2-2'); setFoldProgress(0); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap cursor-pointer ${
                    netType === '2-2-2'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  🪜 2-2-2型 (阶梯台阶 · 1种)
                </button>
                <button
                  onClick={() => { stopAnimation(); setNetType('3-3'); setFoldProgress(0); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap cursor-pointer ${
                    netType === '3-3'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  🔀 3-3型 (两排错开 · 1种)
                </button>
              </div>

              {/* Quick Anchor Face Selector Strip */}
              <div className="max-w-full flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-lg overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 mr-0.5 flex-shrink-0">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">基准面:</span>
                </div>
                {PATTERNS.map((p) => {
                  const isAnchor = p.id === anchorFaceId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setAnchorFaceId(p.id)}
                      onMouseEnter={() => setHoveredFaceId(p.id)}
                      onMouseLeave={() => setHoveredFaceId(null)}
                      title={`选定【${p.name}】为折叠基准面（其余5面折向它）`}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 cursor-pointer ${
                        isAnchor
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span>{p.letter}</span>
                      {isAnchor && <span className="text-[9px] text-amber-400">★</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: 3D Direct Click / Hover Floating Notification */}
          {hoveredFaceId !== null ? (
            <div className="self-start flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 text-slate-950 font-bold text-[11px] rounded-lg shadow-xl backdrop-blur-md pointer-events-none animate-in fade-in">
              <MousePointerClick className="w-3.5 h-3.5 text-slate-950" />
              <span>点击设定基准面：{PATTERNS[hoveredFaceId].name}</span>
            </div>
          ) : viewMode === 'free' ? (
            <div className="self-start hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg pointer-events-none">
              <MousePointerClick className="w-3 h-3 text-amber-400" />
              <span>可直接在 3D 画布中点击任意面切换基准面</span>
            </div>
          ) : null}
        </div>

        {/* Bottom Folding Slider & Step Controls */}
        {(() => {
          const isBlindTesting = viewMode === 'guided' && guidedStep === 5 && (
            (step5SubQuestion === 1 && !guidedStep5Q1Answer) ||
            (step5SubQuestion === 2 && !guidedStep5Q2Answer) ||
            (step5SubQuestion === 3 && !guidedStep5Q3Answer)
          );

          return (
            <div className="absolute bottom-2 left-2 right-2 sm:left-4 sm:right-4 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl z-10 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2 text-xs mb-1">
                <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5 flex-wrap">
                  <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span>展开型: <strong className="text-indigo-300 font-mono">{netType}</strong></span>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-300 font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    基准面: <strong>{PATTERNS[anchorFaceId].letter}面</strong>
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {foldProgress <= 0.05 ? '【平铺】' : foldProgress >= 0.95 ? '【成盒】' : '【折叠中】'}
                  </span>
                </span>
                <span className="font-mono text-indigo-400 font-bold text-xs flex-shrink-0">
                  {(foldProgress * 100).toFixed(0)}%
                </span>
              </div>

              {isBlindTesting ? (
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-2 text-center text-xs text-amber-300 font-medium animate-pulse">
                  🔒 独立盲测中：折叠控制已暂时锁定。请先在右侧作答，选择答案后即可解锁 3D 折起验证！
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => (isPlaying ? stopAnimation() : startAnimation(1, 2000, true))}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors flex-shrink-0 cursor-pointer"
                    title={isPlaying ? '暂停' : '自动折起'}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  {/* Step -25% */}
                  <button
                    onClick={() => handleStepFold(-0.25)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer"
                    title="按步退折叠（-25%）"
                  >
                    -25%
                  </button>

                  {/* Step +25% */}
                  <button
                    onClick={() => handleStepFold(0.25)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer"
                    title="按步进折叠（+25%）"
                  >
                    +25%
                  </button>

                  {/* Staged 85% Pause for edge contact */}
                  {guidedStep === 3 && (
                    <button
                      onClick={() => handleAnimateToPause(0.85)}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition-colors flex-shrink-0 cursor-pointer"
                      title="折叠至 85% 贴合瞬间自动暂停"
                    >
                      贴合暂停
                    </button>
                  )}

                  <button
                    onClick={() => { stopAnimation(); setFoldProgress(0); }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer"
                  >
                    平铺
                  </button>

                  <button
                    onClick={() => { stopAnimation(); setFoldProgress(1); }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer"
                  >
                    成盒
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={foldProgress}
                    onChange={(e) => {
                      stopAnimation();
                      setFoldProgress(parseFloat(e.target.value));
                    }}
                    className="flex-1 accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          );
        })()}

      </div>

      {/* Right Control & Theory Panel */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        {viewMode === 'guided' ? (
          /* ========================================================= */
          /* GUIDED LEARNING LADDER CARDS (Step 1 to 5)                */
          /* ========================================================= */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Guided Header Card */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-900 border border-amber-500/40 p-4 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <GraduationCap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>空间直觉阶梯引导 · 第 {guidedStep} / 5 阶</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    {guidedStep === 1 && '空间基准锚定'}
                    {guidedStep === 2 && '相对面排除法则'}
                    {guidedStep === 3 && '公共边旋转贴合'}
                    {guidedStep === 4 && '三面公共顶点'}
                    {guidedStep === 5 && '独立盲测检验'}
                  </span>
                  <button
                    onClick={handleResetGuidedProgress}
                    title="清空当前教学进度，从第 1 阶重新开始（方便给朋友演示或重温）"
                    className="px-2 py-0.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-medium transition-colors border border-slate-700/80 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-400" />
                    <span>从头教学</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                遵循<strong>“先猜 ➔ 再操作 ➔ 最后验证”</strong>的认知规律，每次只攻克一个空间几何关系，轻松打破空间直觉壁垒！
              </p>
            </div>

            {/* STEP 1: 认基准面 */}
            {guidedStep === 1 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>第 1 阶任务：认一个基准面（空间锚点与跟踪）</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <strong>核心直觉</strong>：空间想象力薄弱的第一原因是没有“固定不动”的参照物。公考解题绝招就是<strong>“先锁定一个特征面为基准面”</strong>，其余 5 个面顺次折向它！
                  </p>
                </div>

                {guidedStep1Found ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/50 p-3.5 rounded-xl space-y-2.5 text-xs text-emerald-300 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>🎉 太棒了！在 3D 盒子上成功找回基准面【{PATTERNS[anchorFaceId].name}】！</span>
                    </div>
                    <p className="text-emerald-200/90 leading-relaxed text-[11px]">
                      无论纸盒如何翻转闭合，<strong>基准面都是三维空间的固定参照底面</strong>。有了这个固定基准，其余 5 个面在脑海里就不会乱飞！
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        onClick={() => {
                          setGuidedStep1Found(false);
                          setGuidedStep1Phase('pick');
                          setGuidedStep1Feedback(null);
                          setFoldProgress(0);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>换个基准面试试 (举一反三)</span>
                      </button>
                      <button
                        onClick={() => handleSelectGuidedStep(2)}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>进入第 2 阶：辨析相对面与相邻面</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guidedStep1Phase === 'pick' ? (
                      /* Phase A: Pick any anchor face freely */
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3 text-xs">
                        <div className="font-semibold text-amber-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-amber-400" />
                            <span>阶段一：自主选定一个面为【基准面】</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            当前选定：<strong className="text-amber-300">{PATTERNS[anchorFaceId].letter}面</strong>
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          平铺状态下，6 个面均可作为折叠基准面。点击下方面卡（或直接在 3D 画布中点击任意面）选定：
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-0.5">
                          {PATTERNS.map((p) => {
                            const isSelected = p.id === anchorFaceId;
                            return (
                              <button
                                key={p.id}
                                onClick={() => setAnchorFaceId(p.id)}
                                className={`py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 font-bold'
                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                }`}
                              >
                                <FaceThumbnail pattern={p} size={24} />
                                <span className="text-[10px]">{p.letter}面</span>
                                {isSelected && <span className="text-[9px] text-amber-400 font-bold">★基准</span>}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => {
                            setGuidedStep1Phase('verify');
                            setGuidedStep1Feedback(null);
                            startAnimation(1, 2000, true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>锁定【{PATTERNS[anchorFaceId].name}】并开始折叠挑战 ➔</span>
                        </button>
                      </div>
                    ) : (
                      /* Phase B: Verification on folded 3D cube */
                      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3 text-xs">
                        <div className="font-semibold text-amber-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-4 h-4 text-amber-400" />
                            <span>阶段二：在 3D 盒子上找回【{PATTERNS[anchorFaceId].name}】</span>
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          纸盒已折起！请旋转 3D 视角，在立体盒子的表面<strong>找到并点击你锁定的基准面【{PATTERNS[anchorFaceId].letter}面】</strong>！
                        </p>

                        {guidedStep1Feedback && (
                          <div
                            className={`p-2.5 rounded-xl border text-xs space-y-1 animate-in fade-in ${
                              guidedStep1Feedback.type === 'success'
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                : guidedStep1Feedback.type === 'hint'
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              {guidedStep1Feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              {guidedStep1Feedback.type === 'hint' && <HelpCircle className="w-4 h-4 text-amber-400" />}
                              {guidedStep1Feedback.type === 'error' && <AlertOctagon className="w-4 h-4 text-rose-400" />}
                              <span>{guidedStep1Feedback.text}</span>
                            </div>
                          </div>
                        )}

                        {/* Backup direct click options for touch/mobile accessibility */}
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          <span className="text-[10px] text-slate-500">若 3D 触控不便，也可直接在此备用辨认：</span>
                          <div className="grid grid-cols-6 gap-1">
                            {PATTERNS.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  if (p.id === anchorFaceId) {
                                    setGuidedStep1Found(true);
                                    setGuidedStep1Feedback({
                                      type: 'success',
                                      text: `🎉 太棒了！成功定位并找回了基准面【${p.name}】！`,
                                    });
                                    setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
                                  } else {
                                    setGuidedStep1Feedback({
                                      type: 'error',
                                      text: `你选中的是【${p.name}】，请寻找你刚才选定的基准面【${PATTERNS[anchorFaceId].name}】！`,
                                    });
                                  }
                                }}
                                className="py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 text-[10px] font-medium transition-colors cursor-pointer"
                              >
                                {p.letter}面
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              stopAnimation();
                              setGuidedStep1Phase('pick');
                              setFoldProgress(0);
                              setGuidedStep1Feedback(null);
                            }}
                            className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>展开并换选其他基准面</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: 找相对面与相邻面 */}
            {guidedStep === 2 && (() => {
              const targetPattern = PATTERNS[guidedStep2TargetFaceId] || PATTERNS[0];
              const OPPOSITE_MAP: Record<number, number> = { 0: 2, 2: 0, 1: 3, 3: 1, 4: 5, 5: 4 };
              const correctOppositeId = OPPOSITE_MAP[guidedStep2TargetFaceId] ?? 2;
              const correctOppositePattern = PATTERNS[correctOppositeId];
              const isCorrect = guidedStep2Answer === correctOppositePattern.letter;

              return (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>第 2 阶任务：辨析相对面与相邻面（空间对立规律 · 举一反三）</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <strong>概念解析</strong>：
                      <br />
                      • <strong>相邻面</strong>：空间中共用一条折痕（棱），折起后垂直挨着。
                      <br />
                      • <strong>相对面</strong>：空间中平行相对，<strong>绝不共用任何棱或顶点</strong>！在展开图中通常<strong>“隔一个面”</strong>或呈<strong>“Z 字两端”</strong>。
                    </p>
                  </div>

                  {/* Dynamic target face selector pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">选择要探究的目标面：</span>
                      <span className="text-[11px] text-sky-400 font-medium">六面皆可验证 · 拓扑永恒</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {PATTERNS.map((p) => {
                        const isCurrentTarget = p.id === guidedStep2TargetFaceId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setGuidedStep2TargetFaceId(p.id);
                              setGuidedStep2Answer(null);
                              stopAnimation();
                              setFoldProgress(0);
                            }}
                            className={`py-1.5 px-1 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                              isCurrentTarget
                                ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-2 ring-sky-400/40 font-bold'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            <FaceThumbnail pattern={p} size={22} />
                            <span className="text-[10px]">{p.letter}面</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <span className="font-bold text-amber-300 block">
                      ❓ 探究提问：哪个面折起后会成为【{targetPattern.name}】的相对面？
                    </span>
                    <p className="text-slate-400 text-[11px]">
                      请在展开图中观察其余 5 个面，先在脑海中推演哪一个面折起后会与【{targetPattern.letter}面】正对（平行且互不接触）：
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {PATTERNS.filter((p) => p.id !== guidedStep2TargetFaceId).map((p) => {
                        const isSelected = guidedStep2Answer === p.letter;
                        const optionIsCorrect = p.id === correctOppositeId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setGuidedStep2Answer(p.letter);
                              if (optionIsCorrect) {
                                setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
                              }
                            }}
                            className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              isSelected
                                ? optionIsCorrect
                                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 font-bold'
                                  : 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <FaceThumbnail pattern={p} size={24} />
                            <span className="text-[11px]">{p.letter}面</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {guidedStep2Answer && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>🎉 回答完全正确！【{targetPattern.name}】与【{correctOppositePattern.name}】互为相对面！</span>
                          </div>
                          <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                            <strong>空间验证</strong>：{targetPattern.letter} 面与 {correctOppositePattern.letter} 面在空间中严格平行相对，永不共用棱或顶点！
                            <br />
                            💡 <strong>公考秒杀核心直觉</strong>：在正方体展开图中，相对面相隔一格或在 Z 字两端。公考中若看到二者同时出现在立体图相邻视野里，直接秒杀排除！
                          </p>
                          <div className="bg-sky-950/40 border border-sky-500/30 rounded-lg p-2 text-[11px] text-sky-300">
                            🔬 <strong>空间拓扑规律</strong>：无论你选择哪一个面作为基准，六面之间的相对空间拓扑关系（A对C、B对D、E对F）永恒不变！点击上方其他字母试一试！
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                stopAnimation();
                                startAnimation(1, 2000, false);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>折叠动画验证</span>
                            </button>
                            <button
                              onClick={() => {
                                const nextTargetId = (guidedStep2TargetFaceId + 1) % 6;
                                setGuidedStep2TargetFaceId(nextTargetId);
                                setGuidedStep2Answer(null);
                                stopAnimation();
                                setFoldProgress(0);
                              }}
                              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>换个目标面再试</span>
                            </button>
                            <button
                              onClick={() => handleSelectGuidedStep(3)}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>进入第 3 阶</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-rose-400">
                            <AlertOctagon className="w-4 h-4" />
                            <span>❌ 错误提示：选中的【{guidedStep2Answer}面】是【相邻面】！</span>
                          </div>
                          <p className="text-rose-200/90 text-[11px] leading-relaxed">
                            你选的 {guidedStep2Answer} 面与 {targetPattern.name} 之间在空间中共用棱，折起 90° 后垂直相交，绝非相对面！
                            <br />
                            💡 <strong>启发指引</strong>：相对面绝不相连，展开图中通常<strong>“隔一个面”</strong>。试着找与 {targetPattern.letter} 面相隔一格的那个面！
                          </p>
                          <button
                            onClick={() => {
                              stopAnimation();
                              startAnimation(1, 2000, false);
                            }}
                            className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>折起验证观察</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => handleSelectGuidedStep(1)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>返回第 1 阶：认基准面</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 3: 跟踪公共边 */}
            {guidedStep === 3 && (() => {
              const currCase = GUIDED_STEP3_CASES[step3CaseIndex] || GUIDED_STEP3_CASES[0];
              const isCaseAnswered = guidedStep3Answer !== null;
              const isCorrect = guidedStep3Answer === currCase.matchingFaceLetter;

              return (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>第 3 阶任务：跟踪公共边（边缘旋转贴合 · 举一反三）</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <strong>核心直觉</strong>：展开图外围看似分离的两条边，折叠成立方体后会<strong>严密贴合并成为同一条空间棱（公共边）</strong>！这是考查图形旋转指向的最核心知识点。
                    </p>
                  </div>

                  {/* Case pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">选择公共边探究案例：</span>
                      <span className="text-[11px] text-amber-400 font-medium">3组典型边贴合</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {GUIDED_STEP3_CASES.map((c, idx) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setStep3CaseIndex(idx);
                            setGuidedStep3Answer(null);
                            stopAnimation();
                            setFoldProgress(0);
                          }}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            step3CaseIndex === idx
                              ? 'bg-sky-500/20 border-sky-400 text-sky-200 ring-2 ring-sky-400/40 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs block font-bold">案例 {idx + 1}</span>
                          <span className="text-[10px] text-slate-400 truncate block">{c.targetFaceLetter} ➔ {c.matchingFaceLetter}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-400 animate-pulse" />
                      <span className="font-bold text-amber-300">
                        ❓ 探究提问：盯住【{currCase.targetEdgeName}】！
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      当展开图折成立体盒时，展开图外围的哪条边会旋转贴合过来，与这条橙色边在空间中重合？
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {currCase.options.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setGuidedStep3Answer(opt.key);
                            if (opt.correct) {
                              setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 3])));
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                            guidedStep3Answer === opt.key
                              ? opt.correct
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50'
                                : 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400/50'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <span className="font-bold text-xs">{opt.name}</span>
                          <span className="text-[10px] text-slate-400">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  {isCaseAnswered && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>🎉 观察敏锐！【{currCase.targetFaceLetter}面】与【{currCase.matchingFaceLetter}面】对应边紧密贴合！</span>
                          </div>
                          <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                            <strong>空间轨迹解析</strong>：{currCase.explanation}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleAnimateToPause(0.85)}
                              className="flex-1 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 text-amber-400" />
                              <span>85% 贴合瞬间慢放暂停</span>
                            </button>
                            <button
                              onClick={() => {
                                const nextIdx = (step3CaseIndex + 1) % GUIDED_STEP3_CASES.length;
                                setStep3CaseIndex(nextIdx);
                                setGuidedStep3Answer(null);
                                stopAnimation();
                                setFoldProgress(0);
                              }}
                              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>换案例再试</span>
                            </button>
                            <button
                              onClick={() => handleSelectGuidedStep(4)}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>进入第 4 阶</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-rose-400">
                            <AlertOctagon className="w-4 h-4" />
                            <span>❌ 边不匹配提示：观察两条边的旋转轨迹！</span>
                          </div>
                          <p className="text-rose-200/90 text-[11px] leading-relaxed">
                            所选面的边缘折叠后去了其他方位，无法与发光橙色边重合。请注意观察【{currCase.matchingFaceLetter}面】在折起过程中的贴合运动轨迹！
                          </p>
                          <button
                            onClick={() => {
                              stopAnimation();
                              startAnimation(1, 2000, false);
                            }}
                            className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>折起验证观察</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => handleSelectGuidedStep(2)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>返回第 2 阶：辨相对面</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 4: 跟踪公共顶点 */}
            {guidedStep === 4 && (() => {
              const currCase = GUIDED_STEP4_CASES[step4CaseIndex] || GUIDED_STEP4_CASES[0];
              const isCaseAnswered = guidedStep4Answer !== null;
              const isCorrect = currCase.options.find((o) => o.key === guidedStep4Answer)?.correct ?? false;

              return (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-sky-400" />
                      <span>第 4 阶任务：跟踪公共顶点（三面汇聚与时针法 · 举一反三）</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      💡 <strong>核心直觉</strong>：展开图上看似分开的 3 个直角，折叠后会汇聚成同一个<strong>空间三维顶点（公共顶点）</strong>！围绕顶点的三个面，时针旋转方向在平面与立体中保持不变！
                    </p>
                  </div>

                  {/* Vertex selector pills */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">选择要探究的公共顶点：</span>
                      <span className="text-[11px] text-amber-400 font-medium">3组典型顶点汇聚</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {GUIDED_STEP4_CASES.map((c, idx) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setStep4CaseIndex(idx);
                            setGuidedStep4Answer(null);
                            stopAnimation();
                            setFoldProgress(0);
                          }}
                          className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            step4CaseIndex === idx
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-xs block font-bold">{c.vertexName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-300 animate-pulse" />
                      <span className="font-bold text-amber-300">
                        ❓ 探究提问：观察金色发光球【{currCase.title}】所在交角！
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      折成立体盒后，展开图上的哪三个面会在金色光球处紧密汇聚相交？
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {currCase.options.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setGuidedStep4Answer(opt.key);
                            if (opt.correct) {
                              setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 4])));
                            }
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            guidedStep4Answer === opt.key
                              ? opt.correct
                                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 font-bold'
                                : 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 font-bold'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-medium block">{opt.label}</span>
                            <span className="text-[10px] text-slate-400">{opt.desc}</span>
                          </div>
                          {guidedStep4Answer === opt.key && (
                            <span className="text-[11px] font-bold">{opt.correct ? '✓ 正确' : '✗ 错误'}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  {isCaseAnswered && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>🎉 完全正确！</span>
                          </div>
                          <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                            {currCase.explanation}
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                stopAnimation();
                                startAnimation(1, 2000, false);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>折叠动画验证</span>
                            </button>
                            <button
                              onClick={() => {
                                const nextIdx = (step4CaseIndex + 1) % GUIDED_STEP4_CASES.length;
                                setStep4CaseIndex(nextIdx);
                                setGuidedStep4Answer(null);
                                stopAnimation();
                                setFoldProgress(0);
                              }}
                              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>换个顶点再试</span>
                            </button>
                            <button
                              onClick={() => handleSelectGuidedStep(5)}
                              className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>进入第 5 阶：变式盲测</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 font-bold text-rose-400">
                            <AlertOctagon className="w-4 h-4" />
                            <span>❌ 错误提示：注意看交角处的直接邻接面！</span>
                          </div>
                          <p className="text-rose-200/90 text-[11px] leading-relaxed">
                            所选组合中包含相对面（相对面永不共顶点）或距离该顶点较远的面。请看展开图上直接与该金色交角紧邻的 3 个面！
                          </p>
                          <button
                            onClick={() => {
                              stopAnimation();
                              startAnimation(1, 2000, false);
                            }}
                            className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>折起验证观察</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => handleSelectGuidedStep(3)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>返回第 3 阶：公共边</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* STEP 5: 变式盲测 (3道全构型无辅助变式挑战) */}
            {guidedStep === 5 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>第 5 阶任务：无辅助变式盲测 ({step5SubQuestion} / 3)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          step5SubQuestion === 1
                            ? 'bg-amber-400 ring-2 ring-amber-400/40'
                            : guidedStep5Q1Answer === 'D'
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          step5SubQuestion === 2
                            ? 'bg-amber-400 ring-2 ring-amber-400/40'
                            : guidedStep5Q2Answer === 'C'
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          step5SubQuestion === 3
                            ? 'bg-amber-400 ring-2 ring-amber-400/40'
                            : guidedStep5Q3Answer === 'F'
                            ? 'bg-emerald-400'
                            : 'bg-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <strong>终极考验</strong>：已撤掉所有线框辅助高亮与颜色提示。先自主预测，再折起验证，检验跨构型空间推演直觉！
                  </p>
                </div>

                {step5SubQuestion === 1 && (
                  /* Question 1: Net 2-3-1 */
                  <div className="space-y-3">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">
                          ❓ 挑战 1：在当前【2-3-1 阶梯型】展开图中，【B面 (红色右箭头)】的相对面是？
                        </span>
                        {step5Q1FirstTryCorrect !== null && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step5Q1FirstTryCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {step5Q1FirstTryCorrect ? '🌟 独立答对' : '💡 需提示'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { key: 'D', name: 'D面 · 黑色实心方', correct: true },
                          { key: 'C', name: 'C面 · 金色五角星', correct: false },
                          { key: 'E', name: 'E面 · 紫色对角大叉', correct: false },
                          { key: 'F', name: 'F面 · 对角半黑半白', correct: false },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setGuidedStep5Q1Answer(opt.key);
                              if (step5Q1FirstTryCorrect === null) {
                                const isIndep = opt.correct && !step5Q1FoldedRef.current;
                                setStep5Q1FirstTryCorrect(isIndep);
                              }
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              guidedStep5Q1Answer === opt.key
                                ? opt.correct
                                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 font-bold'
                                  : 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <FaceThumbnail pattern={PATTERNS.find((p) => p.letter === opt.key)!} size={28} />
                            <span className="text-xs">{opt.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {guidedStep5Q1Answer && (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                          guidedStep5Q1Answer === 'D'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {guidedStep5Q1Answer === 'D' ? (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>🎉 判断精准！B 面与 D 面互为相对面！</span>
                            </div>
                            <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                              <strong>空间解析</strong>：在 2-3-1 构型中，观察中间垂直列：D 面、A 面、B 面在同一列。B 与 D 之间隔着 A 面（同行列隔一格必为相对面）。
                            </p>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  startAnimation(1, 2000, false);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>折起验证</span>
                              </button>
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  setNetType('2-2-2');
                                  setAnchorFaceId(0);
                                  setFoldProgress(0);
                                  setStep5SubQuestion(2);
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>进入挑战 2 (2-2-2 双阶梯型)</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-rose-400">
                              <AlertOctagon className="w-4 h-4" />
                              <span>❌ 提示：在中间竖列观察“隔一格”规律！</span>
                            </div>
                            <p className="text-rose-200/90 text-[11px] leading-relaxed">
                              B 面在下方，中间隔着 A 面，正上方是 D 面。同列相隔一格的两个面折起后必定平行相对！点击“折起验证”亲眼观察。
                            </p>
                            <button
                              onClick={() => {
                                stopAnimation();
                                startAnimation(1, 2000, false);
                              }}
                              className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>折起验证观察</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {step5SubQuestion === 2 && (
                  /* Question 2: Net 2-2-2 */
                  <div className="space-y-3">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">
                          ❓ 挑战 2：在【2-2-2 双阶梯型】展开图中，【A面 (双同心圆)】的相对面是？
                        </span>
                        {step5Q2FirstTryCorrect !== null && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step5Q2FirstTryCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {step5Q2FirstTryCorrect ? '🌟 独立答对' : '💡 需提示'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { key: 'C', name: 'C面 · 金色五角星', correct: true },
                          { key: 'B', name: 'B面 · 红色右箭头', correct: false },
                          { key: 'D', name: 'D面 · 黑色实心方', correct: false },
                          { key: 'E', name: 'E面 · 紫色对角大叉', correct: false },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setGuidedStep5Q2Answer(opt.key);
                              if (step5Q2FirstTryCorrect === null) {
                                const isIndep = opt.correct && !step5Q2FoldedRef.current;
                                setStep5Q2FirstTryCorrect(isIndep);
                              }
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              guidedStep5Q2Answer === opt.key
                                ? opt.correct
                                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 font-bold'
                                  : 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <FaceThumbnail pattern={PATTERNS.find((p) => p.letter === opt.key)!} size={28} />
                            <span className="text-xs">{opt.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {guidedStep5Q2Answer && (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                          guidedStep5Q2Answer === 'C'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {guidedStep5Q2Answer === 'C' ? (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>🎉 判断精准！A 面与 C 面互为相对面！</span>
                            </div>
                            <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                              <strong>空间解析</strong>：在 2-2-2 阶梯图中，从 A 面(0) 出发向右经由 F 面(5)、向上经由 B 面(1) 拐弯到达 C 面(2)（形成跨越 4 面的经典 Z 字形阶梯两端），折起后二者严格平行相对！
                            </p>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  startAnimation(1, 2000, false);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>折起验证</span>
                              </button>
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  setNetType('3-3');
                                  setAnchorFaceId(3);
                                  setFoldProgress(0);
                                  setStep5SubQuestion(3);
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <span>进入挑战 3 (3-3 两行错位型)</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-rose-400">
                              <AlertOctagon className="w-4 h-4" />
                              <span>❌ 提示：在 2-2-2 阶梯型中运用“Z 字两端法”！</span>
                            </div>
                            <p className="text-rose-200/90 text-[11px] leading-relaxed">
                              在 2-2-2 阶梯图中，从 A 面出发向右经由 F 面(5)、向上至 B 面(1) 再向右拐弯至 C 面(2)（形成 A ➔ F ➔ B ➔ C 跨越 4 面的经典 Z 字阶梯路径）。位于两端的 A 与 C 折叠后必定正对！点击“折起验证”亲眼观察。
                            </p>
                            <button
                              onClick={() => {
                                stopAnimation();
                                startAnimation(1, 2000, false);
                              }}
                              className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>折起验证观察</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {step5SubQuestion === 3 && (
                  /* Question 3: Net 3-3 */
                  <div className="space-y-3">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">
                          ❓ 挑战 3：在难度最高的【3-3 两行错位型】展开图中，【E面 (紫色对角大叉)】的相对面是？
                        </span>
                        {step5Q3FirstTryCorrect !== null && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step5Q3FirstTryCorrect
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {step5Q3FirstTryCorrect ? '🌟 独立答对' : '💡 需提示'}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {[
                          { key: 'F', name: 'F面 · 对角半黑半白', correct: true },
                          { key: 'A', name: 'A面 · 双同心圆', correct: false },
                          { key: 'B', name: 'B面 · 红色右箭头', correct: false },
                          { key: 'D', name: 'D面 · 黑色实心方', correct: false },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setGuidedStep5Q3Answer(opt.key);
                              if (step5Q3FirstTryCorrect === null) {
                                const isIndep = opt.correct && !step5Q3FoldedRef.current;
                                setStep5Q3FirstTryCorrect(isIndep);
                              }
                              if (opt.correct) {
                                setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 5])));
                              }
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              guidedStep5Q3Answer === opt.key
                                ? opt.correct
                                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/50 font-bold'
                                  : 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400/50 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <FaceThumbnail pattern={PATTERNS.find((p) => p.letter === opt.key)!} size={28} />
                            <span className="text-xs">{opt.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {guidedStep5Q3Answer && (
                      <div
                        className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                          guidedStep5Q3Answer === 'F'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        }`}
                      >
                        {guidedStep5Q3Answer === 'F' ? (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>🎉 攻克终极变式！3 道变式全通关！</span>
                            </div>
                            <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                              <strong>空间解析</strong>：在 3-3 两行错位图中，E面(4) 和 F面(5) 分别位于第一行的两端。折叠时 E 面向左折起、F 面翻折至相对底面，二者在空间中严格平行正对！至此，你已掌握所有 11 种正方体展开图的核心空间推演法则！
                            </p>
                            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1.5">
                              <div className="font-semibold flex items-center justify-between">
                                <span>🎯 空间直觉阶梯通关认证：</span>
                                {step5Q1FirstTryCorrect && step5Q2FirstTryCorrect && step5Q3FirstTryCorrect ? (
                                  <span className="text-amber-300 font-bold">🌟 变式全独立攻克 (金牌空间直觉)</span>
                                ) : (
                                  <span className="text-emerald-200 font-medium">✨ 空间推演优秀 (扎实掌握)</span>
                                )}
                              </div>
                              <div className="text-slate-300 text-[10px] space-y-0.5 border-t border-slate-800/80 pt-1.5">
                                <div className="font-medium text-slate-400 mb-1">已掌握 5 阶核心空间认知：</div>
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <span>✓ ① 任意基准面参照锚定（A~F面随心指定）</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <span>✓ ② 相对面空间对立与拓扑守恒（隔一格与Z字两端）</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <span>✓ ③ 公共边空间旋转贴合轨迹跟踪</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <span>✓ ④ 公共顶点三面汇聚与时针一致性</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-emerald-400">
                                  <span>✓ ⑤ 跨构型变式无辅助盲测（2-3-1 / 2-2-2 / 3-3 全通关）</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  startAnimation(1, 2000, false);
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>折叠验证</span>
                              </button>
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  setStep5SubQuestion(1);
                                  setGuidedStep5Q1Answer(null);
                                  setGuidedStep5Q2Answer(null);
                                  setGuidedStep5Q3Answer(null);
                                  setStep5Q1FirstTryCorrect(null);
                                  setStep5Q2FirstTryCorrect(null);
                                  setStep5Q3FirstTryCorrect(null);
                                  step5Q1FoldedRef.current = false;
                                  step5Q2FoldedRef.current = false;
                                  step5Q3FoldedRef.current = false;
                                  setNetType('2-3-1');
                                  setAnchorFaceId(0);
                                  setFoldProgress(0);
                                }}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>重新挑战</span>
                              </button>
                              <button
                                onClick={() => {
                                  stopAnimation();
                                  setViewMode('free');
                                  setFoldProgress(0);
                                }}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>自由探索 11 种构型</span>
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 font-bold text-rose-400">
                              <AlertOctagon className="w-4 h-4" />
                              <span>❌ 提示：在 3-3 错位型中观察第一行两端走向！</span>
                            </div>
                            <p className="text-rose-200/90 text-[11px] leading-relaxed">
                              第一行包含 E(左)、D(中)、F(右)。折叠时左右两端立起并合围，E 面与 F 面在空间中正好成为相对正对的两面！点击“折起验证”亲眼观察。
                            </p>
                            <button
                              onClick={() => {
                                stopAnimation();
                                startAnimation(1, 2000, false);
                              }}
                              className="w-full py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/30 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>折起验证观察</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Subquestion navigation / Step 4 navigation */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  {step5SubQuestion > 1 ? (
                    <button
                      onClick={() => {
                        stopAnimation();
                        const prevQ = (step5SubQuestion - 1) as 1 | 2;
                        setStep5SubQuestion(prevQ);
                        setNetType(prevQ === 1 ? '2-3-1' : '2-2-2');
                        setAnchorFaceId(0);
                        setFoldProgress(0);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>返回挑战 {step5SubQuestion - 1}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectGuidedStep(4)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>返回第 4 阶：公共顶点</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* FREE EXPLORATION & 11 NETS CATALOG PANEL                  */
          /* ========================================================= */
          <>
            {/* Shortcut back to Guided Ladder */}
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 p-3 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-amber-200">
                  空间直觉薄弱？随时体验阶梯引导教学
                </span>
              </div>
              <button
                onClick={() => {
                  setViewMode('guided');
                  handleSelectGuidedStep(1);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors flex-shrink-0 cursor-pointer"
              >
                开启引导
              </button>
            </div>

            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-1.5">
                  <span>📦 正方体全部 11 种展开构型透视</span>
                </h2>
                <button
                  onClick={() => setShowCatalog(!showCatalog)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{showCatalog ? '折叠图鉴' : '11种图鉴'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                正方体展开图绝非千变万化，<strong>全世界只有 11 种合法形态</strong>！牢记“一四一六、二三一三、二二二台阶、三三错开”即通关。
              </p>
            </div>

            {/* Anchor Face Selection Card */}
            <div className="bg-gradient-to-br from-amber-950/20 via-slate-900/70 to-slate-900/90 p-3.5 rounded-xl border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>🎯 自由选定折叠基准面 (其余面折向它)</span>
                </div>
                {anchorFaceId !== 0 && (
                  <button
                    onClick={() => setAnchorFaceId(0)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    恢复默认
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                公考解题绝技：<strong>主动选定任意面为基准不动</strong>，观察其余 5 个面如何折叠闭合！在 3D 画布中直接点击任意面，或点击下方卡片即可切换。
              </p>

              <div className="grid grid-cols-2 gap-2">
                {PATTERNS.map((p) => {
                  const isSelected = p.id === anchorFaceId;
                  const isHovered = p.id === hoveredFaceId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setAnchorFaceId(p.id)}
                      onMouseEnter={() => setHoveredFaceId(p.id)}
                      onMouseLeave={() => setHoveredFaceId(null)}
                      className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 relative cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-400/50'
                          : isHovered
                          ? 'bg-slate-800/90 border-slate-600 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <FaceThumbnail pattern={p} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {p.name.split(' · ')[0]}
                          </span>
                          {isSelected && (
                            <span className="px-1 py-0.2 text-[9px] bg-amber-400/20 text-amber-300 rounded font-bold">
                              基准
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.name.split(' · ')[1]}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          对立面: {PATTERNS[p.oppositeId].name.split(' · ')[0]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    startAnimation(1, 2000, false);
                  }}
                  className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                  <span>以【{PATTERNS[anchorFaceId].name.split(' · ')[0]}】为底，自动演示折叠成盒</span>
                </button>
              </div>
            </div>

            {/* 11 Nets Catalog Modal / Expandable Card */}
            {showCatalog && (
              <div className="bg-indigo-950/30 border border-indigo-500/40 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    公考正方体 11 种合法展开图四大家族
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">总计 11 种</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-400">① 一四一型 (共 6 种)</div>
                    <div className="text-[11px] text-slate-400">中间 4 个一字排开，上下各 1 个。上 1 个在 4 列任意位置，下 1 个对应排布。</div>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-400">② 二三一型 (共 3 种)</div>
                    <div className="text-[11px] text-slate-400">中间 3 个一排，上方 2 个并排，下方 1 个（像楼梯拐角）。</div>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-400">③ 二二二型 (共 1 种)</div>
                    <div className="text-[11px] text-slate-400">每行 2 个，依次错开一格，成经典的三级台阶形状。</div>
                  </div>
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-indigo-400">④ 三三型 (共 1 种)</div>
                    <div className="text-[11px] text-slate-400">两排各 3 个，相互错开一格，成目字相错形。</div>
                  </div>
                </div>
              </div>
            )}

            {/* Illegal Nets Traps Box */}
            <div className="bg-rose-950/25 border border-rose-500/30 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>【秒杀排误神诀】见此三种，直接 1 秒排除！</span>
              </div>
              <div className="text-xs text-rose-200/90 space-y-1 leading-relaxed">
                <p>❌ <strong>“田”字型必死</strong>：出现 4 个正方形拼成 2×2 田字格，折叠后必定重叠！</p>
                <p>❌ <strong>“凹”字型必死</strong>：出现凹陷卡槽的造型，折叠后两侧必重合缺盖！</p>
                <p>❌ <strong>“一线五方/六方”必死</strong>：任意单行连续正方形个数 ≥ 5，无法闭合为正方体！</p>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300">当前展开图辅助透视：</div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-200">一键标识 3 对相对面</div>
                  <div className="text-[10px] text-slate-400">红/绿/蓝边框分别代表 3 组对立面</div>
                </div>
                <button
                  onClick={() => setHighlightOpposite(!highlightOpposite)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    highlightOpposite ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {highlightOpposite ? '已开启' : '已关闭'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div>
                  <div className="text-xs font-medium text-slate-200">公共顶点金珠标记</div>
                  <div className="text-[10px] text-slate-400">折叠前后验证时针旋转顺序</div>
                </div>
                <button
                  onClick={() => setShowClockwiseVertex(!showClockwiseVertex)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    showClockwiseVertex ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {showClockwiseVertex ? '已标记' : '未标记'}
                </button>
              </div>
            </div>

            {/* Face Rolling & Conversion Trick */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>考场绝技：面面履带滚动平移法</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                考题中看似奇怪的展开图，绝大多数都是由 <strong>1-4-1 或 2-3-1 滚动出来的</strong>！
              </p>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>履带滚动原理</strong>：只要中间有连续的面，最边上的面可以顺着外围边缘<strong>“翻滚平移”</strong>到对面！通过在脑中滚动一格，奇奇怪怪的展开图瞬间还原成最熟悉的标准 1-4-1 十字架！
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
