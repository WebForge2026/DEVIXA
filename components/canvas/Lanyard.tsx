'use client';

import { Environment, Lightformer, RoundedBox } from '@react-three/drei';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from '@react-three/rapier';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from '@/lib/store';
import { setCursorMode } from '@/components/ui/cursorBus';
import { createChrome } from './materials';

const SEGMENTS = 48;
const RIBBON_WIDTH = 0.32;

const drawBadge = () => {
  const w = 640;
  const h = 900;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#050507';
  ctx.fillRect(0, 0, w, h);
  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // Slot
  ctx.fillStyle = '#16161c';
  ctx.fillRect(w / 2 - 70, 40, 140, 26);
  // Crimson band
  const band = ctx.createLinearGradient(0, 0, w, 0);
  band.addColorStop(0, '#990000');
  band.addColorStop(1, '#FF2A2A');
  ctx.fillStyle = band;
  ctx.fillRect(0, 120, w, 120);
  ctx.fillStyle = '#050507';
  ctx.font = '900 92px Unbounded, Arial Black, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('DEVIXA', 40, 184);
  // Spike star
  ctx.save();
  ctx.translate(w / 2, 460);
  ctx.fillStyle = '#E2E4E9';
  ctx.beginPath();
  for (let i = 0; i <= 16; i += 1) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 150 : 52;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.fill();
  ctx.restore();
  // Labels
  ctx.fillStyle = '#E2E4E9';
  ctx.font = '700 30px ui-monospace, monospace';
  ctx.fillText('ACCESS: ALL SYSTEMS', 40, 680);
  ctx.fillStyle = 'rgba(226,228,233,0.55)';
  ctx.font = '400 22px ui-monospace, monospace';
  ctx.fillText('CREATIVE SOLUTIONS 88 EOOD', 40, 724);
  ctx.fillText('ID 0088-EU · DE / BG / PL', 40, 758);
  // Barcode
  let x = 40;
  let seed = 7;
  while (x < w - 40) {
    seed = (seed * 9301 + 49297) % 233280;
    const bar = 2 + (seed % 7);
    ctx.fillStyle = '#E2E4E9';
    ctx.fillRect(x, 800, bar, 60);
    x += bar + 3 + (seed % 5);
  }
  ctx.fillStyle = '#FF2A2A';
  ctx.beginPath();
  ctx.arc(w - 60, 690, 12, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
};

const drawRibbon = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#C81E1E';
  ctx.fillRect(0, 0, 1024, 64);
  ctx.fillStyle = '#050507';
  ctx.font = '900 36px Unbounded, Arial Black, sans-serif';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 4; i += 1) ctx.fillText('DEVIXA ✦', i * 256 + 16, 34);
  return canvas;
};

/** Flat cloth-like ribbon mesh rebuilt each frame along the rope curve. */
const useRibbonGeometry = () =>
  useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array((SEGMENTS + 1) * 2 * 3);
    const uvs = new Float32Array((SEGMENTS + 1) * 2 * 2);
    const indices: number[] = [];
    for (let i = 0; i <= SEGMENTS; i += 1) {
      uvs.set([0, i / SEGMENTS, 1, i / SEGMENTS], i * 4);
      if (i < SEGMENTS) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
  }, []);

const tangent = new THREE.Vector3();
const side = new THREE.Vector3();
const forward = new THREE.Vector3(0, 0, 1);
const pointerWorld = new THREE.Vector3();
const pointerDir = new THREE.Vector3();
const angular = new THREE.Vector3();
const lerped = [new THREE.Vector3(), new THREE.Vector3()];

