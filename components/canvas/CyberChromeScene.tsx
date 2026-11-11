'use client';

import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/lib/store';
import { damp } from '@/lib/utils';
import { ChromeEnvironment } from './ChromeEnvironment';
import { Debris } from './Debris';
import { KeycapSphere } from './KeycapSphere';

/**
 * Feature flag for the 3D chains. Toggle to true to restore them instantly.
 * The implementation is untouched in ./Chains.tsx (archived copy: components/_drafts/Chains.backup.tsx).
 * While false, the chains, their physics world and their per-frame input handling are never
 * loaded or mounted, so they cost no download, CPU or GPU time.
 */
const ENABLE_CHAINS = false;

const ChainsLayer = ENABLE_CHAINS ? lazy(() => import('./ChainsLayer')) : null;

const SLATE = new THREE.Color('#E2E4E9');
const OBSIDIAN = new THREE.Color('#050507');

/** Drives fog, lights and camera from the shared motion state (act blend + scroll). */
const Director = () => {
  const { scene, camera } = useThree();

  useEffect(() => {
    scene.fog = new THREE.Fog(SLATE.clone(), 9, 26);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(SLATE).lerp(OBSIDIAN, motion.dark);
      scene.fog.near = 9 - motion.dark * 3;
    }
    // Dolly out of the hero, with an inertial drift toward the cursor.
    camera.position.x = damp(camera.position.x, motion.pointer.x * 0.35, 2, delta);
    camera.position.y = damp(camera.position.y, motion.pointer.y * 0.2 - motion.hero * 0.4, 2, delta);
    camera.position.z = damp(camera.position.z, 10 + motion.hero * 1.5, 3, delta);
    camera.lookAt(0, -motion.hero * 0.3, 0);
  });

  return null;
};

const RimLights = () => {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const fill = useRef<THREE.SpotLight>(null);

  useFrame(() => {
    if (key.current) key.current.intensity = 1.6 * (1 - motion.dark) + 0.15;
    if (rim.current) rim.current.intensity = 400 * motion.dark;
    if (fill.current) fill.current.intensity = 160 * motion.dark;
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight ref={key} position={[3, 6, 8]} />
      <spotLight ref={rim} color="#FF2A2A" position={[8, 4, -6]} angle={0.7} penumbra={1} distance={30} decay={1.4} />
      <spotLight ref={fill} color="#990000" position={[-8, -4, 2]} angle={0.8} penumbra={1} distance={30} decay={1.4} />
    </>
  );
};

/**
 * The fixed full-viewport WebGL layer behind the page: physical chrome chains,
 * the Devixa spike-star and tumbling hardware debris, lit by a procedural studio
 * that inverts from Industrial Slate to the Obsidian Darkroom.
 */
const CyberChromeScene = () => {
  const [compact, setCompact] = useState(false);
  const [maxDpr, setMaxDpr] = useState(2);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <Canvas
      className="!fixed inset-0 !h-[100lvh] !w-screen"
      style={{ position: 'fixed' }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
      dpr={[1, maxDpr]}
      camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <PerformanceMonitor onDecline={() => setMaxDpr(1.25)} onIncline={() => setMaxDpr(2)} />
      <AdaptiveDpr pixelated={false} />
      <Director />
      <RimLights />
      <Suspense fallback={null}>
        <ChromeEnvironment />
        {ChainsLayer ? <ChainsLayer compact={compact} /> : null}
        <KeycapSphere />
        <Debris count={compact ? 8 : 18} />
      </Suspense>
    </Canvas>
  );
};

export default CyberChromeScene;
