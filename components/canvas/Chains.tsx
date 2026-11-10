'use client';

import { useFrame, useThree } from '@react-three/fiber';
import {
  BallCollider,
  RigidBody,
  interactionGroups,
  useRapier,
  useSphericalJoint,
  type RapierRigidBody,
} from '@react-three/rapier';
import { createRef, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { motion } from '@/lib/store';
import { createChainLinkGeometry, createChrome } from './materials';

const LINK_GROUP = interactionGroups(1, [2]);
const CURSOR_GROUP = interactionGroups(2, [1]);
const CURSOR_PLANE_Z = -2.75;

type Vec3 = [number, number, number];

type JointProps = {
  a: RefObject<RapierRigidBody>;
  b: RefObject<RapierRigidBody>;
  anchorA: Vec3;
  anchorB: Vec3;
};

const LinkJoint = ({ a, b, anchorA, anchorB }: JointProps) => {
  useSphericalJoint(a, b, [anchorA, anchorB]);
  return null;
};

type ChainProps = {
  from: Vec3;
  to: Vec3;
  pitch: number;
  /** Extra length relative to the anchor distance; creates the catenary sag. */
  slack: number;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  seed: number;
};

const X_AXIS = new THREE.Vector3(1, 0, 0);
const impulse = new THREE.Vector3();

/**
 * A physical chain: N rigid links joined by spherical joints between two kinematic anchors.
 * Every second link is rotated 90° around its long axis so the chain reads as interlocking.
 */
const Chain = ({ from, to, pitch, slack, geometry, material, seed }: ChainProps) => {
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end = useMemo(() => new THREE.Vector3(...to), [to]);
  const direction = useMemo(() => end.clone().sub(start).normalize(), [start, end]);
  const count = useMemo(() => Math.ceil((start.distanceTo(end) * slack) / pitch), [start, end, slack, pitch]);
  const spacing = start.distanceTo(end) / count;
  const orientation = useMemo(() => new THREE.Quaternion().setFromUnitVectors(X_AXIS, direction), [direction]);

  const links = useMemo(() => Array.from({ length: count }, () => createRef<RapierRigidBody>()), [count]);
  const anchorStart = useRef<RapierRigidBody>(null);
  const anchorEnd = useRef<RapierRigidBody>(null);
  const half = pitch / 2;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const velocity = motion.reducedMotion ? 0 : motion.scrollVelocity;
    const shake = THREE.MathUtils.clamp(Math.abs(velocity) * 0.004, 0, 0.12);
    const tension = THREE.MathUtils.clamp(Math.abs(velocity) * 0.01, 0, 0.35);

    // Anchors: scroll velocity adds tension (pulled outward) and high-frequency shake.
    anchorStart.current?.setNextKinematicTranslation({
      x: start.x - direction.x * tension + Math.sin(t * 43 + seed) * shake,
      y: start.y - direction.y * tension + Math.cos(t * 37 + seed) * shake,
      z: start.z,
    });
    anchorEnd.current?.setNextKinematicTranslation({
      x: end.x + direction.x * tension + Math.sin(t * 41 - seed) * shake,
      y: end.y + direction.y * tension + Math.cos(t * 39 - seed) * shake,
      z: end.z,
    });

    if (motion.reducedMotion) return;
    const pv = motion.pointerVelocity;
    links.forEach((ref, i) => {
      const body = ref.current;
      if (!body) return;
      const phase = Math.sin(i * 0.45 + t * 1.7 + seed);
      impulse.set(
        pv.x * 0.00055 + Math.sin(t * 0.6 + i * 0.2 + seed) * 0.00004,
        pv.y * 0.00035 - velocity * 0.00004 * phase,
        Math.sin(t * 0.8 + i * 0.3) * 0.00003,
      );
      body.applyImpulse(impulse, true);
    });
  });

  return (
    <group>
      <RigidBody ref={anchorStart} type="kinematicPosition" position={from} colliders={false} />
      <RigidBody ref={anchorEnd} type="kinematicPosition" position={to} colliders={false} />
      {links.map((ref, i) => {
        const position = start
          .clone()
          .addScaledVector(direction, spacing * (i + 0.5))
          .toArray() as Vec3;
        return (
          <RigidBody
            key={i}
            ref={ref}
            position={position}
            quaternion={orientation.toArray() as [number, number, number, number]}
            colliders={false}
            linearDamping={0.55}
            angularDamping={1.8}
            canSleep={false}
          >
            <BallCollider args={[0.13]} density={4} collisionGroups={LINK_GROUP} />
            <mesh geometry={geometry} material={material} rotation={[i % 2 === 0 ? 0 : Math.PI / 2, 0, 0]} />
          </RigidBody>
        );
      })}
      <LinkJoint a={anchorStart} b={links[0]!} anchorA={[0, 0, 0]} anchorB={[-half, 0, 0]} />
      {links.slice(0, -1).map((ref, i) => (
        <LinkJoint key={i} a={ref} b={links[i + 1]!} anchorA={[half, 0, 0]} anchorB={[-half, 0, 0]} />
      ))}
      <LinkJoint a={links[count - 1]!} b={anchorEnd} anchorA={[half, 0, 0]} anchorB={[0, 0, 0]} />
    </group>
  );
};

const ray = new THREE.Vector3();
const cursorTarget = new THREE.Vector3();

/** Invisible kinematic "hand" following the cursor: physically shoves the chains on contact. */
const CursorPusher = () => {
  const body = useRef<RapierRigidBody>(null);
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    if (!body.current) return;
    ray.set(motion.pointer.x, motion.pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const distance = (CURSOR_PLANE_Z - camera.position.z) / ray.z;
    cursorTarget.copy(camera.position).addScaledVector(ray, distance);
    body.current.setNextKinematicTranslation(cursorTarget);
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0, 0, CURSOR_PLANE_Z]}>
      <BallCollider args={[0.55]} collisionGroups={CURSOR_GROUP} />
    </RigidBody>
  );
};

const SolverTuning = () => {
  const { world } = useRapier();
  useEffect(() => {
    const tunable = world as unknown as { numSolverIterations?: number };
    if (typeof tunable.numSolverIterations === 'number') tunable.numSolverIterations = 8;
  }, [world]);
  return null;
};

export const Chains = ({ compact }: { compact: boolean }) => {
  const pitch = compact ? 0.72 : 0.5;
  const geometry = useMemo(() => createChainLinkGeometry(pitch, compact ? 0.07 : 0.055), [pitch, compact]);
  const material = useMemo(() => createChrome(0.1), []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  return (
    <>
      <SolverTuning />
      <CursorPusher />
      <Chain from={[-9, 5.6, -2]} to={[9, -5.2, -2]} pitch={pitch} slack={1.035} geometry={geometry} material={material} seed={0.3} />
      <Chain from={[9, 5, -3.5]} to={[-9, -6, -3.5]} pitch={pitch} slack={1.05} geometry={geometry} material={material} seed={2.1} />
    </>
  );
};