const Band = () => {
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RapierRigidBody>(null);
  const j2 = useRef<RapierRigidBody>(null);
  const j3 = useRef<RapierRigidBody>(null);
  const card = useRef<RapierRigidBody>(null);
  const [dragOffset, setDragOffset] = useState<THREE.Vector3 | null>(null);
  const initialised = useRef(false);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], false, 'chordal'),
    [],
  );
  const ribbon = useRibbonGeometry();
  const { badgeMap, ribbonMap, chrome } = useMemo(() => {
    const badge = new THREE.CanvasTexture(drawBadge());
    badge.colorSpace = THREE.SRGBColorSpace;
    badge.anisotropy = 8;
    const strap = new THREE.CanvasTexture(drawRibbon());
    strap.colorSpace = THREE.SRGBColorSpace;
    strap.wrapS = THREE.RepeatWrapping;
    strap.wrapT = THREE.RepeatWrapping;
    strap.repeat.set(1, 1);
    strap.rotation = Math.PI / 2;
    return { badgeMap: badge, ribbonMap: strap, chrome: createChrome(0.12) };
  }, []);

  useEffect(
    () => () => {
      [badgeMap, ribbonMap, chrome, ribbon].forEach((resource) => resource.dispose());
    },
    [badgeMap, ribbonMap, chrome, ribbon],
  );

  const segment: RigidBodyProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 2, linearDamping: 2 };
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]);

  useFrame((state, delta) => {
    if (dragOffset && card.current) {
      pointerWorld.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      pointerDir.copy(pointerWorld).sub(state.camera.position).normalize();
      pointerWorld.add(pointerDir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current.setNextKinematicTranslation({
        x: pointerWorld.x - dragOffset.x,
        y: pointerWorld.y - dragOffset.y,
        z: pointerWorld.z - dragOffset.z,
      });
    }

    if (!fixed.current || !j1.current || !j2.current || !j3.current || !card.current) return;

    // Smooth the two middle joints to kill jitter in the ribbon.
    [j1, j2].forEach((ref, i) => {
      const t = ref.current!.translation();
      const target = lerped[i]!;
      if (!initialised.current) target.set(t.x, t.y, t.z);
      const distance = Math.max(0.1, Math.min(1, target.distanceTo(t)));
      // Clamp: after a long frame (background tab) an unclamped factor overshoots into NaN.
      target.lerp(t, Math.min(1, Math.min(delta, 1 / 30) * (10 + distance * 40)));
    });
    initialised.current = true;

    curve.points[0]!.copy(j3.current.translation());
    curve.points[1]!.copy(lerped[1]!);
    curve.points[2]!.copy(lerped[0]!);
    curve.points[3]!.copy(fixed.current.translation());

    const position = ribbon.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i <= SEGMENTS; i += 1) {
      const u = i / SEGMENTS;
      const p = curve.getPoint(u);
      curve.getTangent(u, tangent);
      side.crossVectors(tangent, forward);
      if (!Number.isFinite(side.x) || side.lengthSq() < 1e-8) side.set(1, 0, 0);
      side.normalize().multiplyScalar(RIBBON_WIDTH / 2);
      if (!Number.isFinite(p.x)) continue;
      position.setXYZ(i * 2, p.x - side.x, p.y - side.y, p.z - side.z);
      position.setXYZ(i * 2 + 1, p.x + side.x, p.y + side.y, p.z + side.z);
    }
    position.needsUpdate = true;
    ribbon.computeVertexNormals();
    ribbon.computeBoundingSphere();

    // Keep the badge facing the viewer.
    const rotation = card.current.rotation();
    const av = card.current.angvel();
    angular.set(av.x, av.y - rotation.y * 0.25, av.z);
    card.current.setAngvel(angular, true);
  });

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (dragOffset || !card.current || motion.reducedMotion) return;
    // Cursor contact: the badge gets knocked by the pointer's momentum.
    const pv = motion.pointerVelocity;
    card.current.applyImpulse({ x: pv.x * 0.04, y: pv.y * 0.02, z: -Math.abs(pv.x) * 0.02 }, true);
    event.stopPropagation();
  };

  return (
    <>
      <group position={[0, 4.2, 0]}>
        <RigidBody ref={fixed} {...segment} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segment}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segment}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segment}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segment} type={dragOffset ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.02]} />
          <group
            position={[0, 0, 0]}
            onPointerOver={() => setCursorMode('drag')}
            onPointerOut={() => setCursorMode('default')}
            onPointerMove={onPointerMove}
            onPointerUp={(event) => {
              (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
              setDragOffset(null);
            }}
            onPointerDown={(event) => {
              (event.target as Element | null)?.setPointerCapture?.(event.pointerId);
              if (!card.current) return;
              const t = card.current.translation();
              setDragOffset(new THREE.Vector3().copy(event.point).sub(new THREE.Vector3(t.x, t.y, t.z)));
            }}
          >
            <RoundedBox args={[1.7, 2.35, 0.05]} radius={0.06} smoothness={4} material={chrome} />
            <mesh position={[0, 0, 0.027]}>
              <planeGeometry args={[1.6, 2.25]} />
              <meshPhysicalMaterial map={badgeMap} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
            </mesh>
            <mesh position={[0, 0, -0.027]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[1.6, 2.25]} />
              <meshPhysicalMaterial map={badgeMap} roughness={0.25} clearcoat={1} />
            </mesh>
            {/* Clip */}
            <RoundedBox args={[0.34, 0.22, 0.12]} radius={0.03} position={[0, 1.25, 0]} material={chrome} />
            <mesh position={[0, 1.42, 0]} material={chrome}>
              <torusGeometry args={[0.1, 0.025, 12, 32]} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh geometry={ribbon}>
        <meshStandardMaterial map={ribbonMap} side={THREE.DoubleSide} roughness={0.55} metalness={0.05} />
      </mesh>
    </>
  );
};

/** Interactive employee badge on a cloth-like lanyard. Drag it, flick it, knock it with the cursor. */
const Lanyard = () => (
  <Canvas camera={{ position: [0, 0, 13], fov: 25 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>
    <ambientLight intensity={Math.PI * 0.4} />
    <Physics gravity={[0, -40, 0]} timeStep={1 / 60} interpolate>
      <Band />
    </Physics>
    <Environment resolution={256} background={false}>
      <color attach="background" args={['#000000']} />
      <Lightformer intensity={2} color="#ffffff" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
      <Lightformer intensity={3} color="#FF2A2A" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
      <Lightformer intensity={3} color="#ffffff" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
      <Lightformer intensity={10} color="#990000" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
    </Environment>
  </Canvas>
);

export default Lanyard;
