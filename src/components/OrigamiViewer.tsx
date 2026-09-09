import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Eye, Sparkles, CheckCircle2, AlertOctagon, BookOpen } from 'lucide-react';

export type NetType = '1-4-1' | '2-3-1' | '2-2-2' | '3-3';

interface OrigamiViewerProps {
  initialMode?: string;
  initialParams?: Record<string, any>;
}

interface FacePattern {
  id: number;
  name: string;
  color: string;
  oppositeId: number;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

const PATTERNS: FacePattern[] = [
  {
    id: 0,
    name: '底面 · 双同心圆',
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
    name: '前面 · 红色右箭头',
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
    name: '顶面 · 金色五角星',
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
    name: '后面 · 黑色实心方',
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
    name: '左面 · 对角大红叉',
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
    name: '右面 · 对角半黑半白',
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

export const OrigamiViewer: React.FC<OrigamiViewerProps> = ({
  initialParams = {},
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Active net archetype: 1-4-1, 2-3-1, 2-2-2, 3-3
  const [netType, setNetType] = useState<NetType>('1-4-1');

  // Folding progress: 0 (completely flat 2D net) -> 1 (fully folded 3D cube)
  const [foldProgress, setFoldProgress] = useState<number>(0.2);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Helper toggles
  const [highlightOpposite, setHighlightOpposite] = useState<boolean>(true);
  const [showClockwiseVertex, setShowClockwiseVertex] = useState<boolean>(true);
  const [showCatalog, setShowCatalog] = useState<boolean>(false);

  useEffect(() => {
    if (initialParams.highlight === 'opposite') {
      setHighlightOpposite(true);
    }
    if (initialParams.mode && ['1-4-1', '2-3-1', '2-2-2', '3-3'].includes(initialParams.mode)) {
      setNetType(initialParams.mode as NetType);
    }
  }, [initialParams]);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

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

      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = 4;
      return texture;
    });
  }, []);

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
    camera.position.set(7, 8, 9);

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

