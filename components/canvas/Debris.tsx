'use client';

import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/lib/store';
import { createBlackPlastic, createChrome, createCrimsonGlass, createLegendTexture } from './materials';

type Fragment = {
  kind: 'keycap' | 'chip';
  legend: string;
  finish: 'chrome' | 'black' | 'crimson';
  position: THREE.Vector3;
  rotation: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
  bob: number;
};

const LEGENDS = ['D', 'E', 'V', 'I', 'X', 'A', 'ESC', '⌘', '{ }', '</>', 'F5', '↵', 'API', 'SQL'];

// Deterministic PRNG so the composition is identical across reloads and SSR/CSR.
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buildFragments = (count: number): Fragment[] => {
  const random = mulberry32(88);
  const range = (min: number, max: number) => min + random() * (max - min);
  return Array.from({ length: count }, (_, i) => {
    const isChip = i % 4 === 3;
    const finish: Fragment['finish'] = i === 6 ? 'crimson' : i % 3 === 0 ? 'chrome' : 'black';
    return {
      kind: isChip ? 'chip' : 'keycap',
      legend: LEGENDS[i % LEGENDS.length] ?? '',
      finish,
      position: new THREE.Vector3(range(-8, 8), range(-4.5, 4.5), range(-10, -1.5)),
      rotation: new THREE.Euler(range(0, Math.PI * 2), range(0, Math.PI * 2), range(0, Math.PI * 2)),
      spin: new THREE.Vector3(range(-0.4, 0.4), range(-0.5, 0.5), range(-0.3, 0.3)),
      scale: range(0.7, 1.25),
      bob: range(0, Math.PI * 2),
    };
  });
};

const Keycap = ({ legend, finish, materials }: { legend: string; finish: Fragment['finish']; materials: Materials }) => {
  const legendMap = useMemo(() => createLegendTexture(legend, finish === 'black' ? '#E2E4E9' : '#050507'), [legend, finish]);
  useEffect(() => () => legendMap.dispose(), [legendMap]);

  return (
    <group>
      {/* Skirt + dished top: two stacked rounded boxes read as a sculpted cap */}
      <RoundedBox args={[0.62, 0.22, 0.62]} radius={0.06} smoothness={3} material={materials[finish]} />
      <RoundedBox args={[0.5, 0.12, 0.5]} radius={0.05} smoothness={3} position={[0, 0.13, -0.02]} material={materials[finish]} />
      <mesh position={[0, 0.192, -0.02]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial map={legendMap} transparent toneMapped={false} />
      </mesh>
    </group>
  );
};

const PIN_OFFSETS = Array.from({ length: 7 }, (_, i) => -0.27 + i * 0.09);

const Chip = ({ materials, pinGeometry }: { materials: Materials; pinGeometry: THREE.BufferGeometry }) => (
  <group>
    <RoundedBox args={[0.7, 0.1, 0.46]} radius={0.015} smoothness={2} material={materials.black} />
    <mesh position={[-0.22, 0.052, 0.12]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.035, 16]} />
      <meshBasicMaterial color="#FF2A2A" toneMapped={false} />
    </mesh>
    {PIN_OFFSETS.flatMap((x) => [
      <mesh key={`a${x}`} geometry={pinGeometry} material={materials.chrome} position={[x, -0.02, 0.27]} rotation={[0.5, 0, 0]} />,
      <mesh key={`b${x}`} geometry={pinGeometry} material={materials.chrome} position={[x, -0.02, -0.27]} rotation={[-0.5, 0, 0]} />,
    ])}
  </group>
);

type Materials = Record<Fragment['finish'], THREE.Material>;

/** Deconstructed hardware tumbling through the midground. */
export const Debris = ({ count }: { count: number }) => {
  const group = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Group | null)[]>([]);
  const fragments = useMemo(() => buildFragments(count), [count]);
  const materials = useMemo<Materials>(
    () => ({ chrome: createChrome(0.14), black: createBlackPlastic(), crimson: createCrimsonGlass() }),
    [],
  );
  const pinGeometry = useMemo(() => new THREE.BoxGeometry(0.035, 0.02, 0.14), []);

  useEffect(
    () => () => {
      Object.values(materials).forEach((material) => material.dispose());
      pinGeometry.dispose();
    },
    [materials, pinGeometry],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const turbulence = motion.reducedMotion ? 0 : 1 + Math.min(Math.abs(motion.scrollVelocity) * 0.08, 4);
    fragments.forEach((fragment, i) => {
      const node = items.current[i];
      if (!node) return;
      node.rotation.x += fragment.spin.x * delta * turbulence;
      node.rotation.y += fragment.spin.y * delta * turbulence;
      node.rotation.z += fragment.spin.z * delta * turbulence;
      node.position.y = fragment.position.y + Math.sin(t * 0.5 + fragment.bob) * 0.25 + motion.hero * (10 + fragment.position.z) * 0.3;
    });
    if (group.current) {
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, motion.pointer.x * -0.35, 2.5, delta);
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, motion.pointer.y * -0.2, 2.5, delta);
    }
  });

  return (
    <group ref={group}>
      {fragments.map((fragment, i) => (
        <group
          key={i}
          ref={(node) => {
            items.current[i] = node;
          }}
          position={fragment.position}
          rotation={fragment.rotation}
          scale={fragment.scale}
        >
          {fragment.kind === 'keycap' ? (
            <Keycap legend={fragment.legend} finish={fragment.finish} materials={materials} />
          ) : (
            <Chip materials={materials} pinGeometry={pinGeometry} />
          )}
        </group>
      ))}
    </group>
  );
};
