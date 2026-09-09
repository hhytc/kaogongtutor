import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, CheckCircle2, AlertTriangle, Eye, Sparkles, Layers, Box } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AssemblyViewerProps {
  initialMode?: string;
  initialParams?: Record<string, any>;
}

// 3D Voxel coordinate (x, y, z) in [0..2]
type Voxel = [number, number, number];

// Fixed 20-cube base shape (leaving a 7-cube cavity in a 3x3x3 cube)
// The 7 missing coordinates in the 3x3x3 grid:
const CAVITY_VOXELS: Voxel[] = [
  // Corner 2x2x2 missing 7 cubes (except one corner cube)
  [2, 0, 0], [2, 0, 1], [1, 0, 0],
  [2, 1, 0], [2, 1, 1], [1, 1, 0],
  [2, 2, 0],
];

// Preset options
interface CandidateOption {
  key: string;
  name: string;
  count: number;
  voxels: Voxel[]; // Relative local voxels
  isCorrect: boolean;
  correctRotations: { rx: number; ry: number; rz: number }[]; // In multiples of 90 deg
  explanation: string;
}

const CANDIDATE_OPTIONS: CandidateOption[] = [
  {
    key: 'B',
    name: '选项 B (7个小立方体 · L型拐角带凸起)',
    count: 7,
    // 7 voxels exactly matching CAVITY_VOXELS in target orientation!
    voxels: [
      [2, 0, 0], [2, 0, 1], [1, 0, 0],
      [2, 1, 0], [2, 1, 1], [1, 1, 0],
      [2, 2, 0],
    ],
    isCorrect: true,
    correctRotations: [{ rx: 0, ry: 0, rz: 0 }],
    explanation: '数量为 27 - 20 = 7 块，拐角与凸起能够与缺口 100% 紧密咬合，完美形成 3×3×3 大正方体！',
  },
  {
    key: 'A',
    name: '选项 A (8个小立方体 · 2×2×2 角落实心)',
    count: 8,
    voxels: [
      [2, 0, 0], [2, 0, 1], [1, 0, 0], [1, 0, 1],
      [2, 1, 0], [2, 1, 1], [1, 1, 0], [1, 1, 1],
    ],
    isCorrect: false,
    correctRotations: [],
    explanation: '通过数量守恒直接排除！目标空缺需 7 块，该选项含 8 块，拼合后超出大正方体并与基准积木冲突！',
  },
  {
    key: 'C',
    name: '选项 C (6个小立方体 · 双层两拐角)',
    count: 6,
    voxels: [
      [2, 0, 0], [2, 0, 1], [1, 0, 0],
      [2, 1, 0], [2, 1, 1], [1, 1, 0],
    ],
    isCorrect: false,
    correctRotations: [],
    explanation: '通过数量守恒直接排除！目标空缺需 7 块，该选项仅含 6 块，拼合后顶层仍有 1 块空缺！',
  },
  {
    key: 'D',
    name: '选项 D (7个小立方体 · 扁平错位干扰)',
    count: 7,
    voxels: [
      [2, 0, 0], [2, 0, 1], [2, 0, 2],
      [2, 1, 0], [2, 1, 1], [2, 1, 2],
      [2, 2, 0],
    ],
    isCorrect: false,
    correctRotations: [],
    explanation: '虽然恰好有 7 块小立方体，但其为 3×2 平板带顶端单凸起结构，在空间所有 24 种朝向下均无法贴合，最多只能吻合 5 块，必然与基准积木发生物理碰撞！',
  },
];

