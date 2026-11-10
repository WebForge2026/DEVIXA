'use client';

import { Environment, Lightformer } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { motion } from '@/lib/store';

type ActLightformerProps = {
  light: [color: string, intensity: number];
  dark: [color: string, intensity: number];
  form?: 'rect' | 'ring' | 'circle';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number] | number;
};

const lightTint = new THREE.Color();
const darkTint = new THREE.Color();

/** A studio light panel that cross-fades between its Slate (Act I) and Darkroom (Act II) setting. */
const ActLightformer = ({ light, dark, ...props }: ActLightformerProps) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const material = ref.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!material) return;
    lightTint.set(light[0]).multiplyScalar(light[1]);
    darkTint.set(dark[0]).multiplyScalar(dark[1]);
    material.color.copy(lightTint).lerp(darkTint, motion.dark);
  });

  return <Lightformer ref={ref} {...props} />;
};

const SLATE_VOID = new THREE.Color('#7d8796');
const DARK_VOID = new THREE.Color('#000000');

/** The studio "void" colour: mid slate in Act I so chrome reads bright, black in the darkroom. */
const ActVoid = () => {
  const color = useRef<THREE.Color>(null);
  useFrame(() => color.current?.copy(SLATE_VOID).lerp(DARK_VOID, motion.dark));
  return <color ref={color} attach="background" args={['#7d8796']} />;
};

/**
 * Procedural HDR studio: no network fetch, rebuilt every frame at low resolution so the
 * chrome picks up the act transition and red laser strips in real time.
 */
export const ChromeEnvironment = () => (
  <Environment resolution={128} frames={Infinity} background={false}>
    <ActVoid />
    {/* Key softbox overhead */}
    <ActLightformer form="rect" light={['#ffffff', 3.2]} dark={['#ffffff', 0.35]} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[14, 4, 1]} />
    {/* Slate side panels */}
    <ActLightformer form="rect" light={['#CBD5E1', 2.2]} dark={['#1a1a22', 0.4]} position={[-7, 1, 2]} rotation={[0, Math.PI / 2, 0]} scale={[10, 6, 1]} />
    <ActLightformer form="rect" light={['#E2E4E9', 1.8]} dark={['#0b0b10', 0.2]} position={[7, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 6, 1]} />
    {/* Razor strips: white in Act I, crimson lasers in Act II */}
    <ActLightformer form="rect" light={['#ffffff', 4]} dark={['#FF2A2A', 9]} position={[-4, -1, 6]} rotation={[0, 0.4, 0]} scale={[0.25, 12, 1]} />
    <ActLightformer form="rect" light={['#ffffff', 3]} dark={['#FF2A2A', 7]} position={[5, 2, 5]} rotation={[0, -0.5, 0]} scale={[0.18, 12, 1]} />
    <ActLightformer form="rect" light={['#94a3b8', 1]} dark={['#990000', 6]} position={[0, -5, -2]} rotation={[-Math.PI / 2, 0, 0]} scale={[16, 6, 1]} />
    <ActLightformer form="ring" light={['#ffffff', 2]} dark={['#FF2A2A', 5]} position={[3, 3, -6]} scale={3} />
    <ActLightformer form="rect" light={['#334155', 0.6]} dark={['#990000', 3]} position={[0, 0, -9]} scale={[20, 6, 1]} />
  </Environment>
);
