import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Play, Pause, RotateCcw, Eye, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { MathView } from './MathView';

interface UnfoldingViewerProps {
  initialMode?: 'cylinder' | 'cube' | 'cone';
  initialParams?: Record<string, number | string>;
}

export const UnfoldingViewer: React.FC<UnfoldingViewerProps> = ({
  initialMode = 'cylinder',
  initialParams = {},
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [modelType, setModelType] = useState<'cylinder' | 'cube' | 'cone'>(initialMode);

  // Cylinder parameters
  const [radius, setRadius] = useState<number>(Number(initialParams.radius) || 2);
  const [height, setHeight] = useState<number>(Number(initialParams.height) || 6);
  const [turns, setTurns] = useState<number>(Number(initialParams.turns) || 0.5); // 0.5 for opposite side, 1.0 for full circle

  // Cube parameters
  const [cubeEdge, setCubeEdge] = useState<number>(Number(initialParams.edge) || 3);
  const [cubePathMode, setCubePathMode] = useState<'surface' | 'edges' | 'space'>('surface');

  // Cone parameters
  const [coneRadius, setConeRadius] = useState<number>(Number(initialParams.radius) || 2);
  const [slantHeight, setSlantHeight] = useState<number>(Number(initialParams.slantHeight) || 6);

  // Common animation state
  const [unfoldProgress, setUnfoldProgress] = useState<number>(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Refs for 3D engine
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Synchronize when initialParams change
  useEffect(() => {
    if (initialParams.mode && typeof initialParams.mode === 'string') {
      setModelType(initialParams.mode as any);
    }
    if (initialParams.radius) setRadius(Number(initialParams.radius));
    if (initialParams.height) setHeight(Number(initialParams.height));
    if (initialParams.turns) setTurns(Number(initialParams.turns));
    if (initialParams.edge) setCubeEdge(Number(initialParams.edge));
    if (initialParams.slantHeight) setSlantHeight(Number(initialParams.slantHeight));
    setUnfoldProgress(0);
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
    camera.position.set(9, 8, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go far below ground
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight1.position.set(10, 20, 15);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 0.5);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(24, 24, 0x334155, 0x1e293b);
    grid.position.y = -3.5;
    scene.add(grid);

    // Dynamic object group
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    // Animation Loop
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

  // Auto-play animation handling
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const step = () => {
      setUnfoldProgress((prev) => {
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

  // Re-build 3D Model when parameters or unfoldProgress change
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    // Clear previous dynamic meshes
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

    const u = unfoldProgress; // 0 (closed) to 1 (flat)

    if (modelType === 'cylinder') {
      buildCylinderUnfold(group, radius, height, turns, u);
    } else if (modelType === 'cube') {
      buildCubeUnfold(group, cubeEdge, u, cubePathMode);
    } else if (modelType === 'cone') {
      buildConeUnfold(group, coneRadius, slantHeight, u);
    }
  }, [modelType, radius, height, turns, cubeEdge, cubePathMode, coneRadius, slantHeight, unfoldProgress]);

  // Cylinder unfolding procedural mesh builder
  const buildCylinderUnfold = (
    group: THREE.Group,
    r: number,
    h: number,
    turnFraction: number,
    u: number
  ) => {
    const segmentsTheta = 80;
    const segmentsH = 20;
    const totalCircumference = 2 * Math.PI * r;
    const maxTheta = 2 * Math.PI;

    // Lateral Surface Geometry
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Helper: Map (theta, yNorm) to 3D position based on peel-off parameter u
    // u = 0: normal cylinder: x = r * sin(theta), z = r * (1 - cos(theta)), y = y
    // As u increases from 0 to 1, a portion theta in [0, maxTheta * u] unrolls onto flat plane Z = 0
    const getPos = (theta: number, yVal: number) => {
      const splitTheta = maxTheta * u;
      let x = 0;
      let z = 0;
      if (theta <= splitTheta) {
        // Flat part on table
        x = theta * r;
        z = 0;
      } else {
        // Curled cylinder part rolling along
        const angle = theta - splitTheta;
        x = splitTheta * r + r * Math.sin(angle);
        z = r * (1 - Math.cos(angle));
      }
      // Offset so the whole shape stays centered on X axis
      const centerOffsetX = (totalCircumference * u) / 2;
      return new THREE.Vector3(x - centerOffsetX, yVal, z);
    };

    for (let i = 0; i <= segmentsTheta; i++) {
      const theta = (i / segmentsTheta) * maxTheta;
      for (let j = 0; j <= segmentsH; j++) {
        const yNorm = j / segmentsH;
        const yVal = -h / 2 + yNorm * h;
        const p = getPos(theta, yVal);
        positions.push(p.x, p.y, p.z);
        uvs.push(i / segmentsTheta, yNorm);
      }
    }

    const rowSize = segmentsH + 1;
    for (let i = 0; i < segmentsTheta; i++) {
      for (let j = 0; j < segmentsH; j++) {
        const a = i * rowSize + j;
        const b = (i + 1) * rowSize + j;
        const c = (i + 1) * rowSize + (j + 1);
        const d = i * rowSize + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    // Wireframe overlay for visual clarity
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireMesh = new THREE.Mesh(geom, wireMat);
    group.add(wireMesh);

    // Caps (Top and Bottom disks) - disappear as it unfolds to focus on lateral surface
    if (u < 0.95) {
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: (1 - u) * 0.7,
        side: THREE.DoubleSide,
      });
      const topCapGeom = new THREE.CircleGeometry(r, 48);
      topCapGeom.rotateX(-Math.PI / 2);
      const topCap = new THREE.Mesh(topCapGeom, capMat);
      topCap.position.set(totalCircumference * u * 0.5, h / 2, r);
      group.add(topCap);

      const botCap = topCap.clone();
      botCap.position.y = -h / 2;
      group.add(botCap);
    }

    // Shortest Path curve (Ant Crawling Path)
    // From (0, -h/2) to (turnFraction * maxTheta, h/2)
    const pathPoints: THREE.Vector3[] = [];
    const pathSamples = 100;
    const targetTheta = turnFraction * 2 * Math.PI;

    for (let s = 0; s <= pathSamples; s++) {
      const t = s / pathSamples;
      const th = t * targetTheta;
      const y = -h / 2 + t * h;
      const p = getPos(th, y);
      // lift slightly along normal/Z to prevent z-fighting
      p.z += 0.04;
      pathPoints.push(p);
    }

    const pathGeom = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMat = new THREE.LineBasicMaterial({
      color: 0xef4444, // Bright Red
      linewidth: 4,
    });
    const pathLine = new THREE.Line(pathGeom, pathMat);
    group.add(pathLine);

    // Start Point A (Green)
    const pStart = pathPoints[0];
    const pEnd = pathPoints[pathPoints.length - 1];

    const sphereGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const startMesh = new THREE.Mesh(
      sphereGeom,
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d })
    );
    startMesh.position.copy(pStart);
    group.add(startMesh);

    // End Point B (Amber)
    const endMesh = new THREE.Mesh(
      sphereGeom,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 })
    );
    endMesh.position.copy(pEnd);
    group.add(endMesh);
  };

  // Cube unfolding builder
  const buildCubeUnfold = (
    group: THREE.Group,
    a: number,
    u: number,
    pathMode: 'surface' | 'edges' | 'space'
  ) => {
    // Face hinges: Bottom face fixed at center (0, -a/2, 0)
    // 5 other faces fold open around edges
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const wireMat = new THREE.LineBasicMaterial({ color: 0x4f46e5, linewidth: 2 });

    const createFace = () => {
      const planeGeom = new THREE.PlaneGeometry(a, a);
      const m = new THREE.Mesh(planeGeom, faceMat);
      const edges = new THREE.EdgesGeometry(planeGeom);
      const wire = new THREE.LineSegments(edges, wireMat);
      m.add(wire);
      return m;
    };

    // Bottom Face (Fixed on ground)
    const bottomFace = createFace();
    bottomFace.rotation.x = Math.PI / 2;
    bottomFace.position.set(0, -a / 2, 0);
    group.add(bottomFace);

    // Front Face (folds forward)
    const frontPivot = new THREE.Group();
    frontPivot.position.set(0, -a / 2, a / 2);
    const frontFace = createFace();
    frontFace.position.set(0, a / 2, 0);
    frontPivot.add(frontFace);
    frontPivot.rotation.x = u * (Math.PI / 2); // 0 -> 90 deg down
    group.add(frontPivot);

    // Back Face (folds backward)
    const backPivot = new THREE.Group();
    backPivot.position.set(0, -a / 2, -a / 2);
    const backFace = createFace();
    backFace.position.set(0, a / 2, 0);
    backPivot.add(backFace);
    backPivot.rotation.x = -u * (Math.PI / 2);
    group.add(backPivot);

    // Left Face (folds left)
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-a / 2, -a / 2, 0);
    const leftFace = createFace();
    leftFace.position.set(0, a / 2, 0);
    leftFace.rotation.y = Math.PI / 2;
    leftPivot.add(leftFace);
    leftPivot.rotation.z = u * (Math.PI / 2);
    group.add(leftPivot);

    // Right Face (folds right)
    const rightPivot = new THREE.Group();
    rightPivot.position.set(a / 2, -a / 2, 0);
    const rightFace = createFace();
    rightFace.position.set(0, a / 2, 0);
    rightFace.rotation.y = -Math.PI / 2;
    rightPivot.add(rightFace);
    rightPivot.rotation.z = -u * (Math.PI / 2);

    // Top Face (hinged to top edge of Right Face: 100% closed at u=0, unfolds flat at u=1)
    const topPivot = new THREE.Group();
    topPivot.position.set(0, a, 0);
    topPivot.rotation.z = (1 - u) * (Math.PI / 2);
    const topFace = createFace();
    topFace.position.set(0, a / 2, 0);
    topFace.rotation.y = -Math.PI / 2;
    topPivot.add(topFace);

    // Marker for Point B on Top Face corner
    const markerB = new THREE.Object3D();
    markerB.position.set(-a / 2, -a / 2, 0);
    topFace.add(markerB);

    rightPivot.add(topPivot);
    group.add(rightPivot);

    // Shortest path: Corner A (bottom-left-front) to Corner B (opposite on top face)
    const pStart = new THREE.Vector3(-a / 2, -a / 2, a / 2); // Point A

    // Point B dynamically tracks the moving top face in world coordinates!
    group.updateMatrixWorld(true);
    const pEnd = new THREE.Vector3();
    markerB.getWorldPosition(pEnd);

    if (pathMode === 'surface') {
      // Point on the shared right hinge edge (a/2, -a/2, 0)
      const midPoint = new THREE.Vector3(a / 2, -a / 2, 0);
      const lineGeom = new THREE.BufferGeometry().setFromPoints([pStart, midPoint, pEnd]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 });
      group.add(new THREE.Line(lineGeom, lineMat));
    } else if (pathMode === 'edges') {
      // Edges route: A -> corner -> corner -> B (length 3a)
      const c1 = new THREE.Vector3(a / 2, -a / 2, a / 2);
      const c2 = new THREE.Vector3(a / 2, -a / 2 + (1 - u) * a, a / 2);
      const lineGeom = new THREE.BufferGeometry().setFromPoints([pStart, c1, c2, pEnd]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 3 });
      group.add(new THREE.Line(lineGeom, lineMat));
    } else {
      // Direct 3D space diagonal (length sqrt(3) a)
      const lineGeom = new THREE.BufferGeometry().setFromPoints([pStart, pEnd]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 3 });
      group.add(new THREE.Line(lineGeom, lineMat));
    }

    // Points
    const ptGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const startMesh = new THREE.Mesh(
      ptGeom,
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x15803d })
    );
    startMesh.position.copy(pStart);
    group.add(startMesh);

    const endMesh = new THREE.Mesh(
      ptGeom,
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 })
    );
    endMesh.position.copy(pEnd);
    group.add(endMesh);
  };

  // Cone unfolding builder
  const buildConeUnfold = (
    group: THREE.Group,
    r: number,
    R_slant: number,
    u: number
  ) => {
    // Valid cone check: R_slant > r
    const validR = Math.max(R_slant, r + 0.1);
    const coneH = Math.sqrt(validR * validR - r * r);
    const sectorAngle = (r / validR) * 2 * Math.PI; // in radians

    // Cone Lateral Surface Unfolding
    const segmentsTheta = 60;
    const segmentsH = 20;
    const positions: number[] = [];
    const indices: number[] = [];

    // Parametric blend between 3D Cone and 2D Sector
    // For 3D cone: Apex at (0, coneH/2, 0). Base center at (0, -coneH/2, 0).
    // Radius at s in [0, 1] is s * r.
    for (let i = 0; i <= segmentsTheta; i++) {
      const frac = i / segmentsTheta;
      const th3D = frac * 2 * Math.PI;
      const thSector = frac * sectorAngle - sectorAngle / 2;

      for (let j = 0; j <= segmentsH; j++) {
        const s = j / segmentsH; // 0 = apex, 1 = base edge

        // 3D cone pos
        const x3D = s * r * Math.sin(th3D);
        const y3D = coneH / 2 - s * coneH;
        const z3D = s * r * Math.cos(th3D);

        // 2D flat sector pos (Apex at (0, validR/2, 0), extends downwards)
        const x2D = s * validR * Math.sin(thSector);
        const y2D = validR / 2 - s * validR * Math.cos(thSector);
        const z2D = 0;

        // Linear interpolation
        const x = (1 - u) * x3D + u * x2D;
        const y = (1 - u) * y3D + u * y2D;
        const z = (1 - u) * z3D + u * z2D;
        positions.push(x, y, z);
      }
    }

    const rowSize = segmentsH + 1;
    for (let i = 0; i < segmentsTheta; i++) {
      for (let j = 0; j < segmentsH; j++) {
        const a = i * rowSize + j;
        const b = (i + 1) * rowSize + j;
        const c = (i + 1) * rowSize + (j + 1);
        const d = i * rowSize + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(geom, mat));

    // Wireframe
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    group.add(new THREE.Mesh(geom, wireMat));

    // Shortest path: Crawl around the cone back to start point
    // On unfolded sector, it's the straight chord connecting (s=1, th=0) to (s=1, th=sectorAngle)
    const chordPoints: THREE.Vector3[] = [];
    const chordSamples = 60;
    for (let k = 0; k <= chordSamples; k++) {
      const t = k / chordSamples;
      // In 2D sector polar coords: line between (R, -sectorAngle/2) and (R, sectorAngle/2)
      // Lerp on the unrolled plane:
      const x2D = (1 - t) * (validR * Math.sin(-sectorAngle / 2)) + t * (validR * Math.sin(sectorAngle / 2));
      const y2D = (1 - t) * (validR / 2 - validR * Math.cos(-sectorAngle / 2)) + t * (validR / 2 - validR * Math.cos(sectorAngle / 2));

      // Map back to 3D cone coords
      // Polar distance from apex (0, validR/2):
      const distFromApex = Math.hypot(x2D, validR / 2 - y2D);
      const currentAngSector = Math.atan2(x2D, validR / 2 - y2D);
      const frac = (currentAngSector + sectorAngle / 2) / sectorAngle;
      const th3D = frac * 2 * Math.PI;
      const s3D = Math.min(Math.max(distFromApex / validR, 0), 1);

      const x3D = s3D * r * Math.sin(th3D);
      const y3D = coneH / 2 - s3D * coneH;
      const z3D = s3D * r * Math.cos(th3D);

      const px = (1 - u) * x3D + u * x2D;
      const py = (1 - u) * y3D + u * y2D;
      const pz = (1 - u) * z3D + u * 0.05;
      chordPoints.push(new THREE.Vector3(px, py, pz));
    }

    const chordGeom = new THREE.BufferGeometry().setFromPoints(chordPoints);
    const chordMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 });
    group.add(new THREE.Line(chordGeom, chordMat));

    // Apex Point
    const ptGeom = new THREE.SphereGeometry(0.16, 16, 16);
    const apexMesh = new THREE.Mesh(
      ptGeom,
      new THREE.MeshStandardMaterial({ color: 0x6366f1 })
    );
    apexMesh.position.set(0, (1 - u) * (coneH / 2) + u * (validR / 2), 0);
    group.add(apexMesh);
  };

  // Calculations for current model
  const cylinderCalcs = useMemo(() => {
    const C = 2 * Math.PI * radius;
    const deltaX = turns * C;
    const shortestDist = Math.sqrt(deltaX * deltaX + height * height);
    return { C, deltaX, shortestDist };
  }, [radius, height, turns]);

  const cubeCalcs = useMemo(() => {
    const surfaceDist = Math.sqrt(Math.pow(2 * cubeEdge, 2) + Math.pow(cubeEdge, 2));
    const edgesDist = 3 * cubeEdge;
    const spaceDiag = Math.sqrt(3) * cubeEdge;
    return { surfaceDist, edgesDist, spaceDiag };
  }, [cubeEdge]);

  const coneCalcs = useMemo(() => {
    const validR = Math.max(slantHeight, coneRadius + 0.1);
    const sectorAngleDeg = (coneRadius / validR) * 360;
    const sectorAngleRad = (coneRadius / validR) * 2 * Math.PI;
    const chordDist = 2 * validR * Math.sin(sectorAngleRad / 2);
    return { sectorAngleDeg, chordDist, validR };
  }, [coneRadius, slantHeight]);

  return (
    <div className="flex flex-col lg:flex-row w-full h-[calc(100dvh-5.5rem)] lg:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* 3D Canvas Area */}
      <div className="relative w-full h-[40vh] min-h-[250px] lg:h-full lg:flex-1 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex-shrink-0">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

        {/* Top Floating Controls */}
        <div className="absolute top-2 left-2 right-2 flex overflow-x-auto no-scrollbar gap-1.5 z-10">
          <button
            onClick={() => { setModelType('cylinder'); setUnfoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              modelType === 'cylinder'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 ring-1 ring-sky-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            🥫 圆柱表面展开
          </button>
          <button
            onClick={() => { setModelType('cube'); setUnfoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              modelType === 'cube'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            📦 正方体跨面
          </button>
          <button
            onClick={() => { setModelType('cone'); setUnfoldProgress(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium backdrop-blur-md transition-all whitespace-nowrap ${
              modelType === 'cone'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-1 ring-emerald-400'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            🍦 圆锥扇形
          </button>
        </div>

        {/* Bottom Progress Floating Bar */}
        <div className="absolute bottom-2 left-2 right-2 max-w-xl mx-auto bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/70 shadow-2xl z-10">
          <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
            <span className="font-semibold text-slate-200 text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>展开进程</span>
            </span>
            <span className="font-mono text-sky-400 font-bold text-xs">
              {(unfoldProgress * 100).toFixed(0)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white shadow-md shadow-sky-500/30 transition-colors flex-shrink-0"
              title={isPlaying ? '暂停' : '自动播放'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setUnfoldProgress(0); }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
              title="复位至立体状态"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={unfoldProgress}
              onChange={(e) => {
                setIsPlaying(false);
                setUnfoldProgress(parseFloat(e.target.value));
              }}
              className="flex-1 accent-sky-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Instructions pill */}
        <div className="absolute top-2 right-2 hidden sm:flex items-center gap-1 px-2 py-0.5 bg-slate-800/80 backdrop-blur-md border border-slate-700 text-[10px] text-slate-400 rounded-lg">
          <Eye className="w-3 h-3 text-slate-400" />
          <span>旋转 3D 视角 · 滚轮缩放</span>
        </div>
      </div>

      {/* Right Control & Theory Panel */}
      <div className="w-full lg:w-96 xl:w-[28rem] flex-1 lg:h-full overflow-y-auto p-4 lg:p-5 flex flex-col gap-4 text-sm pb-10">
        {/* Model Specific Header */}
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {modelType === 'cylinder' && '🥫 圆柱表面最短爬行路径'}
            {modelType === 'cube' && '📦 正方体跨面展开与路径对比'}
            {modelType === 'cone' && '🍦 圆锥母线与侧面展开扇形'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {modelType === 'cylinder' && '公考高频母题：将曲面剥开铺平，空间螺旋轨迹直接拉直成直角三角形斜边。'}
            {modelType === 'cube' && '两面展开法：避开“体对角线（蚂蚁不会飞）”与“沿棱走折线”的常考陷阱。'}
            {modelType === 'cone' && '核心在圆心角：利用 α = 360° × (r/R) 确定展开图形，瞬间口算最短弦长。'}
          </p>
        </div>

        {/* Dynamic Parameter Tuning Controls */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>几何参数微调</span>
            <span className="text-[11px] text-slate-500">动态实时解算</span>
          </div>

          {modelType === 'cylinder' && (
            <>
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>底面半径 r: <strong className="text-sky-400 font-mono">{radius}</strong></span>
                  <span>周长 C: <strong className="text-slate-300 font-mono">{(2 * Math.PI * radius).toFixed(2)}</strong></span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={radius}
                  onChange={(e) => setRadius(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>圆柱高度 h: <strong className="text-sky-400 font-mono">{height}</strong></span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="0.5"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value))}
                  className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">爬行圈数目标：</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTurns(0.5)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      turns === 0.5
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    半圈（正对面点）
                  </button>
                  <button
                    onClick={() => setTurns(1.0)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                      turns === 1.0
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    整圈（绕行回到上方）
                  </button>
                </div>
              </div>
            </>
          )}

          {modelType === 'cube' && (
            <>
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>正方体棱长 a: <strong className="text-indigo-400 font-mono">{cubeEdge}</strong></span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5"
                  step="0.5"
                  value={cubeEdge}
                  onChange={(e) => setCubeEdge(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">路径路线对比：</label>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setCubePathMode('surface')}
                    className={`text-left p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                      cubePathMode === 'surface'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🔴 表面最短路线 (两面展开)</span>
                    <span className="font-mono text-emerald-400 font-bold">{cubeCalcs.surfaceDist.toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setCubePathMode('edges')}
                    className={`text-left p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                      cubePathMode === 'edges'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🟡 沿棱长折线走 (3条棱)</span>
                    <span className="font-mono text-yellow-400 font-bold">{cubeCalcs.edgesDist.toFixed(2)}</span>
                  </button>
                  <button
                    onClick={() => setCubePathMode('space')}
                    className={`text-left p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ${
                      cubePathMode === 'space'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🟣 空间体对角线 (非表面爬行)</span>
                    <span className="font-mono text-purple-400 font-bold">{cubeCalcs.spaceDiag.toFixed(2)}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {modelType === 'cone' && (
            <>
              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>底面半径 r: <strong className="text-emerald-400 font-mono">{coneRadius}</strong></span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.5"
                  value={coneRadius}
                  onChange={(e) => setConeRadius(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 text-slate-400">
                  <span>母线长 R: <strong className="text-emerald-400 font-mono">{slantHeight}</strong></span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="8"
                  step="0.5"
                  value={slantHeight}
                  onChange={(e) => setSlantHeight(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </>
          )}
        </div>

        {/* Calculation & Formula Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>实时计算与秒杀推导</span>
          </div>

          {modelType === 'cylinder' && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">展开长方形水平宽度：</span>
                <span className="font-mono font-bold text-sky-300">
                  {turns === 0.5 ? 'π × r' : '2π × r'} = {cylinderCalcs.deltaX.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">展开垂直落差高度：</span>
                <span className="font-mono font-bold text-slate-200">{height}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">最短爬行距离 L:</span>
                <span className="font-mono font-bold text-red-400 text-base">
                  {cylinderCalcs.shortestDist.toFixed(2)}
                </span>
              </div>
              <MathView
                math={`L = \\sqrt{(${cylinderCalcs.deltaX.toFixed(2)})^2 + (${height})^2} \\approx ${cylinderCalcs.shortestDist.toFixed(2)}`}
                block
                className="text-xs text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80"
              />
            </div>
          )}

          {modelType === 'cube' && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">两面展开直角边 1:</span>
                <span className="font-mono font-bold text-indigo-300">2a = {2 * cubeEdge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">两面展开直角边 2:</span>
                <span className="font-mono font-bold text-indigo-300">a = {cubeEdge}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">表面最短距离:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  √5 a ≈ {cubeCalcs.surfaceDist.toFixed(2)}
                </span>
              </div>
              <MathView
                math={`L = \\sqrt{(2a)^2 + a^2} = \\sqrt{5}a \\approx ${cubeCalcs.surfaceDist.toFixed(2)}`}
                block
                className="text-xs text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80"
              />
            </div>
          )}

          {modelType === 'cone' && (
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">扇形展开圆心角 α:</span>
                <span className="font-mono font-bold text-emerald-300">
                  {coneCalcs.sectorAngleDeg.toFixed(1)}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">展开扇形两腰长:</span>
                <span className="font-mono font-bold text-slate-200">R = {slantHeight}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm">
                <span className="font-bold text-white">闭合绕行最短距离:</span>
                <span className="font-mono font-bold text-red-400 text-base">
                  {coneCalcs.chordDist.toFixed(2)}
                </span>
              </div>
              <MathView
                math={`\\alpha = 360^\\circ \\times \\frac{${coneRadius}}{${slantHeight}} = ${coneCalcs.sectorAngleDeg.toFixed(0)}^\\circ \\implies L = 2R\\sin(\\frac{\\alpha}{2}) = ${coneCalcs.chordDist.toFixed(2)}`}
                block
                className="text-xs text-slate-400 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80"
              />
            </div>
          )}
        </div>

        {/* Public Exam Flashcard */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 leading-relaxed">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>公考秒杀避坑口诀</span>
          </div>
          {modelType === 'cylinder' && (
            <p>
              若题目说<strong>“爬到正对面”</strong>，切勿直接用整圈周长！只需走半个周长（横向 $\pi r$）。若题目是<strong>“内壁爬到外壁”</strong>，以杯口为折线翻折，纵向跨度为两点离杯口距离之和。
            </p>
          )}
          {modelType === 'cube' && (
            <p>
              绝对别选体对角线 $\sqrt{3}a$（那是空心穿透，蚂蚁只能在表面爬）；正方体从一个顶点到对角顶点的表面距离必为 $\sqrt{5}a$，永远牢记直角边是 $2a$ 和 $a$！
            </p>
          )}
          {modelType === 'cone' && (
            <p>
              圆锥侧面展开是扇形，最短路线是扇形的<strong>弦长</strong>。牢记特殊角：若 $r/R = 1/4$（角 90°），弦长为 $\sqrt{2}R$；若 $r/R = 1/6$（角 60°），弦长直接等于 $R$！
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
