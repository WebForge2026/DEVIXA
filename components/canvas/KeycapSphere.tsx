'use client';

import { useFrame, useThree, type RootState } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { setCursorMode } from '@/components/ui/cursorBus';
import { SPHERE_HEIGHT, SPHERE_OFFSET_X } from '@/lib/heroLayout';
import { motion } from '@/lib/store';

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------------------
   Tuning
--------------------------------------------------------------------------- */
const SPHERE_RADIUS = 3.2;
/** Keycap footprint (world units) and the gap between neighbours. */
const KEY_SIZE = 1;
const KEY_GAP = 0.12;
/** Share of crimson and light accent keys. */
/** Default share of crimson keys; the admin can override it (html[data-sphere-red]). */
const ACCENT_SHARE = 0.2;
const LIGHT_SHARE = 0.03;

const KEY_DARK = new THREE.Color('#111215');
const KEY_ACCENT = new THREE.Color('#DC2626');
const KEY_LIGHT = new THREE.Color('#d6d9df');
const LEGEND_ON_DARK = new THREE.Color('#c9ccd3');
const LEGEND_ON_LIGHT = new THREE.Color('#15161a');
const LEGEND_ON_ACCENT = new THREE.Color('#2a0303');

/** Key legends: letters, numbers and symbols (ASCII-safe so every font renders them). 8 × 8 atlas. */
const GLYPHS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ...'0123456789',
  ...'!@#$%&*?+=<>/{}[]~^§€',
  'ESC', 'TAB', 'ALT', 'CTRL', 'DEL', 'FN', 'ENTER',
];
const ATLAS_COLS = 8;
const ATLAS_CELL = 128;

/** Idle spin (rad/s) around the vertical axis. */
const IDLE_SPIN = 0.16;
/** Extra spin while the hero scrolls out. */
const SCROLL_TURN = Math.PI * 1.5;
/** How far the sphere moves back in Z while the hero scrolls out. */
const SCROLL_DEPTH = 3;
/** Pointer tilt lerp per 60 fps frame. */
const TILT_LERP = 0.05;

/* ---------------------------------------------------------------------------
   Hover dispersion tuning (keys part around the cursor and float weightlessly)
--------------------------------------------------------------------------- */
/** Key base radius (where each key sits) and outer radius of the invisible hit sphere (key tops). */
const BASE_RADIUS = SPHERE_RADIUS - KEY_SIZE * 0.32;
const HIT_RADIUS = BASE_RADIUS + KEY_SIZE * 0.63;
/** Keys within this distance of the cursor (measured on the key shell) part. */
const INFLUENCE_RADIUS = 0.5 * SPHERE_RADIUS;
/** Maximum lift along each key's outward surface normal. */
const MAX_PUSH = 0.95;
/** Maximum sideways push away from the cursor, opening a gap around it. */
const SPREAD_FACTOR = 0.45;
/** Parted keys lean away from the cursor by up to this angle (rad). */
const FLARE_TILT = 0.35;
/** Weightless float at full influence: position wobble and rotation wobble (rad). */
const FLOAT_POSITION = 0.025 * SPHERE_RADIUS;
const FLOAT_TILT = 0.22;
/** Exponential damping rate (1/s) for parting and reassembling: alpha = 1 - exp(-DAMPING * dt). */
const DAMPING = 7;
/** Idle spin multiplier while hovered, and its damping rate (1/s). */
const HOVER_SPIN = 0.04;
const SPIN_DAMPING = 3;

// Scratch objects for the render loop — allocated once, never per frame.
const _pointer = new THREE.Vector2();
const _hitSphere = new THREE.Sphere();
const _hitWorld = new THREE.Vector3();
const _hitLocal = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _flareAxis = new THREE.Vector3();
const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _flareQ = new THREE.Quaternion();
const _wobbleQ = new THREE.Quaternion();
const _unitScale = new THREE.Vector3(1, 1, 1);
const _keyMatrix = new THREE.Matrix4();
const _legendMatrix = new THREE.Matrix4();

const smoothingAlpha = (factor: number, delta: number) => 1 - Math.pow(1 - factor, Math.min(delta, 0.1) * 60);

// Deterministic PRNG: identical sphere on every load.
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------------------------------------------------------------------------
   Legend atlas
--------------------------------------------------------------------------- */

