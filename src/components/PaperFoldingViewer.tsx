import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Scissors,
  RotateCcw,
} from 'lucide-react';

export type PaperFoldMode = 'half_fold' | 'double_fold' | 'overlap_map';

interface PaperFoldingViewerProps {
  initialMode?: PaperFoldMode;
  initialParams?: Record<string, unknown>;
}

const GUIDE_STEPS: Record<PaperFoldMode, { title: string; body: string }[]> = {
  half_fold: [
    {
      title: '沿折痕翻折',
      body: '矩形纸沿中缝向上翻折。折痕两侧的点一一对应；折叠进度 0% 为平铺，100% 为完全重合。',
    },
    {
      title: '纸面积 vs 占地面积',
      body: '纸张自身面积不变；俯视投影（占地）在对折后减半。考场问的“投影面积/占地”通常指折后脚印，不是纸面面积。',
    },
    {
      title: '层序与覆盖',
      body: '翻折后上层覆盖下层，重合区域层数变为 2。任意点的覆盖次数等于落在该投影位置上的纸层数。',
    },
  ],
  double_fold: [
    {
      title: '两次对折',
      body: '先左右对折，再上下对折。每次对折都使占地减半、层数翻倍（理想无错位时）。',
    },
    {
      title: '顺序改变层序',
      body: '先横折再竖折，与先竖折再横折，最终占地相同，但各象限的层序（谁在上）可能不同——这是层序题的考点。',
    },
    {
      title: '面积关系',
      body: '设原纸面积 S，理想两次对折后占地约为 S/4，层数 4。若折痕未对齐，占地会大于 S/4，出现部分单层区。',
    },
  ],
  overlap_map: [
    {
      title: '观察重叠区',
      body: '半折过程中，翻起的那一半在地面上的投影逐渐与固定半侧重叠。重叠面积从 0 增至 S/2。',
    },
    {
      title: '对应点与折痕',
      body: '折痕是对应点的中垂线。标记点 A 翻折后落到 A′，AA′ 的中点必在折痕上，且 AA′ ⊥ 折痕。',
    },
    {
      title: '秒杀口诀',
      body: '问占地看投影并集；问重叠看投影交集；问层数看同一投影格被覆盖几次。',
    },
  ],
};

