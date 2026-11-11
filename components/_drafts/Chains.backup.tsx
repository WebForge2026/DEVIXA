/**
 * ARCHIVE — exact copy of components/canvas/Chains.tsx as of commit 571cbef (3D chain physics).
 * Not imported anywhere, so it is not bundled. The live file stays in components/canvas/Chains.tsx;
 * to restore the chains, set ENABLE_CHAINS = true in components/canvas/CyberChromeScene.tsx.
 * Only change from the original: the materials import uses an absolute path so this copy type-checks here.
 */
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
import { createChainLinkGeometry, createChrome } from '@/components/canvas/materials';

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
  profile: MotionProfile;
};

const X_AXIS = new THREE.Vector3(1, 0, 0);
const impulse = new THREE.Vector3();

/**
 * Motion tuning. Multipliers are relative to the original values (1 = unchanged).
 * - scroll:     scroll-driven translation (anchor tension, shake, scroll impulses)
 * - mouse:      pointer-driven impulses and how far the cursor "hand" reaches
 * - smoothing:  lerp factor per 60 fps frame for scroll/pointer input (lower = smoother)
 * - linear/angularDamping: per-link velocity damping; rotation in a jointed chain comes
 *   from the joints, so angular damping is what scales rotational speed.
 */
const MOTION_PROFILE = {
  desktop: { scroll: 0.78, mouse: 0.5, smoothing: 0.35, linearDamping: 0.65, angularDamping: 2.6, cursorFollow: 0.45 },
  // Mobile: translation -65 %, rotation ~-60 % (angular damping 1.8 -> 4.5), heavy input smoothing.
  mobile: { scroll: 0.35, mouse: 0.5, smoothing: 0.05, linearDamping: 1.3, angularDamping: 4.5, cursorFollow: 0.1 },
} as const;

type MotionProfile = (typeof MOTION_PROFILE)[keyof typeof MOTION_PROFILE];

/** Frame-rate independent version of `lerp(a, b, factor)` tuned at 60 fps. */
const smoothingAlpha = (factor: number, delta: number) => 1 - Math.pow(1 - factor, Math.min(delta, 0.1) * 60);

/** Filtered inputs shared by both chains, so a touch flick becomes a gentle swell instead of a jolt. */
const filtered = { scroll: 0, pointerX: 0, pointerY: 0 };

const InputFilter = ({ profile }: { profile: MotionProfile }) => {
  useFrame((_, delta) => {
    const alpha = smoothingAlpha(profile.smoothing, delta);
    const scroll = motion.reducedMotion ? 0 : motion.scrollVelocity;
    filtered.scroll += (scroll - filtered.scroll) * alpha;
    filtered.pointerX += (motion.pointerVelocity.x - filtered.pointerX) * alpha;
    filtered.pointerY += (motion.pointerVelocity.y - filtered.pointerY) * alpha;
  });
  return null;
};

/**
 * A physical chain: N rigid links joined by spherical joints between two kinematic anchors.
 * Every second link is rotated 90° around its long axis so the chain reads as interlocking.
 */
const Chain = ({ from, to, pitch, slack, geometry, material, seed, profile }: ChainProps) => {
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
    const velocity = filtered.scroll * profile.scroll;
    const shake = THREE.MathUtils.clamp(Math.abs(velocity) * 0.004, 0, 0.12 * profile.scroll);
    const tension = THREE.MathUtils.clamp(Math.abs(velocity) * 0.01, 0, 0.35 * profile.scroll);

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
    const pvx = filtered.pointerX * profile.mouse;
    const pvy = filtered.pointerY * profile.mouse;
    links.forEach((ref, i) => {
      const body = ref.current;
      if (!body) return;
      const phase = Math.sin(i * 0.45 + t * 1.7 + seed);
      impulse.set(
        pvx * 0.00055 + Math.sin(t * 0.6 + i * 0.2 + seed) * 0.00004,
        pvy * 0.00035 - velocity * 0.00004 * phase,
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
            linearDamping={profile.linearDamping}
            angularDamping={profile.angularDamping}
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
const cursorPosition = new THREE.Vector3(0, 0, CURSOR_PLANE_Z);
/** Where the pusher waits on touch devices: far outside the chains. */
const PARKED = new THREE.Vector3(0, 40, CURSOR_PLANE_Z);

/** Original cursor radius 0.55 scaled to ~0.45: a lighter touch on the chains. */
const CURSOR_RADIUS = 0.24;

/**
 * Invisible kinematic "hand" following the cursor: shoves the chains on contact.
 * It trails the pointer with inertia, so a fast swipe nudges the chain instead of whipping it.
 */
const CursorPusher = ({ profile }: { profile: MotionProfile }) => {
  const body = useRef<RapierRigidBody>(null);
  const camera = useThree((state) => state.camera);
  // Touch screens have no hovering cursor: the pointer would rest at screen centre, right where
  // the chains cross, and push them constantly. There the pusher stays parked out of reach.
  const hover = useRef(true);
  useEffect(() => {
    hover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  useFrame((_, delta) => {
    if (!body.current) return;
    if (!hover.current) {
      body.current.setNextKinematicTranslation(PARKED);
      return;
    }
    ray.set(motion.pointer.x, motion.pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const distance = (CURSOR_PLANE_Z - camera.position.z) / ray.z;
    cursorTarget.copy(camera.position).addScaledVector(ray, distance);
    cursorPosition.lerp(cursorTarget, smoothingAlpha(profile.cursorFollow, delta));
    body.current.setNextKinematicTranslation(cursorPosition);
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0, 0, CURSOR_PLANE_Z]}>
      <BallCollider args={[CURSOR_RADIUS]} collisionGroups={CURSOR_GROUP} />
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
  const profile = compact ? MOTION_PROFILE.mobile : MOTION_PROFILE.desktop;

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
      <InputFilter profile={profile} />
      <CursorPusher profile={profile} />
      <Chain from={[-9, 5.6, -2]} to={[9, -5.2, -2]} pitch={pitch} slack={1.035} geometry={geometry} material={material} seed={0.3} profile={profile} />
      <Chain from={[9, 5, -3.5]} to={[-9, -6, -3.5]} pitch={pitch} slack={1.05} geometry={geometry} material={material} seed={2.1} profile={profile} />
    </>
  );
};