/** White glyphs on transparent cells; tinted per key via instanceColor. */
const drawGlyphAtlas = (canvas: HTMLCanvasElement) => {
  const size = ATLAS_COLS * ATLAS_CELL;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() || 'ui-monospace';
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  GLYPHS.forEach((glyph, i) => {
    const x = (i % ATLAS_COLS) * ATLAS_CELL + ATLAS_CELL / 2;
    const y = Math.floor(i / ATLAS_COLS) * ATLAS_CELL + ATLAS_CELL / 2;
    const px = glyph.length === 1 ? 74 : glyph.length <= 3 ? 40 : 30;
    ctx.font = `700 ${px}px ${mono}, ui-monospace, monospace`;
    ctx.fillText(glyph, x, y + 3);
  });
};

/** MeshBasicMaterial that picks its atlas cell from the per-instance `aGlyph` attribute. */
const createLegendMaterial = (map: THREE.Texture) => {
  const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlyph;')
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        {
          float cols = ${ATLAS_COLS.toFixed(1)};
          vec2 cell = vec2(mod(aGlyph, cols), cols - 1.0 - floor(aGlyph / cols));
          vMapUv = (vMapUv + cell) / cols;
        }`,
      );
  };
  return material;
};

/* ---------------------------------------------------------------------------
   Geometry
--------------------------------------------------------------------------- */

/** Sculpted keycap (skirt + dished top), Y-up, base at y = 0. One geometry → one draw call. */
const createKeycapGeometry = () => {
  const s = KEY_SIZE;
  const skirt = new RoundedBoxGeometry(s, s * 0.46, s, 3, s * 0.1);
  skirt.translate(0, s * 0.23, 0);
  const top = new RoundedBoxGeometry(s * 0.78, s * 0.2, s * 0.74, 3, s * 0.08);
  top.translate(0, s * 0.53, -s * 0.04);
  const merged = mergeGeometries([skirt, top]);
  skirt.dispose();
  top.dispose();
  return merged;
};

type KeySlot = { matrix: THREE.Matrix4; color: THREE.Color; legend: THREE.Color; glyph: number };

/**
 * Keys in latitude rows; each row holds as many keys as fit its circumference,
 * every key's top facing straight out from the centre.
 */
const buildSlots = (): KeySlot[] => {
  const random = mulberry32(88);
  const configured = Number(document.documentElement.dataset.sphereRed);
  const accentShare = Number.isFinite(configured) && configured > 0 ? configured : ACCENT_SHARE;
  const pitch = KEY_SIZE + KEY_GAP;
  const rowStep = pitch / SPHERE_RADIUS; // angular height of one row
  const rows = Math.floor(Math.PI / rowStep);
  const slots: KeySlot[] = [];
  const up = new THREE.Vector3();
  const east = new THREE.Vector3();
  const front = new THREE.Vector3();
  const spin = new THREE.Matrix4();

  for (let r = 0; r < rows; r += 1) {
    const lat = -Math.PI / 2 + rowStep * (r + 0.5) + (Math.PI - rows * rowStep) / 2;
    const ringRadius = Math.cos(lat) * SPHERE_RADIUS;
    const count = Math.max(1, Math.floor((2 * Math.PI * ringRadius) / pitch));
    const offset = random() * Math.PI * 2;

    for (let k = 0; k < count; k += 1) {
      const lon = offset + (k / count) * Math.PI * 2;
      up.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
      east.set(-Math.sin(lon), 0, Math.cos(lon));
      front.crossVectors(east, up);
      // A slight hand-assembled irregularity: small twist around the key's own axis.
      spin.makeRotationY((random() - 0.5) * 0.12);
      const matrix = new THREE.Matrix4()
        .makeBasis(east, up, front)
        .multiply(spin)
        .setPosition(up.clone().multiplyScalar(SPHERE_RADIUS - KEY_SIZE * 0.32));

      const roll = random();
      const color = roll < accentShare ? KEY_ACCENT : roll < accentShare + LIGHT_SHARE ? KEY_LIGHT : KEY_DARK;
      const legend = color === KEY_DARK ? LEGEND_ON_DARK : color === KEY_ACCENT ? LEGEND_ON_ACCENT : LEGEND_ON_LIGHT;
      slots.push({ matrix, color, legend, glyph: 0 });
    }
  }
  // Hand out glyphs from shuffled decks, so every symbol appears before any repeats
  // and keys next to each other in a row always differ.
  let deck: number[] = [];
  slots.forEach((slot, i) => {
    if (deck.length === 0) deck = GLYPHS.map((_, g) => g).sort(() => random() - 0.5);
    let pick = deck.pop()!;
    if (i > 0 && pick === slots[i - 1]!.glyph && deck.length > 0) {
      deck.unshift(pick);
      pick = deck.pop()!;
    }
    slot.glyph = pick;
  });
  return slots;
};

/** Legend placement on a key's dished top; rotated so it reads upright toward the sphere's north. */
const LEGEND_ON_TOP = new THREE.Matrix4()
  .makeTranslation(0, KEY_SIZE * 0.632, -KEY_SIZE * 0.04)
  .multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  .multiply(new THREE.Matrix4().makeRotationZ(Math.PI));

/* ---------------------------------------------------------------------------
   Lights
--------------------------------------------------------------------------- */

/** Local three-point rig with an intense rim light that cuts the dark keycaps out of the background. */
const SphereLights = () => (
  <>
    {/* Key: front-left, slightly warm */}
    <spotLight position={[-5, 4, 7]} intensity={90} angle={0.6} penumbra={1} distance={20} decay={1.6} color="#fff4ea" />
    {/* Fill: front-right, soft */}
    <pointLight position={[5, -2, 5]} intensity={18} distance={14} decay={1.8} color="#cbd5e1" />
    {/* Rim: behind, grazing the silhouettes */}
    <spotLight position={[2, 3, -5]} intensity={260} angle={0.9} penumbra={0.8} distance={16} decay={1.5} color="#ffffff" />
    <spotLight position={[-3, -4, -4]} intensity={140} angle={0.9} penumbra={0.8} distance={14} decay={1.5} color="#FF2A2A" />
  </>
);

/* ---------------------------------------------------------------------------
   Sphere
--------------------------------------------------------------------------- */

const restPosition = new THREE.Vector3();
const target = new THREE.Vector3();

/**
 * Hero centrepiece: a sphere built only from keycaps.
 * Idle: slow spin + breathing float. Scroll (GSAP ScrollTrigger, scrub 1.2): spins on with
 * spring momentum and recedes in Z. Pointer: spring-damped tilt. Click: a quick extra spin.
 */
export const KeycapSphere = () => {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const keys = useRef<THREE.InstancedMesh>(null);
  const legends = useRef<THREE.InstancedMesh>(null);
  const spin = useRef<THREE.Group>(null);
  const viewport = useThree((state) => state.viewport);

  const slots = useMemo(buildSlots, []);
  const { atlasCanvas, atlas, legendGeometry, legendMaterial } = useMemo(() => {
    const canvas = document.createElement('canvas');
    drawGlyphAtlas(canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const plane = new THREE.PlaneGeometry(KEY_SIZE * 0.5, KEY_SIZE * 0.5);
    plane.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(new Float32Array(slots.map((s) => s.glyph)), 1));
    return { atlasCanvas: canvas, atlas: texture, legendGeometry: plane, legendMaterial: createLegendMaterial(texture) };
  }, [slots]);

  // Redraw once the web font has loaded, so legends use JetBrains Mono rather than the fallback.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      drawGlyphAtlas(atlasCanvas);
      atlas.needsUpdate = true;
    });
    return () => {
      alive = false;
    };
  }, [atlasCanvas, atlas]);

  const { geometry, material } = useMemo(
    () => ({
      geometry: createKeycapGeometry(),
      material: new THREE.MeshPhysicalMaterial({
        color: '#ffffff', // per-key colour via instanceColor
        roughness: 0.3,
        metalness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.25,
      }),
    }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = keys.current;
    if (!mesh) return;
    const legendMesh = legends.current;
    const m = new THREE.Matrix4();
    slots.forEach((slot, i) => {
      mesh.setMatrixAt(i, slot.matrix);
      mesh.setColorAt(i, slot.color);
      legendMesh?.setMatrixAt(i, m.copy(slot.matrix).multiply(LEGEND_ON_TOP));
      legendMesh?.setColorAt(i, slot.legend);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (legendMesh) {
      legendMesh.instanceMatrix.needsUpdate = true;
      if (legendMesh.instanceColor) legendMesh.instanceColor.needsUpdate = true;
      legendMesh.computeBoundingSphere();
    }
    // Bounding sphere over all instances, so frustum culling sees the whole sphere.
    mesh.computeBoundingSphere();
  }, [slots]);

  useEffect(
    () => () => {
      [geometry, material, legendGeometry, legendMaterial, atlas].forEach((r) => r.dispose());
    },
    [geometry, material, legendGeometry, legendMaterial, atlas],
  );

  /** Rest pose per key (cached once) and the current hover influence 0..1 per key. */
  const rest = useMemo(
    () => ({
      position: slots.map((slot) => new THREE.Vector3().setFromMatrixPosition(slot.matrix)),
      quaternion: slots.map((slot) => {
        const q = new THREE.Quaternion();
        slot.matrix.decompose(new THREE.Vector3(), q, new THREE.Vector3());
        return q;
      }),
      normal: slots.map((slot) => new THREE.Vector3().setFromMatrixPosition(slot.matrix).normalize()),
      influence: new Float32Array(slots.length),
      displaced: new Uint8Array(slots.length),
    }),
    [slots],
  );
  /** Hover state: last cursor point on the key shell (sphere-local), spin multiplier, anything still moving. */
  const hover = useRef({ point: new THREE.Vector3(), spin: 1, settled: true });

  /** Scroll progress through the hero, smoothed by GSAP scrub. */
  const scroll = useRef({ progress: 0 });
  /** Spring state for the spin, so scroll lands with mechanical momentum. */
  const spring = useRef({ angle: 0, velocity: 0, idle: 0 });

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const tween = gsap.to(scroll.current, {
      progress: 1,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1.2 },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  useFrame((state, delta) => {
    if (!root.current || !tilt.current || !spin.current) return;
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const progress = scroll.current.progress;

    // Placement (desktop only — the scene does not mount the sphere below 1024 px): right of the headline.
    const diameter = 2 * (SPHERE_RADIUS + KEY_SIZE * 0.35);
    const scale = (SPHERE_HEIGHT * viewport.height) / diameter;
    restPosition.set(viewport.width * SPHERE_OFFSET_X, 0.35, 0.4);

    // Leaves with the hero; on pages without a hero (services, articles, legal, 404) it is not shown at all.
    // Checked every frame (O(1) lookup) so client-side navigation between pages is covered too.
    const onHeroPage = document.getElementById('hero') !== null;
    const presence = onHeroPage ? 1 - THREE.MathUtils.smoothstep(motion.hero, 0.55, 0.95) : 0;
    root.current.visible = presence > 0.01;
    if (!root.current.visible) return;

    target.copy(restPosition);
    target.z -= progress * SCROLL_DEPTH;
    target.y += Math.sin(t * 0.8) * 0.08; // breathing float
    root.current.position.lerp(target, 1 - Math.exp(-6 * dt));
    root.current.scale.setScalar(scale * presence);

    // Pointer tilt, spring-damped via lerp. A small fixed forward lean shows the top rows.
    const alpha = smoothingAlpha(TILT_LERP, dt);
    tilt.current.rotation.x += (0.18 - motion.pointer.y * 0.3 - tilt.current.rotation.x) * alpha;
    tilt.current.rotation.z += (-motion.pointer.x * 0.12 - tilt.current.rotation.z) * alpha;

    // Spin: idle drift + scroll-driven turn through a spring (momentum + slight overshoot).
    const s = spring.current;
    const h = hover.current;
    if (!motion.reducedMotion) s.idle += dt * IDLE_SPIN * h.spin;
    const goal = s.idle + progress * SCROLL_TURN + motion.pointer.x * 0.25;
    s.velocity += (goal - s.angle) * 38 * dt;
    s.velocity *= Math.exp(-7.5 * dt);
    s.angle += s.velocity * dt;
    spin.current.rotation.y = s.angle;

    disperse(state, dt, t, presence);
  });

  /** Radial dispersion: keys near the cursor lift, part and float; they reassemble when it leaves. */
  const disperse = (state: RootState, dt: number, t: number, presence: number) => {
    const h = hover.current;
    const keysMesh = keys.current;
    const legendMesh = legends.current;
    if (!spin.current || !keysMesh || !legendMesh) return;

    // Ray from the camera through the cursor against an invisible sphere around the key tops,
    // so hovering also works over the gaps between keys.
    spin.current.updateWorldMatrix(true, false);
    _hitSphere.center.setFromMatrixPosition(spin.current.matrixWorld);
    _hitSphere.radius = HIT_RADIUS * spin.current.matrixWorld.getMaxScaleOnAxis();
    _pointer.set(motion.pointer.x, motion.pointer.y);
    state.raycaster.setFromCamera(_pointer, state.camera);
    const hovered = presence > 0.5 && !motion.reducedMotion && state.raycaster.ray.intersectSphere(_hitSphere, _hitWorld) !== null;
    if (hovered) {
      // Into sphere-local space, then onto the shell the keys sit on, so distances are along the surface.
      _hitLocal.copy(_hitWorld);
      spin.current.worldToLocal(_hitLocal);
      h.point.copy(_hitLocal).setLength(BASE_RADIUS);
    }

    h.spin += ((hovered ? HOVER_SPIN : 1) - h.spin) * (1 - Math.exp(-SPIN_DAMPING * dt));
    if (!hovered && h.settled) return;

    const alpha = 1 - Math.exp(-DAMPING * dt);
    let moving = false;
    let changed = false;

    for (let i = 0; i < rest.influence.length; i += 1) {
      const basePos = rest.position[i]!;
      const normal = rest.normal[i]!;
      let goal = 0;
      if (hovered) {
        const d = basePos.distanceTo(h.point);
        if (d < INFLUENCE_RADIUS) goal = (1 - d / INFLUENCE_RADIUS) ** 2;
      }
      const w = rest.influence[i]! + (goal - rest.influence[i]!) * alpha;

      if (w < 1e-4 && goal === 0) {
        rest.influence[i] = 0;
        if (rest.displaced[i]) {
          // Snap the last step exactly back to the rest pose.
          _keyMatrix.compose(basePos, rest.quaternion[i]!, _unitScale);
          keysMesh.setMatrixAt(i, _keyMatrix);
          legendMesh.setMatrixAt(i, _legendMatrix.multiplyMatrices(_keyMatrix, LEGEND_ON_TOP));
          rest.displaced[i] = 0;
          changed = true;
        }
        continue;
      }
      rest.influence[i] = w;
      rest.displaced[i] = 1;
      moving = true;
      changed = true;

      // Tangential direction away from the cursor (component of base - hit perpendicular to the normal).
      _tangent.copy(basePos).sub(h.point);
      _tangent.addScaledVector(normal, -_tangent.dot(normal));
      const tangentLength = _tangent.length();
      if (tangentLength > 1e-5) _tangent.multiplyScalar(1 / tangentLength);
      else _tangent.set(0, 0, 0);

      const wobble = Math.sin(t * 2.4 + i * 1.37);
      const sway = Math.cos(t * 1.9 + i * 0.83);

      // Position: lift along the normal, spread away from the cursor, float.
      _position
        .copy(basePos)
        .addScaledVector(normal, (MAX_PUSH + wobble * FLOAT_POSITION) * w)
        .addScaledVector(_tangent, SPREAD_FACTOR * w);

      // Rotation: lean away from the cursor (axis normal × tangent) plus a weightless sway around the tangent.
      _quaternion.copy(rest.quaternion[i]!);
      if (tangentLength > 1e-5) {
        _flareAxis.crossVectors(normal, _tangent).normalize();
        _flareQ.setFromAxisAngle(_flareAxis, (FLARE_TILT + wobble * FLOAT_TILT) * w);
        _wobbleQ.setFromAxisAngle(_tangent, sway * FLOAT_TILT * w);
        _quaternion.premultiply(_flareQ).premultiply(_wobbleQ);
      }

      _keyMatrix.compose(_position, _quaternion, _unitScale);
      keysMesh.setMatrixAt(i, _keyMatrix);
      legendMesh.setMatrixAt(i, _legendMatrix.multiplyMatrices(_keyMatrix, LEGEND_ON_TOP));
    }

    if (changed) {
      keysMesh.instanceMatrix.needsUpdate = true;
      legendMesh.instanceMatrix.needsUpdate = true;
    }
    h.settled = !moving;
  };

  return (
    <group ref={root}>
      <SphereLights />
      <group ref={tilt}>
        <group ref={spin}>
          {/* All keycaps: one draw call */}
          <instancedMesh
            ref={keys}
            args={[geometry, material, slots.length]}
            frustumCulled={false}
            onPointerOver={() => setCursorMode('core')}
            onPointerOut={() => setCursorMode('default')}
            onClick={() => {
              spring.current.velocity += 6;
            }}
          />
          {/* All legends: one draw call, glyph picked per instance from the atlas */}
          <instancedMesh ref={legends} args={[legendGeometry, legendMaterial, slots.length]} raycast={() => null} frustumCulled={false} />
        </group>
      </group>
    </group>
  );
};
