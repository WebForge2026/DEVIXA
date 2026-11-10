import * as THREE from 'three';

/** Mirror-polished chrome. Reflections come entirely from the procedural environment. */
export const createChrome = (roughness = 0.1) =>
  new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 1,
    roughness,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.25,
  });

export const createBlackPlastic = () =>
  new THREE.MeshPhysicalMaterial({
    color: '#0b0b0e',
    metalness: 0.2,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });

export const createCrimsonGlass = () =>
  new THREE.MeshPhysicalMaterial({
    color: '#FF2A2A',
    emissive: '#990000',
    emissiveIntensity: 0.6,
    metalness: 0.1,
    roughness: 0.15,
    clearcoat: 1,
  });

/** Closed stadium-shaped path: the centre line of a single chain link. */
class StadiumCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly halfStraight: number,
    private readonly radius: number,
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const straight = this.halfStraight * 2;
    const arc = Math.PI * this.radius;
    const perimeter = straight * 2 + arc * 2;
    let d = t * perimeter;

    if (d < straight) return target.set(-this.halfStraight + d, this.radius, 0);
    d -= straight;
    if (d < arc) {
      const a = Math.PI / 2 - d / this.radius;
      return target.set(this.halfStraight + Math.cos(a) * this.radius, Math.sin(a) * this.radius, 0);
    }
    d -= arc;
    if (d < straight) return target.set(this.halfStraight - d, -this.radius, 0);
    d -= straight;
    const a = -Math.PI / 2 - d / this.radius;
    return target.set(-this.halfStraight + Math.cos(a) * this.radius, Math.sin(a) * this.radius, 0);
  }
}

/** Heavy industrial chain link, long axis on X. */
export const createChainLinkGeometry = (pitch: number, wire = 0.055) => {
  const radius = 0.15;
  const halfStraight = pitch / 2 - radius + wire * 1.6;
  return new THREE.TubeGeometry(new StadiumCurve(halfStraight, radius), 72, wire, 14, true);
};

/** Multi-pointed star with hard bevels: the Devixa core. */
export const createStarGeometry = (points: number, outer: number, inner: number, depth: number, bevel: number) => {
  const shape = new THREE.Shape();
  const count = points * 2;
  for (let i = 0; i <= count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.85,
    bevelSegments: 1,
    curveSegments: 1,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
};

/** Radial glow sprite texture for optical flares. */
export const createGlowTexture = (inner: string, outer: string) => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.25, outer);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

/** Small square canvas texture with a single mono legend, for keycap tops. */
export const createLegendTexture = (legend: string, color: string) => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = color;
    ctx.font = `700 ${legend.length > 1 ? 36 : 64}px ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(legend, size / 2, size / 2 + 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};
