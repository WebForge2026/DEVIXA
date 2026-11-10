'use client';

import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/lib/store';
import { damp } from '@/lib/utils';
import { setCursorMode } from '@/components/ui/cursorBus';
import { createChrome, createGlowTexture, createStarGeometry } from './materials';

const restPosition = new THREE.Vector3();
const darkroomPosition = new THREE.Vector3();
const target = new THREE.Vector3();

/**
 * The Devixa core: two layered chrome stars with hard bevels, spinning on an offset axis.
 * Drag to spin, click to fire a crimson optical flare.
 */
export const SpikeStar = () => {
  const root = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const streak = useRef<THREE.Sprite>(null);
  const flareLight = useRef<THREE.PointLight>(null);
  const hover = useRef(0);
  const spin = useRef({ velocity: 0.35, dragging: false, lastX: 0 });
  const { viewport, size } = useThree();
  const portrait = size.width < size.height;

  const { major, spikes, chrome, glowMap, streakMap } = useMemo(
    () => ({
      major: createStarGeometry(8, 1.45, 0.62, 0.16, 0.22),
      spikes: createStarGeometry(4, 2.15, 0.26, 0.08, 0.14),
      chrome: createChrome(0.06),
      glowMap: createGlowTexture('rgba(255,220,220,1)', 'rgba(255,42,42,0.55)'),
      streakMap: createGlowTexture('rgba(255,180,180,1)', 'rgba(255,42,42,0.35)'),
    }),
    [],
  );

  useEffect(
    () => () => {
      [major, spikes, chrome, glowMap, streakMap].forEach((resource) => resource.dispose());
    },
    [major, spikes, chrome, glowMap, streakMap],
  );

  useEffect(() => {
    const release = () => {
      spin.current.dragging = false;
    };
    const drag = (event: PointerEvent) => {
      if (!spin.current.dragging) return;
      spin.current.velocity += (event.clientX - spin.current.lastX) * 0.02;
      spin.current.lastX = event.clientX;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointermove', drag);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointermove', drag);
    };
  }, []);

  useFrame((state, delta) => {
    if (!root.current || !spinner.current) return;
    const scale = portrait ? 0.55 : 0.82;
    restPosition.set(portrait ? 0 : viewport.width * 0.25, portrait ? -1.6 : 0.15, 0.6);
    darkroomPosition.set(portrait ? 0 : viewport.width * 0.42, 0.6, -5);

    // Hero -> darkroom: the core lifts, recedes and becomes a looming emblem.
    target.copy(restPosition).lerp(darkroomPosition, motion.hero);
    target.y += Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    root.current.position.lerp(target, 1 - Math.exp(-6 * delta));
    root.current.scale.setScalar(scale * (1 + motion.hero * 0.35 + motion.flare * 0.08));

    // Parallax tilt toward the cursor
    root.current.rotation.x = damp(root.current.rotation.x, 0.28 - motion.pointer.y * 0.25, 4, delta);
    root.current.rotation.z = damp(root.current.rotation.z, 0.18 + motion.pointer.x * 0.12, 4, delta);

    const s = spin.current;
    const idle = motion.reducedMotion ? 0.05 : 0.35;
    s.velocity = damp(s.velocity, idle + Math.abs(motion.scrollVelocity) * 0.01, s.dragging ? 0 : 1.6, delta);
    spinner.current.rotation.y += s.velocity * delta;

    // Flare: hover holds a low glow, click spikes it and it decays.
    motion.flare = Math.max(0, motion.flare - delta * 1.1);
    const energy = Math.max(motion.flare, hover.current * 0.35);
    glow.current?.scale.setScalar(1.5 + energy * 6);
    if (glow.current) glow.current.material.opacity = energy * 0.95;
    streak.current?.scale.set(4 + energy * 22, 0.18 + energy * 0.25, 1);
    if (streak.current) streak.current.material.opacity = energy * 0.85;
    if (flareLight.current) flareLight.current.intensity = energy * 60 + motion.dark * 8;
  });

  const onPointerOver = () => {
    hover.current = 1;
    setCursorMode('core');
  };
  const onPointerOut = () => {
    hover.current = 0;
    setCursorMode('default');
  };
  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    spin.current.dragging = true;
    spin.current.lastX = event.nativeEvent.clientX;
  };
  const onClick = () => {
    motion.flare = 1;
    spin.current.velocity += 9;
  };

  return (
    <group ref={root}>
      <group ref={spinner} onPointerOver={onPointerOver} onPointerOut={onPointerOut} onPointerDown={onPointerDown} onClick={onClick}>
        <mesh geometry={major} material={chrome} />
        <mesh geometry={spikes} material={chrome} rotation={[0, 0, Math.PI / 4]} position={[0, 0, -0.12]} />
        <mesh geometry={spikes} material={chrome} rotation={[0, Math.PI / 2, Math.PI / 8]} scale={0.7} />
        <mesh material={chrome}>
          <octahedronGeometry args={[0.42, 0]} />
        </mesh>
      </group>
      <pointLight ref={flareLight} color="#FF2A2A" distance={9} decay={1.6} position={[0, 0, 1.2]} />
      <sprite ref={glow} position={[0, 0, 0.6]}>
        <spriteMaterial map={glowMap} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite ref={streak} position={[0, 0, 0.7]}>
        <spriteMaterial map={streakMap} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </group>
  );
};
