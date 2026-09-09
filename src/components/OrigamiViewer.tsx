import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
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
  const initialStep5SubQ: 1 | 2 = savedProgress?.step5SubQuestion || 1;

  const deriveGuidedNetType = (step: number, subQ: number): NetType => {
    if (step === 5) {
      return subQ === 2 ? '2-2-2' : '2-3-1';
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
    return 0;
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
  const [guidedStep1Found, setGuidedStep1Found] = useState<boolean>(() => Boolean(savedProgress?.guidedStep1Found));
  const [guidedStep1Feedback, setGuidedStep1Feedback] = useState<{
    type: 'success' | 'hint' | 'error';
    text: string;
  } | null>(null);
  const [guidedStep2Answer, setGuidedStep2Answer] = useState<string | null>(() => savedProgress?.guidedStep2Answer ?? null);
  const [guidedStep3Answer, setGuidedStep3Answer] = useState<string | null>(() => savedProgress?.guidedStep3Answer ?? null);
  const [guidedStep4Answer, setGuidedStep4Answer] = useState<string | null>(() => savedProgress?.guidedStep4Answer ?? null);
  const [step5SubQuestion, setStep5SubQuestion] = useState<1 | 2>(initialStep5SubQ);
  const [guidedStep5Q1Answer, setGuidedStep5Q1Answer] = useState<string | null>(() => savedProgress?.guidedStep5Q1Answer ?? null);
  const [step5Q1FirstTryCorrect, setStep5Q1FirstTryCorrect] = useState<boolean | null>(() => savedProgress?.step5Q1FirstTryCorrect ?? null);
  const [guidedStep5Q2Answer, setGuidedStep5Q2Answer] = useState<string | null>(() => savedProgress?.guidedStep5Q2Answer ?? null);
  const [step5Q2FirstTryCorrect, setStep5Q2FirstTryCorrect] = useState<boolean | null>(() => savedProgress?.step5Q2FirstTryCorrect ?? null);
  const [guidedCompletedSteps, setGuidedCompletedSteps] = useState<number[]>(() => savedProgress?.guidedCompletedSteps || []);

  // Step 5 anti-peeking: track if model was folded before answering
  const step5Q1FoldedRef = useRef<boolean>(false);
  const step5Q2FoldedRef = useRef<boolean>(false);

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
      guidedCompletedSteps,
      netType,
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
    guidedCompletedSteps,
    netType,
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

  useEffect(() => {
    viewModeRef.current = viewMode;
    guidedStepRef.current = guidedStep;
    foldProgressRef.current = foldProgress;
  }, [viewMode, guidedStep, foldProgress]);

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
    setAnchorFaceId(0);
    setFoldProgress(0);
    if (step === 5) {
      step5Q1FoldedRef.current = false;
      step5Q2FoldedRef.current = false;
      setNetType(step5SubQuestion === 2 ? '2-2-2' : '2-3-1');
    } else {
      setNetType('1-4-1');
    }
  };




  // Create canvas textures once
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
              if (fid === 0) {
                if (curProgress >= 0.75) {
                  setGuidedStep1Found(true);
                  setGuidedStep1Feedback({
                    type: 'success',
                    text: '🎉 太棒了！你在折叠后的立体盒子上成功定位到了基准面 A！',
                  });
                  setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
                } else {
                  setGuidedStep1Feedback({
                    type: 'hint',
                    text: '💡 请先拉动折叠滑块（或点下方“自动折成3D盒子”）将纸盒折起到 75% 以上，再在立体盒子上点击 A 面确认！',
                  });
                }
              } else {
                setGuidedStep1Feedback({
                  type: 'error',
                  text: `你点击的是 ${PATTERNS[fid].letter} 面，请旋转视角寻找带有【双同心圆】标记的基准面 A！`,
                });
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
        // Step 1: focus only on anchor face 0 (A)
        guidedDimmedFaces = [1, 2, 3, 4, 5];
      } else if (guidedStep === 2) {
        // Step 2: focus on Face 0 (A) and Face 2 (C), Face 1 is connector
        guidedDimmedFaces = guidedStep2Answer === 'C' ? [3, 4, 5] : [];
      } else if (guidedStep === 3) {
        // Step 3: dim unrelated faces only AFTER answering to avoid pre-selection clue
        guidedDimmedFaces = guidedStep3Answer !== null ? [2, 3, 4] : [];
      } else if (guidedStep === 4) {
        // Step 4: dim unrelated faces only AFTER answering to avoid pre-selection clue
        guidedDimmedFaces = guidedStep4Answer !== null ? [2, 3, 5] : [];
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
        if (patternIndex === 1) {
          // Orange glowing cylinder along right edge of Face 1 (+X) (the question target)
          const edgeCyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, a, 16),
            new THREE.MeshStandardMaterial({
              color: 0xf97316,
              emissive: 0xf97316,
              emissiveIntensity: 1.0,
              roughness: 0.2,
            })
          );
          edgeCyl.rotation.x = Math.PI / 2;
          edgeCyl.position.set(h, 0.04, 0);
          mesh.add(edgeCyl);
        } else if (patternIndex === 5 && guidedStep3Answer !== null) {
          // Sky blue glowing cylinder along bottom edge of Face 5 (+Z) ONLY after answering
          const edgeCyl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, a, 16),
            new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0284c7,
              emissiveIntensity: 1.0,
              roughness: 0.2,
            })
          );
          edgeCyl.rotation.z = Math.PI / 2;
          edgeCyl.position.set(0, 0.04, h);
          mesh.add(edgeCyl);
        }
      }

      // Step 4 vertex tracking in Guided Mode:
      if (viewMode === 'guided' && guidedStep === 4) {
        if (patternIndex === 0) {
          // Golden glowing sphere at corner (-h, 0, h) (Vertex P)
          const vertexSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 24, 24),
            new THREE.MeshStandardMaterial({
              color: 0xfacc15,
              emissive: 0xf59e0b,
              emissiveIntensity: 1.2,
              roughness: 0.2,
            })
          );
          vertexSphere.position.set(-h, 0.08, h);
          mesh.add(vertexSphere);
        } else if (patternIndex === 1 && guidedStep4Answer !== null) {
          // Corner bead on Face 1 ONLY after answering
          const vertexSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
          );
          vertexSphere.position.set(-h, 0.08, -h);
          mesh.add(vertexSphere);
        } else if (patternIndex === 4 && guidedStep4Answer !== null) {
          // Corner bead on Face 4 ONLY after answering
          const vertexSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.11, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xa855f7 })
          );
          vertexSphere.position.set(h, 0.08, h);
          mesh.add(vertexSphere);
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
    guidedStep2Answer,
    guidedStep3Answer,
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
      <div className="relative w-full h-[45vh] min-h-[270px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Row 1: Mode Switcher + Camera Preset Toolbar */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 z-10">
          {/* Main Mode Toggle: Guided Ladder vs Free Exploration */}
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
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
              <span>💡 空间直觉引导教学</span>
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
              <span>🎮 自由探索与11种图鉴</span>
            </button>
          </div>

          {/* Camera View Presets */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
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
          <div className="absolute top-12 left-2 right-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-10">
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
          <div className="absolute top-12 left-2 right-2 flex flex-col gap-1.5 z-10">
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

        {/* 3D Direct Click / Hover Floating Notification */}
        {hoveredFaceId !== null ? (
          <div className="absolute top-[5.75rem] left-2 flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 text-slate-950 font-bold text-[11px] rounded-lg shadow-xl backdrop-blur-md z-10 pointer-events-none animate-in fade-in">
            <MousePointerClick className="w-3.5 h-3.5 text-slate-950" />
            <span>点击设定基准面：{PATTERNS[hoveredFaceId].name}</span>
          </div>
        ) : (
          <div className="absolute top-[5.75rem] left-2 hidden md:flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg pointer-events-none z-10">
            <MousePointerClick className="w-3 h-3 text-amber-400" />
            <span>可直接在 3D 画布中点击任意面切换基准面</span>
          </div>
        )}

        {/* Bottom Folding Slider & Step Controls */}
        {(() => {
          const isBlindTesting = viewMode === 'guided' && guidedStep === 5 && (
            (step5SubQuestion === 1 && !guidedStep5Q1Answer) ||
            (step5SubQuestion === 2 && !guidedStep5Q2Answer)
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

        <div className="absolute top-2 right-2 hidden 2xl:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>旋转 3D 视角观察图案闭合</span>
        </div>
      </div>

      {/* Right Control & Theory Panel */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        {viewMode === 'guided' ? (
          /* ========================================================= */
          /* GUIDED LEARNING LADDER CARDS (Step 1 to 5)                */
          /* ========================================================= */
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Guided Header Card */}
            <div className="bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-900 border border-amber-500/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>空间直觉阶梯引导 · 第 {guidedStep} / 5 阶</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {guidedStep === 1 && '空间基准锚定'}
                  {guidedStep === 2 && '相对面排除法则'}
                  {guidedStep === 3 && '公共边旋转贴合'}
                  {guidedStep === 4 && '三面公共顶点'}
                  {guidedStep === 5 && '独立盲测检验'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                遵循<strong>“先猜 ➔ 再操作 ➔ 最后验证”</strong>的认知规律，每次只攻克一个空间几何关系，轻松打破空间直觉壁垒！
              </p>
            </div>

            {/* STEP 1: 认一个面 */}
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

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-semibold text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>目标指示：锁定【A面 · 双同心圆 (基准面)】</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    看左侧画布：我们已将【A面】固定为基准面（其余面已自动淡化）。
                    请点击下方按钮<strong>将纸盒折起到 75% 以上</strong>，然后在 3D 盒子上<strong>找到并点击【A面】</strong>！
                  </p>
                </div>

                {guidedStep1Feedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 animate-in fade-in ${
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

                {guidedStep1Found ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/50 p-3 rounded-xl space-y-2 text-xs text-emerald-300 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>🎉 太棒了！成功锁定基准面 A！</span>
                    </div>
                    <p className="text-emerald-200/90 leading-relaxed text-[11px]">
                      无论纸盒如何翻转闭合，<strong>基准面都是三维空间的固定参照面</strong>。有了这个固定基准，其余 5 个面在脑海里就不会乱飞！
                    </p>
                    <button
                      onClick={() => handleSelectGuidedStep(2)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>进入第 2 阶：辨析相对面与相邻面</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          startAnimation(1, 2000, true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>自动折成 3D 盒子</span>
                      </button>
                      <button
                        onClick={() => {
                          stopAnimation();
                          setFoldProgress(0);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        平铺展开
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      操作指引：纸盒折起后，用鼠标或手指旋转 3D 视角，点击带有【双同心圆】的 A 面
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: 找相对面与相邻面 */}
            {guidedStep === 2 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>第 2 阶任务：辨析相对面与相邻面（空间对立规律）</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <strong>概念解析</strong>：
                    <br />
                    • <strong>相邻面</strong>：空间中共用一条折痕（棱），折起后垂直挨着。
                    <br />
                    • <strong>相对面</strong>：空间中平行相对，<strong>绝不共用任何棱或顶点</strong>！在展开图中通常<strong>“隔一个面”</strong>。
                  </p>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-amber-300 block">
                    ❓ 探究提问：哪个面折起后会成为【A面】的相对面？
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    请在展开图中观察其余 5 个面，先猜一猜哪一个面折起后会与 A 面正对（平行且互不接触）：
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {PATTERNS.filter((p) => p.id !== 0).map((p) => {
                      const isSelected = guidedStep2Answer === p.letter;
                      const isCorrect = p.letter === 'C';
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setGuidedStep2Answer(p.letter);
                            if (p.letter === 'C') {
                              setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
                            }
                          }}
                          className={`py-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? isCorrect
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
                      guidedStep2Answer === 'C'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {guidedStep2Answer === 'C' ? (
                      <>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>🎉 回答完全正确！A 面与 C 面互为相对面！</span>
                        </div>
                        <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                          <strong>空间验证</strong>：A 面与 C 面之间隔着 B 面。折起后，A 面与 C 面在空间中严格平行相对，永不共用棱或顶点！公考中若看到 A 面与 C 面同时出现在立体图的相邻视野里，直接秒杀排除！
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
                          <span>❌ 错误提示：选中的 {guidedStep2Answer} 面是【相邻面】！</span>
                        </div>
                        <p className="text-rose-200/90 text-[11px] leading-relaxed">
                          你选的 {guidedStep2Answer} 面与 A 面之间有折线相连（共用一条边），折起 90° 后它们在空间中是垂直相交的相邻面，绝非相对面！
                          <br />
                          💡 <strong>启发指引</strong>：在经典 1-4-1 展开图中，相对面必须<strong>相隔一个面</strong>，试着找跟 A 面隔一格的那个面！
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: 跟踪公共边 */}
            {guidedStep === 3 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>第 3 阶任务：跟踪一条公共边（边缘旋转贴合）</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <strong>核心直觉</strong>：展开图外围看似分离的两条边，折叠成立方体后会<strong>严密贴合并成为同一条空间棱（公共边）</strong>！这是考查图形旋转指向的最核心知识点。
                  </p>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-400 animate-pulse" />
                    <span className="font-bold text-amber-300">
                      ❓ 探究提问：盯住【B面】边缘的发光橙色边！
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    当展开图折成立体盒时，展开图外围的哪条边会旋转贴合过来，与这条橙色边在空间中重合？
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { key: 'F', label: 'F面 · 半黑半白', desc: '对角半黑半白面', correct: true },
                      { key: 'D', label: 'D面 · 黑色方块', desc: '深灰实心方块面', correct: false },
                      { key: 'C', label: 'C面 · 金色五星', desc: '金色五角星面', correct: false },
                    ].map((opt) => (
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
                        <span className="font-bold text-xs">{opt.label}</span>
                        <span className="text-[10px] text-slate-400">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {guidedStep3Answer && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                      guidedStep3Answer === 'F'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {guidedStep3Answer === 'F' ? (
                      <>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>🎉 观察敏锐！B 面橙色边与 F 面对应边紧密贴合！</span>
                        </div>
                        <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                          <strong>空间轨迹解析</strong>：B 面向前折起 90°，F 面向右向上弯折 90°。两条边缘在棱处严密贴合并亮起天蓝色光芒！点击下方<strong>【贴合前夕 85% 关键帧】</strong>慢放观察这个相遇瞬间！
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
                          B 面右侧位于正方体的侧棱位置，而 {guidedStep3Answer} 面的边缘折叠后去了另一侧，无法相交！请注意看右侧【F面】底部的对应棱边轨迹！
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: 跟踪公共顶点 */}
            {guidedStep === 4 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <span>第 4 阶任务：跟踪公共顶点（三面汇聚与时针法）</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <strong>核心直觉</strong>：展开图上看似分开的 3 个直角，折叠后会汇聚成同一个<strong>空间三维顶点（公共顶点）</strong>！围绕顶点的三个面，时针旋转方向在平面与立体中保持不变！
                  </p>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-300 animate-pulse" />
                    <span className="font-bold text-amber-300">
                      ❓ 探究提问：观察金色发光球【顶点 P】所在交角！
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    折成立方体盒子后，共有哪三个面在这个金色光球顶点 P 处紧密汇聚相交？
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {[
                      { key: 'ABE', label: 'A面 (双同心圆) + B面 (红色右箭头) + E面 (紫色对角大叉)', correct: true },
                      { key: 'ACD', label: 'A面 (双同心圆) + C面 (金色五角星) + D面 (黑色实心方)', correct: false },
                      { key: 'BCF', label: 'B面 (红色右箭头) + C面 (金色五角星) + F面 (对角半黑半白)', correct: false },
                    ].map((opt) => (
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
                        <span className="text-xs">{opt.label}</span>
                        {guidedStep4Answer === opt.key && (
                          <span className="text-[11px]">{opt.correct ? '✓ 正确' : '✗ 错误'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {guidedStep4Answer && (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                      guidedStep4Answer === 'ABE'
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {guidedStep4Answer === 'ABE' ? (
                      <>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>🎉 完全正确！A、B、E 三面汇聚于顶点 P！</span>
                        </div>
                        <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                          <strong>公考时针法秒杀绝技</strong>：在 3D 盒子上以顶点 P 为中心画圆，三个面的时针顺序为【A面 ➔ B面 ➔ E面】。如果在考题选项中变成了相反时针顺序，直接秒杀排除！
                        </p>
                        <button
                          onClick={() => handleSelectGuidedStep(5)}
                          className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>进入第 5 阶：变式盲测通关挑战！</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 font-bold text-rose-400">
                          <AlertOctagon className="w-4 h-4" />
                          <span>❌ 错误提示：注意看交角处的直接邻接面！</span>
                        </div>
                        <p className="text-rose-200/90 text-[11px] leading-relaxed">
                          顶点 P 位于 A 面的角隅处，直接连接了相邻的 B 面和 E 面。C 面和 D 面离此顶点较远，无法在此顶点汇合！
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: 变式盲测 (2道无辅助变式挑战) */}
            {guidedStep === 5 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>第 5 阶任务：无辅助变式挑战 ({step5SubQuestion} / 2)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          step5SubQuestion === 1 ? 'bg-amber-400 ring-2 ring-amber-400/40' : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          step5SubQuestion === 2 ? 'bg-amber-400 ring-2 ring-amber-400/40' : 'bg-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    💡 <strong>终极考验</strong>：已撤掉所有线框辅助高亮与颜色提示。先自主预测，再折起验证，检验空间推演直觉！
                  </p>
                </div>

                {step5SubQuestion === 1 ? (
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
                                <span>进入变式挑战 2 (2-2-2 阶梯型)</span>
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
                ) : (
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
                              if (opt.correct) {
                                setGuidedCompletedSteps((prev) => Array.from(new Set([...prev, 5])));
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
                              <span>🎉 完成两道相对面变式挑战！</span>
                            </div>
                            <p className="text-emerald-200/90 text-[11px] leading-relaxed">
                              <strong>空间解析</strong>：在 2-2-2 阶梯图中，从 A 面(0) 出发向右经由 F 面(5)、向上经由 B 面(1) 拐弯到达 C 面(2)（形成跨越 4 面的经典 Z 字形阶梯两端），折起后二者严格平行相对！
                            </p>
                            <div className="bg-slate-900/80 rounded-xl p-2.5 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1.5">
                              <div className="font-semibold flex items-center justify-between">
                                <span>🎯 相对面变式检验：</span>
                                {step5Q1FirstTryCorrect && step5Q2FirstTryCorrect ? (
                                  <span className="text-amber-300 font-bold">🌟 变式全独立攻克</span>
                                ) : (
                                  <span className="text-emerald-200">💡 引导辅助完成</span>
                                )}
                              </div>
                              <div className="text-slate-300 text-[10px] space-y-0.5 border-t border-slate-800/80 pt-1.5">
                                <div className="font-medium text-slate-400 mb-1">已检验掌握能力：</div>
                                <div className="flex items-center gap-1.5">
                                  <span className={guidedCompletedSteps.includes(1) ? 'text-emerald-400' : 'text-slate-500'}>
                                    {guidedCompletedSteps.includes(1) ? '✓' : '○'} ① 基准面空间参照锚定
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-400">
                                    ✓ ② 相对面隔一格与Z字两端（含 2-3-1 与 2-2-2 变式）
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={guidedCompletedSteps.includes(3) ? 'text-emerald-400' : 'text-slate-500'}>
                                    {guidedCompletedSteps.includes(3) ? '✓' : '○'} ③ 公共边空间旋转贴合
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={guidedCompletedSteps.includes(4) ? 'text-emerald-400' : 'text-slate-500'}>
                                    {guidedCompletedSteps.includes(4) ? '✓' : '○'} ④ 公共顶点三面汇聚时针法则
                                  </span>
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
                                  setViewMode('free');
                                  setFoldProgress(0);
                                }}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>自由探索 11 种合法构型</span>
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