export const PaperFoldingViewer: React.FC<PaperFoldingViewerProps> = ({
  initialMode = 'half_fold',
  initialParams,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const hingeRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [mode, setMode] = useState<PaperFoldMode>(
    (initialParams?.mode as PaperFoldMode) || initialMode
  );
  const [foldProgress, setFoldProgress] = useState(0); // 0..100 first fold
  const [secondFold, setSecondFold] = useState(0); // 0..100 second fold
  const [guideIndex, setGuideIndex] = useState(0);
  const [showCreaseMarkers, setShowCreaseMarkers] = useState(true);
  const [showFootprint, setShowFootprint] = useState(true);
  const [foldOrder, setFoldOrder] = useState<'horizontal-first' | 'vertical-first'>('horizontal-first');

  useEffect(() => {
    setGuideIndex(0);
    setFoldProgress(0);
    setSecondFold(0);
  }, [mode]);

  const guide = GUIDE_STEPS[mode][guideIndex] ?? GUIDE_STEPS[mode][0];

  const paperW = 4;
  const paperH = 2.4;
  const paperArea = paperW * paperH;

  const metrics = useMemo(() => {
    const t1 = foldProgress / 100;
    const t2 = secondFold / 100;

    if (mode === 'half_fold' || mode === 'overlap_map') {
      // Ideal half fold about vertical midline: footprint = W/2 * H + (1-t)* (W/2)*H union shrinks
      // Moving half projects with width (W/2)*cos(angle) approximately for footprint width of moving part
      const angle = t1 * Math.PI; // 0 flat -> pi folded over
      const movingProjWidth = (paperW / 2) * Math.max(Math.cos(angle), 0);
      // Footprint = fixed half + non-overlapping part of moving projection
      // When angle in [0, pi/2], moving still on its side; after pi/2 it overlaps fixed side
      let footprint: number;
      let overlap: number;
      let layersMax: number;
      if (angle <= Math.PI / 2) {
        footprint = (paperW / 2 + movingProjWidth) * paperH;
        overlap = 0;
        layersMax = 1;
      } else {
        const over = (paperW / 2) * Math.max(-Math.cos(angle), 0);
        footprint = (paperW / 2) * paperH;
        overlap = over * paperH;
        layersMax = over > 0.001 ? 2 : 1;
      }
      return {
        paperArea,
        footprint: Number(footprint.toFixed(2)),
        overlap: Number(overlap.toFixed(2)),
        layersMax,
        ratio: Number((footprint / paperArea).toFixed(3)),
      };
    }

    // double fold ideal
    const afterFirstFoot = paperArea * (0.5 + 0.5 * Math.max(Math.cos(t1 * Math.PI), 0));
    // simplify: when first complete, footprint = S/2; second similarly -> S/4
    let footprint = paperArea;
    let layersMax = 1;
    if (t1 < 1) {
      const angle = t1 * Math.PI;
      if (angle <= Math.PI / 2) footprint = (paperW / 2 + (paperW / 2) * Math.cos(angle)) * paperH;
      else footprint = (paperW / 2) * paperH;
      layersMax = angle > Math.PI / 2 ? 2 : 1;
    } else {
      const angle2 = t2 * Math.PI;
      const baseW = paperW / 2;
      const baseH = paperH;
      if (angle2 <= Math.PI / 2) {
        footprint = baseW * (baseH / 2 + (baseH / 2) * Math.cos(angle2));
        layersMax = 2;
      } else {
        footprint = baseW * (baseH / 2);
        layersMax = 4;
      }
    }
    const overlap = Math.max(0, paperArea - footprint);
    return {
      paperArea,
      footprint: Number(footprint.toFixed(2)),
      overlap: Number(Math.min(overlap, paperArea).toFixed(2)),
      layersMax,
      ratio: Number((footprint / paperArea).toFixed(3)),
      afterFirstFoot: Number(afterFirstFoot.toFixed(2)),
    };
  }, [mode, foldProgress, secondFold, paperArea, paperW, paperH]);

  // Bootstrap Three.js
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 6.5, 7.5);
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
    controls.minDistance = 3;
    controls.maxDistance = 28;
    controls.target.set(0, 0.2, 0);
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
    d1.position.set(6, 10, 8);
    scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xf472b6, 0.35);
    d2.position.set(-5, 4, -6);
    scene.add(d2);

    const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
    grid.position.y = -0.02;
    scene.add(grid);

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

  // Build / update folding paper
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

    const halfW = paperW / 2;
    const halfH = paperH / 2;
    const thickness = 0.02;

    const fixedMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.55,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const movingMat = new THREE.MeshStandardMaterial({
      color: 0xf9a8d4,
      roughness: 0.5,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const moving2Mat = new THREE.MeshStandardMaterial({
      color: 0xa5b4fc,
      roughness: 0.5,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    // Crease line (vertical midline for first fold)
    if (showCreaseMarkers) {
      const creaseGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.03, -halfH),
        new THREE.Vector3(0, 0.03, halfH),
      ]);
      const crease = new THREE.Line(
        creaseGeom,
        new THREE.LineDashedMaterial({ color: 0xf43f5e, dashSize: 0.12, gapSize: 0.08 })
      );
      crease.computeLineDistances();
      group.add(crease);
    }

    // Fixed half (x <= 0)
    const fixedGeom = new THREE.PlaneGeometry(halfW, paperH);
    const fixed = new THREE.Mesh(fixedGeom, fixedMat);
    fixed.rotation.x = -Math.PI / 2;
    fixed.position.set(-halfW / 2, thickness, 0);
    group.add(fixed);

    // First hinge at x=0, rotating moving half around +Z axis (folding over +Y)
    const hinge = new THREE.Group();
    hinge.position.set(0, thickness, 0);
    group.add(hinge);
    hingeRef.current = hinge;

    const movingGeom = new THREE.PlaneGeometry(halfW, paperH);
    const moving = new THREE.Mesh(movingGeom, movingMat);
    moving.rotation.x = -Math.PI / 2;
    // PlaneGeometry is centered; place so left edge sits on hinge (x=0)
    moving.position.set(halfW / 2, 0, 0);
    hinge.add(moving);

    // Marker points A on moving half and its image hint
    if (showCreaseMarkers) {
      const aLocal = new THREE.Vector3(halfW * 0.65, 0.01, halfH * 0.35);
      const markerGeom = new THREE.SphereGeometry(0.07, 12, 12);
      const aMesh = new THREE.Mesh(markerGeom, new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      aMesh.position.copy(aLocal);
      hinge.add(aMesh);

      // Fixed-side corresponding point A' when fully folded would be mirrored across crease
      const aPrime = new THREE.Mesh(markerGeom, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      aPrime.position.set(-halfW * 0.65, thickness + 0.02, halfH * 0.35);
      group.add(aPrime);

      const corr = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-halfW * 0.65, thickness + 0.02, halfH * 0.35),
          new THREE.Vector3(halfW * 0.65, thickness + 0.02, halfH * 0.35),
        ]),
        new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 })
      );
      group.add(corr);
    }

    // Apply first fold angle: 0 = flat, PI = fully folded onto fixed half
    const angle1 = (foldProgress / 100) * Math.PI;
    // Rotate around Z so the +X half flips over toward -X ascending through +Y
    hinge.rotation.z = angle1;

    // Second fold for double_fold mode: fold along horizontal midline of the stacked paper
    if (mode === 'double_fold' && foldProgress >= 99.5) {
      const hinge2 = new THREE.Group();
      // After first fold, paper occupies x in [-halfW, 0]
      hinge2.position.set(-halfW / 2, thickness * 2 + 0.01, 0);
      group.add(hinge2);

      // Hide the already-folded moving sheet visually under second fold by adding stacked halves along z
      const topGeom = new THREE.PlaneGeometry(halfW, halfH);
      const leafFixed = new THREE.Mesh(topGeom, fixedMat.clone());
      leafFixed.rotation.x = -Math.PI / 2;
      leafFixed.position.set(0, 0, -halfH / 2);
      hinge2.add(leafFixed);

      const leafMove = new THREE.Mesh(topGeom, moving2Mat);
      leafMove.rotation.x = -Math.PI / 2;
      leafMove.position.set(0, 0, halfH / 2);
      const hinge2b = new THREE.Group();
      hinge2b.position.set(0, 0, 0);
      hinge2.add(hinge2b);
      hinge2b.add(leafMove);

      const angle2 = (secondFold / 100) * Math.PI;
      // Fold about X axis so +Z half flips toward -Z
      if (foldOrder === 'horizontal-first') {
        hinge2b.rotation.x = -angle2;
      } else {
        hinge2b.rotation.x = angle2;
      }

      if (showCreaseMarkers) {
        const c2 = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-halfW, thickness * 2 + 0.04, 0),
            new THREE.Vector3(0, thickness * 2 + 0.04, 0),
          ]),
          new THREE.LineDashedMaterial({ color: 0x818cf8, dashSize: 0.1, gapSize: 0.08 })
        );
        c2.computeLineDistances();
        group.add(c2);
      }
    }

    // Footprint overlay on ground
    if (showFootprint) {
      const fpW =
        mode === 'double_fold' && foldProgress >= 99.5 && secondFold > 50
          ? halfW
          : mode === 'double_fold' && foldProgress >= 99.5
            ? halfW
            : foldProgress >= 50
              ? halfW
              : paperW * (1 - (foldProgress / 100) * 0.5);
      const fpH =
        mode === 'double_fold' && foldProgress >= 99.5 && secondFold > 50
          ? halfH
          : paperH;
      const fpGeom = new THREE.PlaneGeometry(Math.max(fpW, 0.05), Math.max(fpH, 0.05));
      const fpMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      const fp = new THREE.Mesh(fpGeom, fpMat);
      fp.rotation.x = -Math.PI / 2;
      fp.position.set(mode === 'half_fold' || mode === 'overlap_map' || foldProgress > 50 ? -halfW / 2 : 0, 0.005, 0);
      if (mode === 'double_fold' && foldProgress >= 99.5 && secondFold > 50) {
        fp.position.set(-halfW / 2, 0.005, -halfH / 2);
      }
      group.add(fp);

      const fpEdge = new THREE.LineSegments(
        new THREE.EdgesGeometry(fpGeom),
        new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.7 })
      );
      fp.add(fpEdge);
    }

    // Original full footprint ghost
    if (showFootprint && foldProgress > 1) {
      const ghostGeom = new THREE.PlaneGeometry(paperW, paperH);
      const ghost = new THREE.Mesh(
        ghostGeom,
        new THREE.MeshBasicMaterial({
          color: 0x64748b,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
        })
      );
      ghost.rotation.x = -Math.PI / 2;
      ghost.position.set(0, 0.002, 0);
      group.add(ghost);
    }
  }, [
    mode,
    foldProgress,
    secondFold,
    showCreaseMarkers,
    showFootprint,
    foldOrder,
    paperW,
    paperH,
  ]);

  const modes: { key: PaperFoldMode; label: string }[] = [
    { key: 'half_fold', label: '一次对折' },
    { key: 'double_fold', label: '两次对折' },
    { key: 'overlap_map', label: '重叠与对应' },
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
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
                mode === item.key
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-2 left-2 right-2 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-semibold text-slate-200 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" />
              折叠进度
            </span>
            <span className="font-mono text-rose-300 font-bold">{foldProgress.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFoldProgress(0);
                setSecondFold(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
              title="复位"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={foldProgress}
              onChange={(e) => setFoldProgress(parseFloat(e.target.value))}
              className="flex-1 accent-rose-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setFoldProgress(100)}
              className="px-2 py-1 rounded-lg bg-rose-600/80 text-white text-[10px] font-medium"
            >
              折合
            </button>
          </div>
          {mode === 'double_fold' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>第二次折叠（需先完成第一次）</span>
                <span className="font-mono text-indigo-300">{secondFold.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                disabled={foldProgress < 99.5}
                value={secondFold}
                onChange={(e) => setSecondFold(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setShowCreaseMarkers((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                showCreaseMarkers
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              折痕/对应点
            </button>
            <button
              type="button"
              onClick={() => setShowFootprint((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                showFootprint
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              占地投影
            </button>
          </div>
        </div>

        <div className="absolute top-11 right-2 hidden xl:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg pointer-events-none">
          <Eye className="w-3 h-3" />
          <span>黄点与蓝点为折痕对应点 · 青框为当前占地</span>
        </div>
      </div>

      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📄 平面折叠与折纸图形演练台
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            演示折叠层次、重叠覆盖、折痕对应与占地面积；为考点训练模型，非某道国考题的精确还原。
          </p>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
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
                className={`h-1.5 flex-1 rounded-full ${i === guideIndex ? 'bg-rose-400' : 'bg-slate-700'}`}
                aria-label={`步骤 ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {mode === 'double_fold' && (
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              折叠顺序（影响层序）
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFoldOrder('horizontal-first')}
                className={`py-1.5 px-2 rounded-lg text-[11px] border ${
                  foldOrder === 'horizontal-first'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                先左右，再上下
              </button>
              <button
                type="button"
                onClick={() => setFoldOrder('vertical-first')}
                className={`py-1.5 px-2 rounded-lg text-[11px] border ${
                  foldOrder === 'vertical-first'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                反向层序对照
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>面积与层数读数</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div className="bg-slate-950/50 p-2 rounded-lg">
              纸张面积 S
              <div className="font-mono text-amber-300 mt-0.5">{metrics.paperArea.toFixed(2)}</div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg">
              当前占地
              <div className="font-mono text-cyan-300 mt-0.5">{metrics.footprint.toFixed(2)}</div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg">
              重叠/覆盖量
              <div className="font-mono text-rose-300 mt-0.5">{metrics.overlap.toFixed(2)}</div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg">
              最大层数
              <div className="font-mono text-violet-300 mt-0.5">{metrics.layersMax}</div>
            </div>
            <div className="bg-slate-950/50 p-2 rounded-lg col-span-2">
              占地 / 纸面积
              <div className="font-mono text-emerald-300 mt-0.5">{metrics.ratio}</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            理想一次对折：占地 → S/2，层数 2；理想两次对折：占地 → S/4，层数 4。纸面积始终为 S。
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-950/30 to-slate-900 p-4 rounded-xl border border-rose-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <span>公考秒杀要点</span>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc pl-4">
            <li>问“折后占地/投影面积”看投影并集，不是把各层面积相加。</li>
            <li>问“重叠面积”看投影交集；层数 = 同一投影位置被覆盖次数。</li>
            <li>折痕是对应点连线的中垂线；顺序不同可能只改层序不改最终外形。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaperFoldingViewer;
