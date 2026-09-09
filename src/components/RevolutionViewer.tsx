import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Eye, Sparkles, HelpCircle } from 'lucide-react';
import { MathView } from './MathView';

interface RevolutionViewerProps {
  initialMode?: 'triangle' | 'trapezoid' | 'rectangle';
  initialParams?: Record<string, number | string>;
}

export const RevolutionViewer: React.FC<RevolutionViewerProps> = ({
  initialMode = 'trapezoid',
  initialParams = {},
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [shapeType, setShapeType] = useState<'triangle' | 'trapezoid' | 'rectangle'>(initialMode);

  // Triangle params
  const [triA, setTriA] = useState<number>(Number(initialParams.triA) || 4); // vertical leg (height)
  const [triB, setTriB] = useState<number>(Number(initialParams.triB) || 3); // horizontal leg (base)
  const [triAxis, setTriAxis] = useState<'vertical' | 'horizontal'>('vertical');

  // Trapezoid params
  const [trapTop, setTrapTop] = useState<number>(Number(initialParams.topR) || 2); // top base
  const [trapBottom, setTrapBottom] = useState<number>(Number(initialParams.bottomR) || 5); // bottom base
  const [trapH, setTrapH] = useState<number>(Number(initialParams.height) || 4); // height
  const [trapAxis, setTrapAxis] = useState<'height' | 'bottom'>('height'); // rotate around height (圆台) or bottom (圆柱+圆锥)

  // Sweep angle in degrees (0 to 360)
  const [sweepAngle, setSweepAngle] = useState<number>(270);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Handle incoming props
  useEffect(() => {
    if (initialParams.mode && typeof initialParams.mode === 'string') {
      setShapeType(initialParams.mode as any);
    }
    if (initialParams.topR) setTrapTop(Number(initialParams.topR));
    if (initialParams.bottomR) setTrapBottom(Number(initialParams.bottomR));
    if (initialParams.height) setTrapH(Number(initialParams.height));
  }, [initialParams]);

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
    camera.position.set(10, 8, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(10, 20, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x818cf8, 0.5);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    // Floor grid
    const grid = new THREE.GridHelper(24, 24, 0x334155, 0x1e293b);
    grid.position.y = -3.5;
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

  // Continuous animation loop for sweep
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const step = () => {
      setSweepAngle((prev) => {
        if (prev >= 360) {
          setIsPlaying(false);
          return 360;
        }
        return Math.min(prev + 2, 360);
      });
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Build Revolution 3D Meshes
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) {
        if (Array.isArray((child as any).material)) {
          (child as any).material.forEach((m: any) => m.dispose());
        } else {
          (child as any).material.dispose();
        }
      }
    }

    const phiRad = (sweepAngle / 360) * 2 * Math.PI;

    // Define 2D profile points in (r, y) where Y is the vertical rotation axis
    let profile2D: THREE.Vector2[] = [];
    let axisLineLength = 8;

    if (shapeType === 'triangle') {
      if (triAxis === 'vertical') {
        // Rotate around leg A (height)
        // Triangle in (r, y): (0, -triA/2) -> (triB, -triA/2) -> (0, triA/2)
        profile2D = [
          new THREE.Vector2(0, -triA / 2),
          new THREE.Vector2(triB, -triA / 2),
          new THREE.Vector2(0, triA / 2),
        ];
        axisLineLength = triA + 2;
      } else {
        // Rotate around leg B (base)
        // Now leg B is along vertical Y axis: length triB. Horizontal is triA.
        profile2D = [
          new THREE.Vector2(0, -triB / 2),
          new THREE.Vector2(triA, -triB / 2),
          new THREE.Vector2(0, triB / 2),
        ];
        axisLineLength = triB + 2;
      }
    } else if (shapeType === 'trapezoid') {
      if (trapAxis === 'height') {
        // Rotate around height (Forms Frustum)
        // Bottom r2, top r1, height trapH
        profile2D = [
          new THREE.Vector2(0, -trapH / 2),
          new THREE.Vector2(trapBottom, -trapH / 2),
          new THREE.Vector2(trapTop, trapH / 2),
          new THREE.Vector2(0, trapH / 2),
        ];
        axisLineLength = trapH + 2;
      } else {
        // Rotate around bottom base (trapBottom)
        // Axis is bottom base. Radius is trapH!
        // At y = -trapBottom/2: cylinder of radius trapH, length trapTop
        // Then cone from trapTop to trapBottom tapering to 0!
        profile2D = [
          new THREE.Vector2(0, -trapBottom / 2),
          new THREE.Vector2(trapH, -trapBottom / 2),
          new THREE.Vector2(trapH, -trapBottom / 2 + trapTop),
          new THREE.Vector2(0, trapBottom / 2),
        ];
        axisLineLength = trapBottom + 2;
      }
    } else {
      // Rectangle of width 3, height 4
      profile2D = [
        new THREE.Vector2(0, -2),
        new THREE.Vector2(3, -2),
        new THREE.Vector2(3, 2),
        new THREE.Vector2(0, 2),
      ];
      axisLineLength = 6;
    }

    // 1. Rotation Axis Line (Yellow glowing vertical axis)
    const axisPoints = [
      new THREE.Vector3(0, -axisLineLength / 2, 0),
      new THREE.Vector3(0, axisLineLength / 2, 0),
    ];
    const axisGeom = new THREE.BufferGeometry().setFromPoints(axisPoints);
    const axisMat = new THREE.LineDashedMaterial({
      color: 0xfacc15,
      dashSize: 0.3,
      gapSize: 0.15,
      linewidth: 3,
    });
    const axisLine = new THREE.Line(axisGeom, axisMat);
    axisLine.computeLineDistances();
    group.add(axisLine);

    // 2. Lathe Geometry for swept 3D solid
    if (sweepAngle > 1) {
      const segments = Math.max(8, Math.floor((sweepAngle / 360) * 48));
      const latheGeom = new THREE.LatheGeometry(profile2D, segments, 0, phiRad);
      const latheMat = new THREE.MeshStandardMaterial({
        color: shapeType === 'trapezoid' ? 0x8b5cf6 : 0x06b6d4,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        roughness: 0.35,
        metalness: 0.1,
      });
      const latheMesh = new THREE.Mesh(latheGeom, latheMat);
      group.add(latheMesh);

      // Edge wireframe on swept solid
      const wireMat = new THREE.MeshBasicMaterial({
        color: shapeType === 'trapezoid' ? 0x6d28d9 : 0x0891b2,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      });
      group.add(new THREE.Mesh(latheGeom, wireMat));
    }

    // 3. Leading edge 2D profile (rotating cross-section)
    const shapeOutline3D: THREE.Vector3[] = [];
    profile2D.forEach((pt) => {
      // Rotate by current phiRad
      const x = pt.x * Math.cos(phiRad);
      const z = -pt.x * Math.sin(phiRad);
      const y = pt.y;
      shapeOutline3D.push(new THREE.Vector3(x, y, z));
    });
    // close polygon
    shapeOutline3D.push(shapeOutline3D[0]);

    const outlineGeom = new THREE.BufferGeometry().setFromPoints(shapeOutline3D);
    const outlineMat = new THREE.LineBasicMaterial({
      color: 0xf43f5e, // Hot Rose/Red
      linewidth: 3,
    });
    group.add(new THREE.Line(outlineGeom, outlineMat));

    // Fill the 2D planar profile at the current sweep front
    const flatShape = new THREE.Shape();
    profile2D.forEach((pt, idx) => {
      if (idx === 0) flatShape.moveTo(pt.x, pt.y);
      else flatShape.lineTo(pt.x, pt.y);
    });
    flatShape.closePath();

    const shapeGeom = new THREE.ShapeGeometry(flatShape);
    const shapeMeshMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const shapeMesh = new THREE.Mesh(shapeGeom, shapeMeshMat);
    shapeMesh.rotation.y = -phiRad;
    group.add(shapeMesh);

    // Initial stationary 2D profile at angle 0 for reference
    const initShapeMesh = new THREE.Mesh(
      shapeGeom,
      new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      })
    );
    group.add(initShapeMesh);

    // 4. Trajectory rings for outer corners
    profile2D.forEach((pt) => {
      if (pt.x > 0.1) {
        const ringGeom = new THREE.BufferGeometry();
        const pts: THREE.Vector3[] = [];
        const ringSegs = Math.max(6, Math.floor((sweepAngle / 360) * 40));
        for (let s = 0; s <= ringSegs; s++) {
          const ang = (s / ringSegs) * phiRad;
          pts.push(new THREE.Vector3(pt.x * Math.cos(ang), pt.y, -pt.x * Math.sin(ang)));
        }
        ringGeom.setFromPoints(pts);
        const ringMat = new THREE.LineBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.5,
        });
        group.add(new THREE.Line(ringGeom, ringMat));
      }
    });
  }, [shapeType, triA, triB, triAxis, trapTop, trapBottom, trapH, trapAxis, sweepAngle]);

  // Volume & Math calculations
  const mathCalcs = useMemo(() => {
    if (shapeType === 'triangle') {
      if (triAxis === 'vertical') {
        // Cone: radius = triB, height = triA
        const r = triB;
        const h = triA;
        const vol = (1 / 3) * Math.PI * r * r * h;
        return {
          shapeName: '圆锥 (以竖直边 a 为轴)',
          r,
          h,
          vol,
          formula: `V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\times ${r}^2 \\times ${h} = ${(vol / Math.PI).toFixed(2)}\\pi \\approx ${vol.toFixed(1)}`,
        };
      } else {
        // Cone: radius = triA, height = triB
        const r = triA;
        const h = triB;
        const vol = (1 / 3) * Math.PI * r * r * h;
        return {
          shapeName: '圆锥 (以底边 b 为轴)',
          r,
          h,
          vol,
          formula: `V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\times ${r}^2 \\times ${h} = ${(vol / Math.PI).toFixed(2)}\\pi \\approx ${vol.toFixed(1)}`,
        };
      }
    } else if (shapeType === 'trapezoid') {
      if (trapAxis === 'height') {
        // Frustum: r1 = trapTop, r2 = trapBottom, h = trapH
        const r1 = trapTop;
        const r2 = trapBottom;
        const h = trapH;
        const vol = (1 / 3) * Math.PI * h * (r1 * r1 + r1 * r2 + r2 * r2);
        return {
          shapeName: '圆台 (绕垂直高旋转)',
          r1,
          r2,
          h,
          vol,
          formula: `V = \\frac{1}{3}\\pi h (r_1^2 + r_1 r_2 + r_2^2) = ${(vol / Math.PI).toFixed(2)}\\pi \\approx ${vol.toFixed(1)}`,
        };
      } else {
        // Cylinder + Cone combination:
        // Cylinder: radius = trapH, height = trapTop
        // Cone: radius = trapH, height = trapBottom - trapTop
        const R = trapH;
        const hCyl = trapTop;
        const hCone = trapBottom - trapTop;
        const vCyl = Math.PI * R * R * hCyl;
        const vCone = (1 / 3) * Math.PI * R * R * hCone;
        const vol = vCyl + vCone;
        return {
          shapeName: '圆柱 + 圆锥组合体 (绕下底旋转)',
          R,
          hCyl,
          hCone,
          vol,
          formula: `V = \\pi R^2 h_1 + \\frac{1}{3}\\pi R^2 h_2 = ${(vol / Math.PI).toFixed(2)}\\pi \\approx ${vol.toFixed(1)}`,
        };
      }
    } else {
      // Cylinder
      const r = 3;
      const h = 4;
      const vol = Math.PI * r * r * h;
      return {
        shapeName: '圆柱',
        r,
        h,
        vol,
        formula: `V = \\pi r^2 h = \\pi \\times 3^2 \\times 4 = 36\\pi \\approx 113.1`,
      };
    }
  }, [shapeType, triA, triB, triAxis, trapTop, trapBottom, trapH, trapAxis]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* 3D Canvas */}
      <div className="relative w-full h-[48vh] min-h-[320px] sm:min-h-[360px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Floating Top Mode Selector */}
        <div className="absolute top-2 left-2 right-2 flex overflow-x-auto no-scrollbar gap-1.5 z-10">
          <button
            onClick={() => setShapeType('trapezoid')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              shapeType === 'trapezoid'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            📐 直角梯形绕轴 (圆台/组合体)
          </button>
          <button
            onClick={() => setShapeType('triangle')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              shapeType === 'triangle'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            🔺 直角三角形绕轴 (圆锥)
          </button>
        </div>

        {/* Bottom Floating Sweep Progress */}
        <div className="absolute bottom-2 left-2 right-2 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10">
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>扫掠角度 (Sweep Angle)</span>
            </span>
            <span className="font-mono text-purple-400 font-bold text-xs">{sweepAngle.toFixed(0)}°</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-colors flex-shrink-0"
              title={isPlaying ? '暂停' : '自动旋转'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setSweepAngle(360); }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0"
            >
              360°成型
            </button>

            <button
              onClick={() => { setIsPlaying(false); setSweepAngle(0); }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
              title="复位至平面"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={sweepAngle}
              onChange={(e) => {
                setIsPlaying(false);
                setSweepAngle(parseFloat(e.target.value));
              }}
              className="flex-1 accent-purple-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* View instruction */}
        <div className="absolute top-11 right-2 hidden xl:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg pointer-events-none">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>黄虚线为旋转轴 · 红框为当前旋转截面</span>
        </div>
      </div>

      {/* Right Controls and Exam Theory */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🌀 旋转体动态扫掠与体积拆解
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            同一张 2D 纸片，绕不同的边旋转，生成的 3D 几何体形状与体积完全不同！
          </p>
        </div>

        {/* Parameter configuration */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>几何尺寸与旋转轴设置</span>
          </div>

          {shapeType === 'trapezoid' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">旋转轴选取（关键）：</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTrapAxis('height')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-left ${
                      trapAxis === 'height'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>绕垂直的高 (h)</div>
                    <div className="text-[10px] text-purple-400/80">生成标准圆台</div>
                  </button>
                  <button
                    onClick={() => setTrapAxis('bottom')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-left ${
                      trapAxis === 'bottom'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>绕底边 (BC)</div>
                    <div className="text-[10px] text-purple-400/80">圆柱 + 圆锥组合</div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>上底 r1: <strong className="text-purple-400 font-mono">{trapTop}</strong></span>
                  <span>下底 r2: <strong className="text-purple-400 font-mono">{trapBottom}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={trapTop}
                    onChange={(e) => setTrapTop(parseFloat(e.target.value))}
                    className="accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="range"
                    min="3"
                    max="6"
                    step="0.5"
                    value={trapBottom}
                    onChange={(e) => setTrapBottom(parseFloat(e.target.value))}
                    className="accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>高 h: <strong className="text-purple-400 font-mono">{trapH}</strong></span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="0.5"
                  value={trapH}
                  onChange={(e) => setTrapH(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}

          {shapeType === 'triangle' && (
            <>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">旋转轴对比：</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTriAxis('vertical')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-left ${
                      triAxis === 'vertical'
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>绕竖直边 a (高={triA})</div>
                    <div className="text-[10px] text-cyan-400/80">底半径 = {triB}</div>
                  </button>
                  <button
                    onClick={() => setTriAxis('horizontal')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all text-left ${
                      triAxis === 'horizontal'
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>绕水平底边 b (高={triB})</div>
                    <div className="text-[10px] text-cyan-400/80">底半径 = {triA}</div>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>竖直边 a: <strong className="text-cyan-400 font-mono">{triA}</strong></span>
                  <span>水平边 b: <strong className="text-cyan-400 font-mono">{triB}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="range"
                    min="2"
                    max="6"
                    step="0.5"
                    value={triA}
                    onChange={(e) => setTriA(parseFloat(e.target.value))}
                    className="accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="range"
                    min="2"
                    max="6"
                    step="0.5"
                    value={triB}
                    onChange={(e) => setTriB(parseFloat(e.target.value))}
                    className="accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Volume Formula & Results */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-400 mb-2">
            <span>几何体类型与体积解算</span>
            <span className="font-mono text-purple-300">{mathCalcs.shapeName}</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="pt-1 flex justify-between items-center text-sm border-t border-slate-800">
              <span className="font-bold text-white">成型体积 V:</span>
              <span className="font-mono font-bold text-purple-400 text-base">
                {mathCalcs.vol.toFixed(2)}
              </span>
            </div>
            <MathView
              math={mathCalcs.formula}
              block
              className="text-xs text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80"
            />
          </div>
        </div>

        {/* Public Exam Trick */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>公考典型题型秒杀对照</span>
          </div>
          {shapeType === 'triangle' && (
            <p className="text-slate-400">
              直角三角形直角边为 a, b。分别绕 a 和 b 旋转得到的两个圆锥，其<strong>体积之比刚好等于对应底面半径之比</strong>：
              <span className="text-cyan-300 font-mono ml-1">V_a : V_b = b : a</span>。考场上直接利用这一比例秒答选择题，无需求具体数字！
            </p>
          )}
          {shapeType === 'trapezoid' && (
            <p className="text-slate-400">
              直角梯形绕下底旋转时，千万不要忘了<strong>拆分为“圆柱”和“圆锥”</strong>两部分！
              圆锥的高是 <span className="text-purple-300 font-mono">r_2 - r_1</span>，而底面半径是梯形的高 <span className="text-purple-300 font-mono">h</span>。很多考生习惯把梯形的高当成几何体的高而算错。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
