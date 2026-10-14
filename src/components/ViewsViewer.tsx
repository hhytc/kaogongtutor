import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Eye,
  EyeOff,
  Box,
  Layers,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

export type ViewsDemoMode = 'projections' | 'hidden_edges' | 'bw_blocks';

interface ViewsViewerProps {
  initialMode?: ViewsDemoMode;
  initialParams?: Record<string, unknown>;
}

type Voxel = [number, number, number];
type ColorVoxel = { pos: Voxel; color: 'black' | 'white' };

/** L / 阶梯积木：用于主视·俯视·左视投影与遮挡演示 */
const STEP_VOXELS: Voxel[] = [
  [0, 0, 0], [1, 0, 0], [2, 0, 0],
  [0, 0, 1], [1, 0, 1],
  [0, 1, 0], [1, 1, 0],
  [0, 2, 0],
];

/** 黑白方块约束演示：俯视标高 + 前视颜色线索 */
const BW_VOXELS: ColorVoxel[] = [
  { pos: [0, 0, 0], color: 'white' },
  { pos: [0, 1, 0], color: 'black' },
  { pos: [0, 2, 0], color: 'white' },
  { pos: [1, 0, 0], color: 'black' },
  { pos: [1, 1, 0], color: 'white' },
  { pos: [2, 0, 0], color: 'white' },
  { pos: [2, 0, 1], color: 'black' },
  { pos: [2, 1, 1], color: 'white' },
];

const GUIDE_STEPS: Record<ViewsDemoMode, { title: string; body: string }[]> = {
  projections: [
    {
      title: '认识三视图方向',
      body: '主视＝从前向后看（+Z→−Z），俯视＝从上向下看（+Y→−Y），左视＝从左向右看（−X→+X）。拖拽可自由观察，点下方按钮可一键对齐正交投影。',
    },
    {
      title: '轮廓由“最高柱”决定',
      body: '同一投影列上，后方被前方遮挡的棱不会改变外轮廓。主视图每一列高度取该列所有积木的最大高度。',
    },
    {
      title: '三视图互相约束',
      body: '俯视给出占地平面，主视与左视给出高度轮廓；三者必须能拼出同一套柱高矩阵，否则选项必错。',
    },
  ],
  hidden_edges: [
    {
      title: '可见棱 vs 不可见棱',
      body: '实线表示当前视线方向下可见的棱；虚线表示被遮挡但仍存在的棱。公考“选非”题常在隐藏棱画错处设陷阱。',
    },
    {
      title: '切换观察方向',
      body: '切换主视/俯视/左视后，同一条棱可能从可见变为隐藏。请打开“显示隐藏棱”，对照实线与虚线。',
    },
    {
      title: '考场秒杀提示',
      body: '先核对外轮廓是否与三视图一致，再核对内部拐点是否多画或少画隐藏线——多一条虚线往往就是干扰项。',
    },
  ],
  bw_blocks: [
    {
      title: '黑白块投影约束',
      body: '前视看到的颜色是该视线列上最靠前的色块。后方的黑块若被白块挡住，前视不会出现黑色。',
    },
    {
      title: '由视图反推数量',
      body: '已知俯视占地与前视黑白格，只能给出黑块数量的上下界，不能直接把两向轮廓数字相加。',
    },
    {
      title: '联合左视收紧范围',
      body: '再加入左视颜色/高度约束后，可行摆放方案减少，黑块数量区间会被进一步收紧——这是近年国考常见考法。',
    },
  ],
};

function voxelKey(v: Voxel) {
  return `${v[0]},${v[1]},${v[2]}`;
}

function buildVoxelMeshes(
  voxels: Voxel[],
  color = 0x38bdf8,
  opacity = 0.92
): THREE.Group {
  const group = new THREE.Group();
  const geom = new THREE.BoxGeometry(0.92, 0.92, 0.92);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.08,
    transparent: opacity < 1,
    opacity,
  });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.55 });
  voxels.forEach(([x, y, z]) => {
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geom), edgeMat);
    edges.position.copy(mesh.position);
    group.add(edges);
  });
  return group;
}

function computeFrontHeights(voxels: Voxel[]): number[] {
  const cols = new Map<number, number>();
  voxels.forEach(([x, y]) => {
    cols.set(x, Math.max(cols.get(x) ?? 0, y + 1));
  });
  const xs = [...cols.keys()].sort((a, b) => a - b);
  return xs.map((x) => cols.get(x) ?? 0);
}

function computeTopFootprint(voxels: Voxel[]): Set<string> {
  return new Set(voxels.map(([x, , z]) => `${x},${z}`));
}

