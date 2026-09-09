import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';
import { MathView } from './MathView';

interface CrossSectionViewerProps {
  initialMode?: 'cube' | 'cylinder';
  initialPreset?: string;
}

export const CrossSectionViewer: React.FC<CrossSectionViewerProps> = ({
  initialPreset = 'triangle',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Plane normal angles (spherical coordinates) and offset
  const [pitch, setPitch] = useState<number>(45); // deg
  const [yaw, setYaw] = useState<number>(45); // deg
  const [offset, setOffset] = useState<number>(0); // distance from center (-2 to 2)

  // View toggles
  const [showUpperHalf, setShowUpperHalf] = useState<boolean>(true);
  const [showPlane, setShowPlane] = useState<boolean>(true);

  // Detected polygon information
  const [polyInfo, setPolyInfo] = useState<{
    vertexCount: number;
    shapeName: string;
    isPossible: boolean;
    reason?: string;
  }>({
    vertexCount: 3,
    shapeName: '等边三角形',
    isPossible: true,
  });

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Apply Presets
  const applyPreset = (type: string) => {
    switch (type) {
      case 'triangle':
        // Equilateral triangle (cuts through 3 edges near corner symmetrically)
        // Space diagonal normal: y = 1/sqrt(3) -> pitch = asin(1/sqrt(3)) ≈ 35.3°
        setPitch(35.3);
        setYaw(45);
        setOffset(1.8);
        break;
      case 'rectangle':
        // Rectangle through opposite edges
        setPitch(45);
        setYaw(0);
        setOffset(0);
        break;
      case 'trapezoid':
        // Isosceles trapezoid (parallel top & bottom, equal legs)
        setPitch(25);
        setYaw(45);
        setOffset(1.1);
        break;
      case 'pentagon':
        // 5-sided polygon
        setPitch(60);
        setYaw(25);
        setOffset(0.4);
        break;
      case 'hexagon':
        // Regular hexagon passing through 6 edge midpoints symmetrically
        setPitch(35.3);
        setYaw(45);
        setOffset(0);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (initialPreset) {
      applyPreset(initialPreset);
    }
  }, [initialPreset]);

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
    camera.position.set(7, 6, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true; // Enable local clipping
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.5);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
    grid.position.y = -3.2;
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

  // Compute normal vector from pitch and yaw
  const planeNormal = useMemo(() => {
    const pitchRad = (pitch * Math.PI) / 180;
    const yawRad = (yaw * Math.PI) / 180;
    const y = Math.sin(pitchRad);
    const proj = Math.cos(pitchRad);
    const x = proj * Math.sin(yawRad);
    const z = proj * Math.cos(yawRad);
    return new THREE.Vector3(x, y, z).normalize();
  }, [pitch, yaw]);

  // Slicing Math and 3D Construction
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

    const cubeSize = 3;
    const half = cubeSize / 2;

    // Normal and Plane constant: n . x - offset = 0
    // Clipping planes:
    const clipPlaneBottom = new THREE.Plane(planeNormal.clone().negate(), offset);
    const clipPlaneTop = new THREE.Plane(planeNormal.clone(), -offset);

    // 1. Lower clipped half of cube
    const cubeGeom = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const lowerMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      roughness: 0.3,
      metalness: 0.1,
      clippingPlanes: [clipPlaneBottom],
      clipShadows: true,
      side: THREE.DoubleSide,
    });
    const lowerMesh = new THREE.Mesh(cubeGeom, lowerMat);
    group.add(lowerMesh);

    // 2. Upper clipped half (optional semi-transparent)
    if (showUpperHalf) {
      const upperMat = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.2,
        wireframe: false,
        clippingPlanes: [clipPlaneTop],
        side: THREE.DoubleSide,
      });
      group.add(new THREE.Mesh(cubeGeom, upperMat));
    }

    // 3. Cube full wireframe outline
    const edgesGeom = new THREE.EdgesGeometry(cubeGeom);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 1 });
    group.add(new THREE.LineSegments(edgesGeom, wireMat));

    // 4. Calculate exact intersection polygon between plane and 12 edges of the cube
    // 12 edges defined by endpoints
    const edges: [THREE.Vector3, THREE.Vector3][] = [
      // Bottom 4 edges (y = -half)
      [new THREE.Vector3(-half, -half, -half), new THREE.Vector3(half, -half, -half)],
      [new THREE.Vector3(half, -half, -half), new THREE.Vector3(half, -half, half)],
      [new THREE.Vector3(half, -half, half), new THREE.Vector3(-half, -half, half)],
      [new THREE.Vector3(-half, -half, half), new THREE.Vector3(-half, -half, -half)],
      // Top 4 edges (y = half)
      [new THREE.Vector3(-half, half, -half), new THREE.Vector3(half, half, -half)],
      [new THREE.Vector3(half, half, -half), new THREE.Vector3(half, half, half)],
      [new THREE.Vector3(half, half, half), new THREE.Vector3(-half, half, half)],
      [new THREE.Vector3(-half, half, half), new THREE.Vector3(-half, half, -half)],
      // Vertical 4 edges
      [new THREE.Vector3(-half, -half, -half), new THREE.Vector3(-half, half, -half)],
      [new THREE.Vector3(half, -half, -half), new THREE.Vector3(half, half, -half)],
      [new THREE.Vector3(half, -half, half), new THREE.Vector3(half, half, half)],
      [new THREE.Vector3(-half, -half, half), new THREE.Vector3(-half, half, half)],
    ];

    const intersections: THREE.Vector3[] = [];
    const eps = 1e-4;

    edges.forEach(([p1, p2]) => {
      const d1 = planeNormal.dot(p1) - offset;
      const d2 = planeNormal.dot(p2) - offset;

      // Check if plane intersects segment
      if (d1 * d2 <= 0 && Math.abs(d1 - d2) > eps) {
        const t = d1 / (d1 - d2);
        const intersectPt = p1.clone().lerp(p2, t);

        // Check if duplicate
        const isDuplicate = intersections.some((pt) => pt.distanceTo(intersectPt) < 0.05);
        if (!isDuplicate) {
          intersections.push(intersectPt);
        }
      }
    });

    // Update polygon state
    if (intersections.length >= 3) {
      // Calculate center of polygon
      const center = new THREE.Vector3();
      intersections.forEach((pt) => center.add(pt));
      center.divideScalar(intersections.length);

      // Create a 2D coordinate system on the slicing plane to sort vertices cyclically
      // Tangent vector u, bitangent v
      let uVec = new THREE.Vector3(1, 0, 0);
      if (Math.abs(planeNormal.dot(uVec)) > 0.9) {
        uVec = new THREE.Vector3(0, 1, 0);
      }
      uVec.cross(planeNormal).normalize();
      const vVec = new THREE.Vector3().crossVectors(planeNormal, uVec).normalize();

      intersections.sort((a, b) => {
        const da = a.clone().sub(center);
        const db = b.clone().sub(center);
        const angA = Math.atan2(da.dot(vVec), da.dot(uVec));
        const angB = Math.atan2(db.dot(vVec), db.dot(uVec));
        return angA - angB;
      });

      // 5. Draw highlighted Neon polygon cap
      const polyPts = [...intersections, intersections[0]];
      const polyLineGeom = new THREE.BufferGeometry().setFromPoints(polyPts);
      const polyLineMat = new THREE.LineBasicMaterial({
        color: 0xef4444, // Bright Red
        linewidth: 4,
      });
      group.add(new THREE.Line(polyLineGeom, polyLineMat));

      // Draw Filled Cap
      const shape2D = new THREE.Shape();
      intersections.forEach((pt, i) => {
        const d = pt.clone().sub(center);
        const x2D = d.dot(uVec);
        const y2D = d.dot(vVec);
        if (i === 0) shape2D.moveTo(x2D, y2D);
        else shape2D.lineTo(x2D, y2D);
      });
      shape2D.closePath();

      const capGeom = new THREE.ShapeGeometry(shape2D);
      const capMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      });
      const capMesh = new THREE.Mesh(capGeom, capMat);

      // Transform capMesh to match plane orientation and center
      const rotMatrix = new THREE.Matrix4().makeBasis(uVec, vVec, planeNormal);
      capMesh.setRotationFromMatrix(rotMatrix);
      capMesh.position.copy(center);
      group.add(capMesh);

      // Spheres at vertices
      const ptGeom = new THREE.SphereGeometry(0.09, 12, 12);
      const ptMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      intersections.forEach((pt) => {
        const s = new THREE.Mesh(ptGeom, ptMat);
        s.position.copy(pt);
        group.add(s);
      });

      // Update name based on vertex count
      let sName = '多边形';
      if (intersections.length === 3) sName = '锐角/等边三角形';
      else if (intersections.length === 4) sName = '四边形 (矩形/正方形/等腰梯形)';
      else if (intersections.length === 5) sName = '五边形';
      else if (intersections.length === 6) sName = '六边形 (如正六边形)';

      setPolyInfo({
        vertexCount: intersections.length,
        shapeName: sName,
        isPossible: true,
      });
    } else {
      setPolyInfo({
        vertexCount: 0,
        shapeName: '未相交或仅接触顶点',
        isPossible: false,
      });
    }

    // 6. Draw Cutting Plane Sheet
    if (showPlane) {
      const planeSheetGeom = new THREE.PlaneGeometry(6, 6);
      const planeSheetMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const planeMesh = new THREE.Mesh(planeSheetGeom, planeSheetMat);

      // Align plane
      const planeCenter = planeNormal.clone().multiplyScalar(offset);
      planeMesh.position.copy(planeCenter);
      planeMesh.lookAt(planeCenter.clone().add(planeNormal));
      group.add(planeMesh);

      // Plane border
      const planeEdges = new THREE.EdgesGeometry(planeSheetGeom);
      const planeBorderMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.4, transparent: true });
      planeMesh.add(new THREE.LineSegments(planeEdges, planeBorderMat));
    }
  }, [planeNormal, offset, showUpperHalf, showPlane]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* 3D Canvas */}
      <div className="relative w-full h-[40vh] min-h-[250px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Floating Top Preset Selector */}
        <div className="absolute top-2 left-2 right-2 flex overflow-x-auto no-scrollbar gap-1.5 z-10">
          <button
            onClick={() => applyPreset('triangle')}
            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md whitespace-nowrap"
          >
            🔺 等边三角形
          </button>
          <button
            onClick={() => applyPreset('rectangle')}
            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md whitespace-nowrap"
          >
            ⬛ 对角矩形
          </button>
          <button
            onClick={() => applyPreset('trapezoid')}
            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md whitespace-nowrap"
          >
            ⏢ 等腰梯形
          </button>
          <button
            onClick={() => applyPreset('pentagon')}
            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md whitespace-nowrap"
          >
            ⬠ 五边形
          </button>
          <button
            onClick={() => applyPreset('hexagon')}
            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 backdrop-blur-md whitespace-nowrap"
          >
            ⬡ 正六边形
          </button>
        </div>

        {/* Live Detected Shape Floating Pill */}
        <div className="absolute bottom-2 left-2 right-2 max-w-lg mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                polyInfo.vertexCount >= 3 ? 'bg-red-500 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <div>
              <div className="text-[11px] font-bold text-white flex items-center gap-1">
                <span>识别:</span>
                <span className="text-red-400 font-mono text-xs">{polyInfo.shapeName}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                顶点数: <strong className="text-amber-400">{polyInfo.vertexCount}</strong>（交 {polyInfo.vertexCount} 个面）
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px]">
            <button
              onClick={() => setShowPlane(!showPlane)}
              className={`px-2 py-1 rounded border font-medium transition-colors ${
                showPlane
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showPlane ? '隐藏切面' : '显示切面'}
            </button>
            <button
              onClick={() => setShowUpperHalf(!showUpperHalf)}
              className={`px-2 py-1 rounded border font-medium transition-colors ${
                showUpperHalf
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showUpperHalf ? '隐上半' : '显上半'}
            </button>
          </div>
        </div>

        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>红框为截面轮廓 · 黄点为棱上交点</span>
        </div>
      </div>

      {/* Right Control Panel & Exam Rules */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            ✂️ 空间截面自由切切乐
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            自由调整切刀角度与深度，透视正方体内部截面交线的生成机制。
          </p>
        </div>

        {/* Cutter Orientation Sliders */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>切刀平面角度与深度调节</span>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-400">
              <span>俯仰角度 (Pitch):</span>
              <span className="font-mono text-sky-400 font-bold">{pitch}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-400">
              <span>偏航角度 (Yaw):</span>
              <span className="font-mono text-sky-400 font-bold">{yaw}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={yaw}
              onChange={(e) => setYaw(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1 text-slate-400">
              <span>切刀平移位置 (Offset):</span>
              <span className="font-mono text-sky-400 font-bold">{offset.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1.8"
              max="1.8"
              step="0.05"
              value={offset}
              onChange={(e) => setOffset(parseFloat(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Public Exam Flash Rule Inspector */}
        <div className="bg-gradient-to-br from-rose-950/30 to-slate-900 p-4 rounded-xl border border-rose-500/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>公考考点：“截面绝对不可能”秒杀法则</span>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">① 边数上限：</span>
              <span>
                一个平面与立体图形相交，<strong>与几个面相交就是几边形</strong>。正方体只有 6 个面，截面边数只能是 3、4、5、6 边形，<strong>绝对切不出七边形</strong>！
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-rose-400 font-bold">② 三角形内角：</span>
              <span>
                正方体截出的三角形<strong>只能是锐角三角形</strong>，绝不可能切出<strong>直角三角形</strong>或<strong>钝角三角形</strong>！
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-slate-400">
              <div className="font-mono text-rose-300 mb-1">【严谨证明口诀】：</div>
              设切角截取同一顶点三条棱为 x, y, z，三边平方为 a²=x²+y², b²=y²+z², c²=z²+x²。
              <MathView
                math="a^2 + b^2 = x^2 + 2y^2 + z^2 > x^2 + z^2 = c^2 \implies \cos C > 0"
                block
                className="text-xs text-slate-300 my-1"
              />
              任两边平方和恒大于第三边平方，三内角全为锐角！
            </div>
          </div>
        </div>

        {/* Possible Shapes Quick Check */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>正方体截面可能出现清单</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-2 rounded-lg">
              <span className="text-emerald-400">✓</span> 等边三角形
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-2 rounded-lg">
              <span className="text-emerald-400">✓</span> 锐角三角形
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-2 rounded-lg">
              <span className="text-emerald-400">✓</span> 正方形 / 矩形
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-2 rounded-lg">
              <span className="text-emerald-400">✓</span> 等腰梯形
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-2 rounded-lg">
              <span className="text-emerald-400">✓</span> 菱形
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/50 p-2 rounded-lg">
              <span className="text-emerald-400">✓</span> 正六边形
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