  // Handle auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const step = () => {
      setFoldProgress((prev) => {
        if (prev >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return Math.min(prev + 0.008, 1);
      });
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Build the folding mechanism based on netType
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    const a = 2.4; // Edge length
    const u = foldProgress; // 0 = flat, 1 = folded
    const foldAngle = u * (Math.PI / 2);

    const createFaceMesh = (patternIndex: number, pairIndex: number) => {
      const geom = new THREE.PlaneGeometry(a, a);
      const mat = new THREE.MeshStandardMaterial({
        map: faceTextures[patternIndex],
        roughness: 0.25,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geom, mat);

      if (highlightOpposite) {
        const edgeGeom = new THREE.EdgesGeometry(geom);
        let color = 0x38bdf8;
        if (pairIndex === 0) color = 0xef4444; // Front & Back (Red)
        if (pairIndex === 1) color = 0x22c55e; // Left & Right (Green)
        if (pairIndex === 2) color = 0x3b82f6; // Top & Bottom (Blue)

        const edgeMat = new THREE.LineBasicMaterial({ color, linewidth: 4 });
        mesh.add(new THREE.LineSegments(edgeGeom, edgeMat));
      }

      return mesh;
    };

    // -------------------------------------------------------------
    // Archetype 1: "1-4-1" 标准一四一型
    // -------------------------------------------------------------
    if (netType === '1-4-1') {
      const baseMesh = createFaceMesh(0, 2);
      baseMesh.rotation.x = Math.PI / 2;
      baseMesh.position.set(0, -a / 2, 0);
      group.add(baseMesh);

      // Front Face
      const frontPivot = new THREE.Group();
      frontPivot.position.set(0, -a / 2, a / 2);
      const frontMesh = createFaceMesh(1, 0);
      frontMesh.position.set(0, a / 2, 0);
      frontPivot.add(frontMesh);
      frontPivot.rotation.x = foldAngle;
      group.add(frontPivot);

      // Back Face + Top Face
      const backPivot = new THREE.Group();
      backPivot.position.set(0, -a / 2, -a / 2);
      const backMesh = createFaceMesh(3, 0);
      backMesh.position.set(0, a / 2, 0);
      backMesh.rotation.y = Math.PI;
      backPivot.add(backMesh);
      backPivot.rotation.x = -foldAngle;

      const topPivot = new THREE.Group();
      topPivot.position.set(0, a, 0);
      const topMesh = createFaceMesh(2, 2);
      topMesh.position.set(0, a / 2, 0);
      topMesh.rotation.x = Math.PI;
      topPivot.add(topMesh);
      topPivot.rotation.x = -foldAngle;
      backPivot.add(topPivot);

      group.add(backPivot);

      // Left Face
      const leftPivot = new THREE.Group();
      leftPivot.position.set(-a / 2, -a / 2, 0);
      const leftMesh = createFaceMesh(4, 1);
      leftMesh.position.set(0, a / 2, 0);
      leftMesh.rotation.y = -Math.PI / 2;
      leftPivot.add(leftMesh);
      leftPivot.rotation.z = -foldAngle;
      group.add(leftPivot);

      // Right Face
      const rightPivot = new THREE.Group();
      rightPivot.position.set(a / 2, -a / 2, 0);
      const rightMesh = createFaceMesh(5, 1);
      rightMesh.position.set(0, a / 2, 0);
      rightMesh.rotation.y = Math.PI / 2;
      rightPivot.add(rightMesh);
      rightPivot.rotation.z = foldAngle;
      group.add(rightPivot);

      if (showClockwiseVertex) {
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        pin.position.set(a / 2, a, 0.05);
        frontPivot.add(pin);
      }
    }

    // -------------------------------------------------------------
    // Archetype 2: "2-3-1" 楼梯拐角型 (公考常考大杀器)
    // -------------------------------------------------------------
    else if (netType === '2-3-1') {
      // Middle Row has 3: Left(4), Bottom(0), Right(5)
      // Top Row has 2: Top(2) attached above Left(4), Back(3) attached above Bottom(0)
      // Bottom Row has 1: Front(1) attached below Right(5)

      // Base Bottom (0)
      const baseMesh = createFaceMesh(0, 2);
      baseMesh.rotation.x = Math.PI / 2;
      baseMesh.position.set(0, -a / 2, 0);
      group.add(baseMesh);

      // Back Face (3) - hinged on Base north
      const backPivot = new THREE.Group();
      backPivot.position.set(0, -a / 2, -a / 2);
      const backMesh = createFaceMesh(3, 0);
      backMesh.position.set(0, a / 2, 0);
      backMesh.rotation.y = Math.PI;
      backPivot.add(backMesh);
      backPivot.rotation.x = -foldAngle;
      group.add(backPivot);

      // Left Face (4) - hinged on Base west
      const leftPivot = new THREE.Group();
      leftPivot.position.set(-a / 2, -a / 2, 0);
      const leftMesh = createFaceMesh(4, 1);
      leftMesh.position.set(0, a / 2, 0);
      leftMesh.rotation.y = -Math.PI / 2;
      leftPivot.add(leftMesh);
      leftPivot.rotation.z = -foldAngle;

      // Top Face (2) - hinged on Left north! (In 2D: above Left)
      const topPivot = new THREE.Group();
      topPivot.position.set(0, a, 0);
      const topMesh = createFaceMesh(2, 2);
      topMesh.position.set(0, a / 2, 0);
      topMesh.rotation.y = -Math.PI / 2;
      topPivot.add(topMesh);
      topPivot.rotation.x = -foldAngle;
      leftPivot.add(topPivot);

      group.add(leftPivot);

      // Right Face (5) - hinged on Base east
      const rightPivot = new THREE.Group();
      rightPivot.position.set(a / 2, -a / 2, 0);
      const rightMesh = createFaceMesh(5, 1);
      rightMesh.position.set(0, a / 2, 0);
      rightMesh.rotation.y = Math.PI / 2;
      rightPivot.add(rightMesh);
      rightPivot.rotation.z = foldAngle;

      // Front Face (1) - hinged on Right south! (In 2D: below Right)
      const frontPivot = new THREE.Group();
      frontPivot.position.set(0, 0, a / 2);
      const frontMesh = createFaceMesh(1, 0);
      frontMesh.position.set(0, a / 2, 0);
      frontMesh.rotation.y = Math.PI / 2;
      frontPivot.add(frontMesh);
      frontPivot.rotation.x = foldAngle;
      rightPivot.add(frontPivot);

      group.add(rightPivot);

      if (showClockwiseVertex) {
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        pin.position.set(0, a, 0.05);
        backPivot.add(pin);
      }
    }

    // -------------------------------------------------------------
    // Archetype 3: "2-2-2" 阶梯台阶型
    // -------------------------------------------------------------
    else if (netType === '2-2-2') {
      // Row 1: [Top(2)] [Back(3)]
      // Row 2:          [Left(4)] [Bottom(0)]
      // Row 3:                    [Front(1)] [Right(5)]

      // Base Bottom (0)
      const baseMesh = createFaceMesh(0, 2);
      baseMesh.rotation.x = Math.PI / 2;
      baseMesh.position.set(0, -a / 2, 0);
      group.add(baseMesh);

      // Left Face (4) - hinged on Base west
      const leftPivot = new THREE.Group();
      leftPivot.position.set(-a / 2, -a / 2, 0);
      const leftMesh = createFaceMesh(4, 1);
      leftMesh.position.set(0, a / 2, 0);
      leftMesh.rotation.y = -Math.PI / 2;
      leftPivot.add(leftMesh);
      leftPivot.rotation.z = -foldAngle;

      // Back Face (3) - hinged on Left north
      const backPivot = new THREE.Group();
      backPivot.position.set(0, a, 0);
      const backMesh = createFaceMesh(3, 0);
      backMesh.position.set(0, a / 2, 0);
      backMesh.rotation.y = Math.PI;
      backPivot.add(backMesh);
      backPivot.rotation.x = -foldAngle;

      // Top Face (2) - hinged on Back west
      const topPivot = new THREE.Group();
      topPivot.position.set(-a / 2, a / 2, 0);
      const topMesh = createFaceMesh(2, 2);
      topMesh.position.set(-a / 2, 0, 0);
      topPivot.add(topMesh);
      topPivot.rotation.y = -foldAngle;
      backPivot.add(topPivot);

      leftPivot.add(backPivot);
      group.add(leftPivot);

      // Front Face (1) - hinged on Base south
      const frontPivot = new THREE.Group();
      frontPivot.position.set(0, -a / 2, a / 2);
      const frontMesh = createFaceMesh(1, 0);
      frontMesh.position.set(0, a / 2, 0);
      frontPivot.add(frontMesh);
      frontPivot.rotation.x = foldAngle;

      // Right Face (5) - hinged on Front east
      const rightPivot = new THREE.Group();
      rightPivot.position.set(a / 2, a / 2, 0);
      const rightMesh = createFaceMesh(5, 1);
      rightMesh.position.set(a / 2, 0, 0);
      rightMesh.rotation.y = Math.PI / 2;
      rightPivot.add(rightMesh);
      rightPivot.rotation.y = foldAngle;
      frontPivot.add(rightPivot);

      group.add(frontPivot);
    }

    // -------------------------------------------------------------
    // Archetype 4: "3-3" 两排相错型
    // -------------------------------------------------------------
    else if (netType === '3-3') {
      // Row 1: [Top(2)] [Back(3)] [Left(4)]
      // Row 2:          [Bottom(0)] [Right(5)] [Front(1)]

      // Base Bottom (0)
      const baseMesh = createFaceMesh(0, 2);
      baseMesh.rotation.x = Math.PI / 2;
      baseMesh.position.set(0, -a / 2, 0);
      group.add(baseMesh);

      // Back Face (3) - hinged on Base north
      const backPivot = new THREE.Group();
      backPivot.position.set(0, -a / 2, -a / 2);
      const backMesh = createFaceMesh(3, 0);
      backMesh.position.set(0, a / 2, 0);
      backMesh.rotation.y = Math.PI;
      backPivot.add(backMesh);
      backPivot.rotation.x = -foldAngle;

      // Top Face (2) - hinged on Back west
      const topPivot = new THREE.Group();
      topPivot.position.set(-a / 2, a / 2, 0);
      const topMesh = createFaceMesh(2, 2);
      topMesh.position.set(-a / 2, 0, 0);
      topPivot.add(topMesh);
      topPivot.rotation.y = -foldAngle;
      backPivot.add(topPivot);

      // Left Face (4) - hinged on Back east
      const leftPivot = new THREE.Group();
      leftPivot.position.set(a / 2, a / 2, 0);
      const leftMesh = createFaceMesh(4, 1);
      leftMesh.position.set(a / 2, 0, 0);
      leftMesh.rotation.y = -Math.PI / 2;
      leftPivot.add(leftMesh);
      leftPivot.rotation.y = foldAngle;
      backPivot.add(leftPivot);

      group.add(backPivot);

      // Right Face (5) - hinged on Base east
      const rightPivot = new THREE.Group();
      rightPivot.position.set(a / 2, -a / 2, 0);
      const rightMesh = createFaceMesh(5, 1);
      rightMesh.position.set(0, a / 2, 0);
      rightMesh.rotation.y = Math.PI / 2;
      rightPivot.add(rightMesh);
      rightPivot.rotation.z = foldAngle;

      // Front Face (1) - hinged on Right east
      const frontPivot = new THREE.Group();
      frontPivot.position.set(0, a / 2, a / 2);
      const frontMesh = createFaceMesh(1, 0);
      frontMesh.position.set(0, a / 2, 0);
      frontMesh.rotation.y = Math.PI / 2;
      frontPivot.add(frontMesh);
      frontPivot.rotation.x = foldAngle;
      rightPivot.add(frontPivot);

      group.add(rightPivot);
    }
  }, [netType, foldProgress, highlightOpposite, showClockwiseVertex, faceTextures]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* 3D Canvas */}
      <div className="relative w-full h-[40vh] min-h-[250px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Floating Top Archetype Selector */}
        <div className="absolute top-2 left-2 right-2 flex overflow-x-auto no-scrollbar gap-1.5 z-10">
          <button
            onClick={() => { setNetType('1-4-1'); setFoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              netType === '1-4-1'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            ⭐ 1-4-1型 (经典十字 · 6种)
          </button>
          <button
            onClick={() => { setNetType('2-3-1'); setFoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              netType === '2-3-1'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            📐 2-3-1型 (楼梯拐角 · 3种)
          </button>
          <button
            onClick={() => { setNetType('2-2-2'); setFoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              netType === '2-2-2'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            🪜 2-2-2型 (阶梯台阶 · 1种)
          </button>
          <button
            onClick={() => { setNetType('3-3'); setFoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              netType === '3-3'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            🔀 3-3型 (两排错开 · 1种)
          </button>
        </div>

        {/* Bottom Folding Slider Controls */}
        <div className="absolute bottom-2 left-2 right-2 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10">
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>当前模式: <strong className="text-indigo-300 font-mono">{netType}型</strong></span>
              <span className="text-slate-400">
                {foldProgress <= 0.05 ? '【平面展开】' : foldProgress >= 0.95 ? '【折成立体】' : '【折叠中】'}
              </span>
            </span>
            <span className="font-mono text-indigo-400 font-bold text-xs">
              {(foldProgress * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-colors flex-shrink-0"
              title={isPlaying ? '暂停' : '自动折起'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setFoldProgress(0); }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0"
            >
              平铺
            </button>

            <button
              onClick={() => { setIsPlaying(false); setFoldProgress(1); }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors flex-shrink-0"
            >
              成盒
            </button>

            <button
              onClick={() => { setIsPlaying(false); setFoldProgress(0.2); }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
              title="复位视角"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={foldProgress}
              onChange={(e) => {
                setIsPlaying(false);
                setFoldProgress(parseFloat(e.target.value));
              }}
              className="flex-1 accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>旋转 3D 视角观察图案闭合</span>
        </div>
      </div>

      {/* Right Control & Theory Panel */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base lg:text-lg font-bold text-white flex items-center gap-1.5">
              <span>📦 正方体全部 11 种展开构型透视</span>
            </h2>
            <button
              onClick={() => setShowCatalog(!showCatalog)}
              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{showCatalog ? '折叠图鉴' : '11种图鉴'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            正方体展开图绝非千变万化，<strong>全世界只有 11 种合法形态</strong>！牢记“一四一六、二三一三、二二二台阶、三三错开”即通关。
          </p>
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
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
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
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
      </div>
    </div>
  );
};