function computeLeftHeights(voxels: Voxel[]): number[] {
  const cols = new Map<number, number>();
  voxels.forEach(([, y, z]) => {
    cols.set(z, Math.max(cols.get(z) ?? 0, y + 1));
  });
  const zs = [...cols.keys()].sort((a, b) => a - b);
  return zs.map((z) => cols.get(z) ?? 0);
}

function frontVisibleColors(voxels: ColorVoxel[]): ('black' | 'white' | null)[] {
  const byX = new Map<number, ColorVoxel[]>();
  voxels.forEach((v) => {
    const list = byX.get(v.pos[0]) ?? [];
    list.push(v);
    byX.set(v.pos[0], list);
  });
  const xs = [...byX.keys()].sort((a, b) => a - b);
  return xs.map((x) => {
    const list = byX.get(x)!;
    // Front view looks from +Z toward -Z: largest z is frontmost
    list.sort((a, b) => b.pos[2] - a.pos[2] || b.pos[1] - a.pos[1]);
    // For each height row, take frontmost
    return list[0]?.color ?? null;
  });
}

export const ViewsViewer: React.FC<ViewsViewerProps> = ({
  initialMode = 'projections',
  initialParams,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [mode, setMode] = useState<ViewsDemoMode>(
    (initialParams?.mode as ViewsDemoMode) || initialMode
  );
  const [guideIndex, setGuideIndex] = useState(0);
  const [viewSnap, setViewSnap] = useState<'free' | 'front' | 'top' | 'left'>('free');
  const [showHiddenEdges, setShowHiddenEdges] = useState(true);
  const [highlightOccluded, setHighlightOccluded] = useState(true);

  useEffect(() => {
    setGuideIndex(0);
    setViewSnap('free');
  }, [mode]);

  const guide = GUIDE_STEPS[mode][guideIndex] ?? GUIDE_STEPS[mode][0];

  const projectionStats = useMemo(() => {
    const front = computeFrontHeights(STEP_VOXELS);
    const left = computeLeftHeights(STEP_VOXELS);
    const top = computeTopFootprint(STEP_VOXELS);
    return { front, left, topCount: top.size, total: STEP_VOXELS.length };
  }, []);

  const bwStats = useMemo(() => {
    const black = BW_VOXELS.filter((v) => v.color === 'black').length;
    const white = BW_VOXELS.filter((v) => v.color === 'white').length;
    const frontColors = frontVisibleColors(BW_VOXELS);
    const visibleBlack = frontColors.filter((c) => c === 'black').length;
    return { black, white, frontColors, visibleBlack, total: BW_VOXELS.length };
  }, []);

  const snapCamera = useCallback((snap: 'front' | 'top' | 'left' | 'free') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    setViewSnap(snap);
    const target = new THREE.Vector3(1, 0.8, 0.4);
    controls.target.copy(target);
    if (snap === 'front') camera.position.set(1, 1.2, 8);
    else if (snap === 'top') camera.position.set(1, 9, 0.4);
    else if (snap === 'left') camera.position.set(-8, 1.2, 0.4);
    else camera.position.set(6.5, 5.2, 7.5);
    camera.lookAt(target);
    controls.update();
  }, []);

  // Three.js bootstrap
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(6.5, 5.2, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 3;
    controls.maxDistance = 24;
    controls.target.set(1, 0.8, 0.4);
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dir1.position.set(8, 12, 6);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0x38bdf8, 0.35);
    dir2.position.set(-6, 4, -8);
    scene.add(dir2);

    const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
    grid.position.y = -0.5;
    scene.add(grid);

    const axes = new THREE.AxesHelper(2.2);
    axes.position.set(-0.5, -0.45, -0.5);
    scene.add(axes);

    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let mounted = true;
    const animate = () => {
      if (!mounted) return;
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
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Rebuild scene content when mode / toggles change
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    }

    const labelSprite = (text: string, color: string, position: THREE.Vector3) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 256, 64);
      ctx.fillStyle = 'rgba(15,23,42,0.85)';
      ctx.beginPath();
      const r = 12;
      ctx.moveTo(8 + r, 8);
      ctx.arcTo(248, 8, 248, 56, r);
      ctx.arcTo(248, 56, 8, 56, r);
      ctx.arcTo(8, 56, 8, 8, r);
      ctx.arcTo(8, 8, 248, 8, r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.8, 0.45, 1);
      sprite.position.copy(position);
      return sprite;
    };

    if (mode === 'projections' || mode === 'hidden_edges') {
      const solid = buildVoxelMeshes(STEP_VOXELS, 0x0ea5e9, 0.9);
      group.add(solid);

      // Occluded voxels (behind taller front columns) highlighted
      if (highlightOccluded && mode === 'projections') {
        const frontMaxZ = new Map<string, number>();
        STEP_VOXELS.forEach(([x, y, z]) => {
          const k = `${x},${y}`;
          frontMaxZ.set(k, Math.max(frontMaxZ.get(k) ?? -Infinity, z));
        });
        STEP_VOXELS.forEach(([x, y, z]) => {
          const k = `${x},${y}`;
          if (z < (frontMaxZ.get(k) ?? z)) {
            const marker = new THREE.Mesh(
              new THREE.BoxGeometry(0.96, 0.96, 0.96),
              new THREE.MeshBasicMaterial({
                color: 0xf59e0b,
                transparent: true,
                opacity: 0.22,
                wireframe: false,
              })
            );
            marker.position.set(x, y, z);
            group.add(marker);
          }
        });
      }

      // Hidden edge overlays: draw dashed-looking segments for edges facing away from +Z (front)
      if (mode === 'hidden_edges' && showHiddenEdges) {
        const occupied = new Set(STEP_VOXELS.map(voxelKey));
        const dashMat = new THREE.LineDashedMaterial({
          color: 0xf472b6,
          dashSize: 0.12,
          gapSize: 0.08,
          transparent: true,
          opacity: 0.95,
        });
        const solidEdgeMat = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85 });

        const dirs: Voxel[] = [
          [1, 0, 0], [-1, 0, 0],
          [0, 1, 0], [0, -1, 0],
          [0, 0, 1], [0, 0, -1],
        ];

        STEP_VOXELS.forEach(([x, y, z]) => {
          dirs.forEach(([dx, dy, dz]) => {
            const nx = x + dx;
            const ny = y + dy;
            const nz = z + dz;
            // Only draw outward faces (boundary edges of the polycube)
            if (occupied.has(voxelKey([nx, ny, nz]))) return;

            // Face center and a square ring approximation via opposite corners of the face
            const half = 0.46;
            const cx = x + dx * 0.46;
            const cy = y + dy * 0.46;
            const cz = z + dz * 0.46;
            let corners: THREE.Vector3[] = [];
            if (dx !== 0) {
              corners = [
                new THREE.Vector3(cx, y - half, z - half),
                new THREE.Vector3(cx, y + half, z - half),
                new THREE.Vector3(cx, y + half, z + half),
                new THREE.Vector3(cx, y - half, z + half),
                new THREE.Vector3(cx, y - half, z - half),
              ];
            } else if (dy !== 0) {
              corners = [
                new THREE.Vector3(x - half, cy, z - half),
                new THREE.Vector3(x + half, cy, z - half),
                new THREE.Vector3(x + half, cy, z + half),
                new THREE.Vector3(x - half, cy, z + half),
                new THREE.Vector3(x - half, cy, z - half),
              ];
            } else {
              corners = [
                new THREE.Vector3(x - half, y - half, cz),
                new THREE.Vector3(x + half, y - half, cz),
                new THREE.Vector3(x + half, y + half, cz),
                new THREE.Vector3(x - half, y + half, cz),
                new THREE.Vector3(x - half, y - half, cz),
              ];
            }

            // Face normal approx (dx,dy,dz); hidden from front (+Z) if normal · front < 0 or face is behind solids
            const facingFront = dz > 0 || (dz === 0 && (dy > 0 || dx > 0));
            const geom = new THREE.BufferGeometry().setFromPoints(corners);
            if (facingFront) {
              group.add(new THREE.Line(geom, solidEdgeMat));
            } else {
              const line = new THREE.Line(geom, dashMat);
              line.computeLineDistances();
              group.add(line);
            }
          });
        });
      }

      group.add(labelSprite('主视 ←', '#38bdf8', new THREE.Vector3(1, 3.2, 3.2)));
      group.add(labelSprite('俯视 ↓', '#a78bfa', new THREE.Vector3(1, 4.2, 0.4)));
      group.add(labelSprite('左视 →', '#34d399', new THREE.Vector3(-2.4, 2.4, 0.4)));
    } else {
      // bw_blocks
      BW_VOXELS.forEach(({ pos: [x, y, z], color }) => {
        const geom = new THREE.BoxGeometry(0.9, 0.9, 0.9);
        const mat = new THREE.MeshStandardMaterial({
          color: color === 'black' ? 0x111827 : 0xf8fafc,
          roughness: 0.4,
          metalness: 0.05,
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x, y, z);
        group.add(mesh);
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(geom),
          new THREE.LineBasicMaterial({ color: color === 'black' ? 0x94a3b8 : 0x334155 })
        );
        edge.position.copy(mesh.position);
        group.add(edge);
      });
      group.add(labelSprite('前视颜色=最前色块', '#fbbf24', new THREE.Vector3(1, 3.6, 2.8)));
    }
  }, [mode, showHiddenEdges, highlightOccluded]);

  const modes: { key: ViewsDemoMode; label: string; icon: React.ReactNode }[] = [
    { key: 'projections', label: '三视图投影', icon: <Box className="w-3.5 h-3.5" /> },
    { key: 'hidden_edges', label: '可见/隐藏棱', icon: <Eye className="w-3.5 h-3.5" /> },
    { key: 'bw_blocks', label: '黑白块反推', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      <div className="relative w-full h-[48vh] min-h-[320px] sm:min-h-[360px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        <div className="absolute top-2 left-2 right-2 flex overflow-x-auto no-scrollbar gap-1.5 z-10">
          {modes.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap inline-flex items-center gap-1 ${
                mode === item.key
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-2 left-2 right-2 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>正交观察对齐</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {([
                ['free', '自由'],
                ['front', '主视'],
                ['top', '俯视'],
                ['left', '左视'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => snapCamera(key)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors ${
                    viewSnap === key
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {mode === 'hidden_edges' && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setShowHiddenEdges((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium border inline-flex items-center gap-1 ${
                  showHiddenEdges
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {showHiddenEdges ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showHiddenEdges ? '隐藏棱：开' : '隐藏棱：关'}
              </button>
            </div>
          )}
          {mode === 'projections' && (
            <button
              type="button"
              onClick={() => setHighlightOccluded((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                highlightOccluded
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {highlightOccluded ? '遮挡高亮：开' : '遮挡高亮：关'}
            </button>
          )}
        </div>

        <div className="absolute top-11 right-2 hidden xl:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg pointer-events-none">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>单指旋转 · 双指缩放 · 可对齐主/俯/左视</span>
        </div>
      </div>

      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📐 三视图与可见棱线演练台
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            通用演示模型，用于掌握投影、遮挡与黑白约束；并非某一道国考题的精确还原。
          </p>
        </div>

        {/* Guided steps */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                导学步骤 {guideIndex + 1}/{GUIDE_STEPS[mode].length}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={guideIndex === 0}
                onClick={() => setGuideIndex((i) => Math.max(0, i - 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={guideIndex >= GUIDE_STEPS[mode].length - 1}
                onClick={() => setGuideIndex((i) => Math.min(GUIDE_STEPS[mode].length - 1, i + 1))}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-white mb-1">{guide.title}</div>
            <p className="text-xs text-slate-300 leading-relaxed">{guide.body}</p>
          </div>
          <div className="flex gap-1">
            {GUIDE_STEPS[mode].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGuideIndex(i)}
                className={`h-1.5 flex-1 rounded-full ${i === guideIndex ? 'bg-cyan-400' : 'bg-slate-700'}`}
                aria-label={`步骤 ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {mode !== 'bw_blocks' && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>当前阶梯积木投影数据</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div className="bg-slate-950/50 p-2 rounded-lg">
                主视高度列
                <div className="font-mono text-cyan-300 mt-0.5">{projectionStats.front.join(' · ')}</div>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg">
                左视高度列
                <div className="font-mono text-emerald-300 mt-0.5">{projectionStats.left.join(' · ')}</div>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg">
                俯视占地格
                <div className="font-mono text-violet-300 mt-0.5">{projectionStats.topCount}</div>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg">
                小立方体总数
                <div className="font-mono text-amber-300 mt-0.5">{projectionStats.total}</div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              注意：总数 ≠ 主视高度之和，也不等于左视高度之和。被遮挡的后方块仍计入总数。
            </p>
          </div>
        )}

        {mode === 'bw_blocks' && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>黑白约束实时读数</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div className="bg-slate-950/50 p-2 rounded-lg">
                黑块实际数量
                <div className="font-mono text-white mt-0.5">{bwStats.black}</div>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg">
                白块实际数量
                <div className="font-mono text-slate-200 mt-0.5">{bwStats.white}</div>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg col-span-2">
                前视可见色（由左到右最前色）
                <div className="font-mono text-amber-300 mt-0.5">
                  {bwStats.frontColors.map((c) => (c === 'black' ? '黑' : c === 'white' ? '白' : '空')).join(' · ')}
                </div>
              </div>
              <div className="bg-slate-950/50 p-2 rounded-lg col-span-2">
                前视可见黑格数（≤ 实际黑块）
                <div className="font-mono text-rose-300 mt-0.5">
                  {bwStats.visibleBlack} ≤ {bwStats.black}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-cyan-950/30 to-slate-900 p-4 rounded-xl border border-cyan-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
            <span>公考秒杀要点</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc pl-4">
            <li>主视、俯视、左视必须对应同一柱高矩阵；缺一边或对不上即可排除。</li>
            <li>可见棱用实线、不可见棱用虚线；“选非”题优先找多画/少画的隐藏线。</li>
            <li>黑白方块：前视颜色只反映最前一层；用颜色+高度只能定黑块上下界。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ViewsViewer;