export const AssemblyViewer: React.FC<AssemblyViewerProps> = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  const [selectedOptionKey, setSelectedOptionKey] = useState<string>('B');
  const [rotX, setRotX] = useState<number>(0); // 0, 90, 180, 270
  const [rotY, setRotY] = useState<number>(0);
  const [rotZ, setRotZ] = useState<number>(0);

  // Assemble progress: 0 (detached outside) to 1 (slotted in)
  const [assembleProgress, setAssembleProgress] = useState<number>(0);
  const [showCavityGuide, setShowCavityGuide] = useState<boolean>(true);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const currentOption = useMemo(() => {
    return CANDIDATE_OPTIONS.find((o) => o.key === selectedOptionKey) || CANDIDATE_OPTIONS[0];
  }, [selectedOptionKey]);

  // Real 3D physical occupancy & collision calculation
  const occupancyStats = useMemo(() => {
    const rxRad = (rotX * Math.PI) / 180;
    const ryRad = (rotY * Math.PI) / 180;
    const rzRad = (rotZ * Math.PI) / 180;
    const euler = new THREE.Euler(rxRad, ryRad, rzRad, 'XYZ');

    const cavitySet = new Set(CAVITY_VOXELS.map(([x, y, z]) => `${x},${y},${z}`));
    let matchedInCavity = 0;
    let collidedWithBase = 0;
    let outOfBounds = 0;

    currentOption.voxels.forEach(([vx, vy, vz]) => {
      // Local position before rotation around center (1, 1, 1)
      const p = new THREE.Vector3(vx - 1, vy - 1, vz - 1).applyEuler(euler);
      const gx = Math.round(p.x + 1);
      const gy = Math.round(p.y + 1);
      const gz = Math.round(p.z + 1);

      if (
        Math.abs(p.x + 1 - gx) > 0.05 ||
        Math.abs(p.y + 1 - gy) > 0.05 ||
        Math.abs(p.z + 1 - gz) > 0.05
      ) {
        outOfBounds++;
        return;
      }

      if (gx < 0 || gx > 2 || gy < 0 || gy > 2 || gz < 0 || gz > 2) {
        outOfBounds++;
      } else {
        const key = `${gx},${gy},${gz}`;
        if (cavitySet.has(key)) {
          matchedInCavity++;
        } else {
          collidedWithBase++;
        }
      }
    });

    const isPerfect =
      matchedInCavity === CAVITY_VOXELS.length &&
      collidedWithBase === 0 &&
      outOfBounds === 0;

    return {
      matchedInCavity,
      collidedWithBase,
      outOfBounds,
      isPerfect,
    };
  }, [currentOption, rotX, rotY, rotZ]);

  const isPerfectMatch = occupancyStats.isPerfect;

  // Trigger celebration when assembled correctly
  useEffect(() => {
    if (isPerfectMatch && assembleProgress >= 0.95) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [isPerfectMatch, assembleProgress]);

  // Setup Three.js
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(9, 10, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 15, 10);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 0.4);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    grid.position.y = -2;
    scene.add(grid);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

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
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Build 3D Voxel Meshes
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    const cubeSize = 0.96; // slight gap between voxels
    const step = 1.0;
    const originOffset = -1.0; // Center the 3x3x3 grid around (0, 0, 0)

    // Helper: Single voxel mesh
    const voxelGeom = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const edgesGeom = new THREE.EdgesGeometry(voxelGeom);

    // 1. Build Base Component (20 cubes)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.65,
      roughness: 0.3,
      metalness: 0.1,
    });
    const baseWireMat = new THREE.LineBasicMaterial({ color: 0x1d4ed8, linewidth: 2 });

    // Identify which of the 27 positions are NOT in CAVITY_VOXELS
    const isCavity = (x: number, y: number, z: number) => {
      return CAVITY_VOXELS.some(([cx, cy, cz]) => cx === x && cy === y && cz === z);
    };

    for (let x = 0; x < 3; x++) {
      for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
          if (!isCavity(x, y, z)) {
            const m = new THREE.Mesh(voxelGeom, baseMat);
            m.position.set(
              (x + originOffset) * step,
              (y + originOffset) * step,
              (z + originOffset) * step
            );
            m.add(new THREE.LineSegments(edgesGeom, baseWireMat));
            group.add(m);
          }
        }
      }
    }

    // 2. Build Cavity Slot Guide (Ghost wireframe)
    if (showCavityGuide) {
      const cavityWireMat = new THREE.LineBasicMaterial({
        color: 0x10b981, // Emerald green
        transparent: true,
        opacity: 0.45,
      });
      CAVITY_VOXELS.forEach(([cx, cy, cz]) => {
        const wire = new THREE.LineSegments(edgesGeom, cavityWireMat);
        wire.position.set(
          (cx + originOffset) * step,
          (cy + originOffset) * step,
          (cz + originOffset) * step
        );
        group.add(wire);
      });
    }

    // 3. Build Moving Candidate Piece
    const candidatePivot = new THREE.Group();

    // Detached starting offset: moves along X and Z
    const detachedX = 4.5 * (1 - assembleProgress);
    const detachedZ = 3.5 * (1 - assembleProgress);
    const detachedY = 1.0 * (1 - assembleProgress);

    candidatePivot.position.set(detachedX, detachedY, detachedZ);

    // Apply 3D Rotation
    const rxRad = (rotX * Math.PI) / 180;
    const ryRad = (rotY * Math.PI) / 180;
    const rzRad = (rotZ * Math.PI) / 180;
    candidatePivot.rotation.set(rxRad, ryRad, rzRad);

    // Color: Green if matches perfectly at 100%, otherwise Amber/Orange
    let pieceColor = 0xf59e0b; // Amber
    if (isPerfectMatch && assembleProgress > 0.8) {
      pieceColor = 0x10b981; // Vibrant Emerald
    }

    const candidateMat = new THREE.MeshStandardMaterial({
      color: pieceColor,
      roughness: 0.25,
      metalness: 0.1,
    });
    const candidateWireMat = new THREE.LineBasicMaterial({ color: 0x78350f, linewidth: 2 });

    currentOption.voxels.forEach(([vx, vy, vz]) => {
      const cm = new THREE.Mesh(voxelGeom, candidateMat);
      // Place voxel relative to candidate origin
      cm.position.set(
        (vx + originOffset) * step,
        (vy + originOffset) * step,
        (vz + originOffset) * step
      );
      cm.add(new THREE.LineSegments(edgesGeom, candidateWireMat));
      candidatePivot.add(cm);
    });

    group.add(candidatePivot);
  }, [selectedOptionKey, rotX, rotY, rotZ, assembleProgress, showCavityGuide, isPerfectMatch, currentOption]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* 3D Canvas */}
      <div className="relative w-full h-[40vh] min-h-[250px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Floating Top Info */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/90 text-white border border-slate-700 backdrop-blur-md flex items-center gap-1">
            <Layers className="w-3 h-3 text-sky-400" />
            <span>基准 20 块 + 绿色缺口 7 块</span>
          </span>
          <button
            onClick={() => setShowCavityGuide(!showCavityGuide)}
            className={`px-2 py-1 rounded-lg text-[10px] font-medium border backdrop-blur-md transition-colors ${
              showCavityGuide
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            {showCavityGuide ? '隐藏虚线' : '显示虚线'}
          </button>
        </div>

        {/* Floating Bottom Push-in Slider & Rotations */}
        <div className="absolute bottom-2 left-2 right-2 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10">
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1">
              <Box className="w-3 h-3 text-amber-400" />
              <span>拼合推入进度</span>
            </span>
            <span className="font-mono text-amber-400 font-bold text-xs">
              {(assembleProgress * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAssembleProgress(assembleProgress > 0.5 ? 0 : 1)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-md transition-colors flex-shrink-0 ${
                assembleProgress > 0.5
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {assembleProgress > 0.5 ? '分离' : '拼入'}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={assembleProgress}
              onChange={(e) => setAssembleProgress(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Quick Rotation Buttons */}
          <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-800/80 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <RotateCw className="w-3 h-3 text-slate-400" />
              90° 旋转测试:
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setRotX((r) => r + 90)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-[10px]"
              >
                X轴
              </button>
              <button
                onClick={() => setRotY((r) => r + 90)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-[10px]"
              >
                Y轴
              </button>
              <button
                onClick={() => setRotZ((r) => r + 90)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-[10px]"
              >
                Z轴
              </button>
              <button
                onClick={() => { setRotX(0); setRotY(0); setRotZ(0); }}
                className="px-1.5 py-0.5 rounded bg-slate-800/60 hover:bg-slate-700 text-slate-400 text-[10px]"
              >
                复位
              </button>
            </div>
          </div>
        </div>

        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>旋转积木与绿色虚线凹槽对齐</span>
        </div>
      </div>

      {/* Right Control & Theory Panel */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🧩 空间立体拼合与积木旋转
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            判断哪个选项能够与已知图形组合拼成 3×3×3 的完整大正方体（共 27 块小立方体）。
          </p>
        </div>

        {/* Options Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">测试备选组件：</span>
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
            >
              {showAnalysis ? '收起解析' : '查看解题解析'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {CANDIDATE_OPTIONS.map((opt) => {
              const isSelected = opt.key === selectedOptionKey;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    setSelectedOptionKey(opt.key);
                    setAssembleProgress(0);
                    setRotX(0);
                    setRotY(0);
                    setRotZ(0);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="w-full">
                    <div className="font-bold text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-mono text-slate-200">
                          {opt.key}
                        </span>
                        <span>{opt.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {opt.count} 块
                      </span>
                    </div>
                    {showAnalysis && (
                      <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 leading-relaxed">
                        {opt.explanation}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Match Feedback Banner */}
        <div
          className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
            isPerfectMatch && assembleProgress >= 0.95
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : occupancyStats.collidedWithBase > 0 && assembleProgress > 0.4
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          {isPerfectMatch && assembleProgress >= 0.95 ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="font-bold text-xs">🎉 严丝合缝！完美拼成 3×3×3 大正方体！</div>
                <div className="text-[11px] text-emerald-300/80 mt-0.5">
                  凹凸完全咬合，数量 20 + 7 = 27 块无缝填满。
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-amber-400" />
                  空间占位与咬合检测
                </span>
                <span className="font-mono text-[11px]">
                  缺口咬合: <strong className={occupancyStats.matchedInCavity === 7 ? 'text-emerald-400' : 'text-amber-400'}>{occupancyStats.matchedInCavity} / 7 块</strong>
                </span>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <div>
                  碰撞基准块: <strong className={occupancyStats.collidedWithBase > 0 ? 'text-rose-400' : 'text-slate-400'}>{occupancyStats.collidedWithBase} 块</strong>
                </div>
                <div>
                  超出大立方体: <strong className={occupancyStats.outOfBounds > 0 ? 'text-rose-400' : 'text-slate-400'}>{occupancyStats.outOfBounds} 块</strong>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed flex items-center gap-1.5">
                {occupancyStats.collidedWithBase > 0 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    <span className="text-rose-300">当前姿态与已有积木发生空间重叠冲突，无法完全拼入。</span>
                  </>
                ) : occupancyStats.matchedInCavity === 7 ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-300">姿态已与缺口完全吻合！拖动上方滑块推入即可严密拼合。</span>
                  </>
                ) : (
                  <span>提示：可点击 X/Y/Z 轴旋转积木，观察其凹凸形态是否能填补绿色虚线缺口。</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Public Exam Trick Breakdown */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <Sparkles className="w-4 h-4" />
            <span>公考立体拼合三步秒杀法</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-400">Step 1 数数守恒：</span>
              <span>
                3×3×3 完整正方体共有 <strong>27 块</strong>。已知组件占 20 块，缺失块数必为{' '}
                <strong className="text-amber-300 font-mono">27 - 20 = 7 块</strong>。选项 A (8块) 和 C (6块) 无需看图，直接口算排除！
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-400">Step 2 凹凸互补：</span>
              <span>
                空缺位置有一个 3 层直角拐角，拼合块必须具备能够填补该直角的立体凸起。
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-bold text-amber-400">Step 3 定轴旋转：</span>
              <span>
                锁定拼合组件中最长的一排或基准底层，在脑中先绕垂直轴旋转定位，避免多轴同时想象产生空间迷失。
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
