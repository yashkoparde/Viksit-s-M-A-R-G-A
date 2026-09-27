import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type CameraPreset = 'overview' | 'geotag' | 'constellation';

interface CinematicCanvas3DProps {
  preset?: CameraPreset;
  interactive?: boolean;
  scrollProgress?: number;
}

export const CinematicCanvas3D: React.FC<CinematicCanvas3DProps> = ({
  preset = 'overview',
  interactive = true,
  scrollProgress = 0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fpsReady, setFpsReady] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(false);
  const scrollRef = useRef<number>(scrollProgress);

  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let animationFrameId: number;

    const width = container.clientWidth || window.innerWidth || 800;
    const height = container.clientHeight || window.innerHeight || 600;

    try {
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xf8fafc, 0.0012);

      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 15, 65);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0xf8fafc, 0); // Transparent overlay
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('[CinematicCanvas3D] WebGL not supported or failed to initialize:', err);
      setHasWebGlError(true);
      return;
    }

    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // =========================================================================
    // 1. Holographic Constituency Globe (Geodesic Wireframe + Subtle Core)
    // =========================================================================
    const globeRadius = 18;
    
    // Wireframe Outer Mesh (Sleek Indigo/Slate with delicate opacity for overlay)
    const globeGeom = new THREE.IcosahedronGeometry(globeRadius, 4);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x4f46e5,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const globeMesh = new THREE.Mesh(globeGeom, globeMat);
    worldGroup.add(globeMesh);

    // Inner Glowing Core (Delicate light tint)
    const coreGeom = new THREE.SphereGeometry(globeRadius * 0.95, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9,
      transparent: true,
      opacity: 0.15,
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    worldGroup.add(coreMesh);

    // =========================================================================
    // 2. Parliamentary Geo-Nodes
    // =========================================================================
    const nodeCoords = [
      { lat: 28.6139, lon: 77.2090, label: 'New Delhi (Parliament)' },
      { lat: 12.2958, lon: 76.6394, label: 'Mysuru (MPLADS Focus)' },
      { lat: 12.9716, lon: 77.5946, label: 'Bengaluru' },
      { lat: 19.0760, lon: 72.8777, label: 'Mumbai' },
      { lat: 22.5726, lon: 88.3639, label: 'Kolkata' },
      { lat: 13.0827, lon: 80.2707, label: 'Chennai' },
      { lat: 26.8467, lon: 80.9462, label: 'Lucknow' },
      { lat: 23.0225, lon: 72.5714, label: 'Ahmedabad' },
      { lat: 25.5941, lon: 85.1376, label: 'Patna' },
      { lat: 31.6340, lon: 74.8723, label: 'Amritsar' },
      { lat: 17.3850, lon: 78.4867, label: 'Hyderabad' },
      { lat: 15.3173, lon: 75.7139, label: 'Hubballi-Dharwad' },
    ];

    const convertGeoToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const nodePositions: THREE.Vector3[] = [];
    const nodeInstancesGeom = new THREE.SphereGeometry(0.5, 12, 12);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x4f46e5 });
    const mysoreMaterial = new THREE.MeshBasicMaterial({ color: 0x059669 });

    nodeCoords.forEach((item) => {
      const pos = convertGeoToVector3(item.lat, item.lon, globeRadius * 1.01);
      nodePositions.push(pos);

      const isMysuru = item.label.includes('Mysuru');
      const mesh = new THREE.Mesh(
        nodeInstancesGeom, 
        isMysuru ? mysoreMaterial : nodeMaterial
      );
      mesh.position.copy(pos);
      worldGroup.add(mesh);

      // Radiating ring around key node
      const ringGeom = new THREE.RingGeometry(0.65, 1.0, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isMysuru ? 0x059669 : 0x4f46e5,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      worldGroup.add(ring);
    });

    // Spline curves connecting Delhi to regional nodes
    const delhiPos = nodePositions[0];
    if (delhiPos) {
      for (let i = 1; i < nodePositions.length; i++) {
        const dest = nodePositions[i];
        const mid = delhiPos.clone().add(dest).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(globeRadius * 1.35);

        const curve = new THREE.QuadraticBezierCurve3(delhiPos, mid, dest);
        const points = curve.getPoints(30);
        const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
        const arcMat = new THREE.LineBasicMaterial({
          color: i === 1 ? 0x059669 : 0x6366f1,
          transparent: true,
          opacity: 0.35,
          linewidth: 1.5,
        });
        const arcLine = new THREE.Line(arcGeom, arcMat);
        worldGroup.add(arcLine);
      }
    }

    // =========================================================================
    // 3. Orbiting Satellite Rings
    // =========================================================================
    const ringRadius1 = globeRadius * 1.45;
    const ringGeom1 = new THREE.TorusGeometry(ringRadius1, 0.05, 8, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.18,
    });
    const orbitRing1 = new THREE.Mesh(ringGeom1, ringMat1);
    orbitRing1.rotation.x = Math.PI / 3;
    worldGroup.add(orbitRing1);

    const ringRadius2 = globeRadius * 1.6;
    const ringGeom2 = new THREE.TorusGeometry(ringRadius2, 0.04, 8, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.15,
    });
    const orbitRing2 = new THREE.Mesh(ringGeom2, ringMat2);
    orbitRing2.rotation.x = -Math.PI / 4;
    orbitRing2.rotation.y = Math.PI / 6;
    worldGroup.add(orbitRing2);

    const satGeom = new THREE.BoxGeometry(0.7, 0.4, 1.0);
    const satMat = new THREE.MeshBasicMaterial({ color: 0x4f46e5 });
    const satellite1 = new THREE.Mesh(satGeom, satMat);
    worldGroup.add(satellite1);

    const satellite2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 8, 8), 
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    worldGroup.add(satellite2);

    // =========================================================================
    // 4. Starlight Particle Field
    // =========================================================================
    const particleCount = 900;
    const particleCoords = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 40 + Math.random() * 110;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particleCoords[i] = r * Math.sin(phi) * Math.cos(theta);
      particleCoords[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      particleCoords[i + 2] = r * Math.cos(phi);

      particleColors[i] = 0.55;
      particleColors[i + 1] = 0.60;
      particleColors[i + 2] = 0.68;
    }

    const particlesGeom = new THREE.BufferGeometry();
    particlesGeom.setAttribute('position', new THREE.BufferAttribute(particleCoords, 3));
    particlesGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particlesMat = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      sizeAttenuation: true,
    });
    const particleSystem = new THREE.Points(particlesGeom, particlesMat);
    scene.add(particleSystem);

    // =========================================================================
    // 5. Mouse Parallax & Smooth Inertial Tracking
    // =========================================================================
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth || 800;
      const h = container.clientHeight || window.innerHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // =========================================================================
    // 6. Animation Loop: Scroll-Responsive Camera Trajectory
    // =========================================================================
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const sProgress = scrollRef.current || 0;

      // Rotate globe continuously + responsive to vertical scroll
      worldGroup.rotation.y = elapsedTime * 0.05 + sProgress * Math.PI * 1.5;
      globeMesh.rotation.x = Math.sin(elapsedTime * 0.08) * 0.04 + sProgress * 0.3;

      particleSystem.rotation.y = -elapsedTime * 0.015;
      particleSystem.rotation.x = Math.cos(elapsedTime * 0.01) * 0.02;

      // Satellites orbital motion
      const sat1Angle = elapsedTime * 0.4;
      satellite1.position.x = Math.cos(sat1Angle) * ringRadius1;
      satellite1.position.z = Math.sin(sat1Angle) * ringRadius1;
      satellite1.position.y = Math.sin(sat1Angle * 2) * 4;
      satellite1.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 3);

      const sat2Angle = -elapsedTime * 0.3;
      satellite2.position.x = Math.cos(sat2Angle) * ringRadius2;
      satellite2.position.z = Math.sin(sat2Angle) * ringRadius2;
      satellite2.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 4);

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Scroll-based camera positioning & parallax
      const targetCamZ = 62 - sProgress * 18;
      const targetCamY = 14 + sProgress * 12 + mouse.y * 12;
      const targetCamX = mouse.x * 20 + Math.sin(sProgress * Math.PI) * 10;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;
      camera.position.y += (targetCamY - camera.position.y) * 0.05;
      camera.position.z += (targetCamZ - camera.position.z) * 0.05;

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();
    setFpsReady(true);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
      globeGeom.dispose();
      globeMat.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      particlesGeom.dispose();
      particlesMat.dispose();
    };
  }, [preset, interactive]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      <div ref={containerRef} className="w-full h-full" />
      
      {hasWebGlError && (
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/40 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-emerald-500/10 to-sky-500/10 blur-3xl opacity-60 animate-pulse" />
        </div>
      )}
    </div>
  );
};
