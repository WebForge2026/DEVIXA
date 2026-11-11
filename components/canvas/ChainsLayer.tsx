'use client';

import { Physics } from '@react-three/rapier';
import { Chains } from './Chains';

/**
 * The chain physics world. Loaded lazily by CyberChromeScene only when ENABLE_CHAINS is true,
 * so with the chains switched off neither their code nor the physics engine is downloaded.
 */
const ChainsLayer = ({ compact }: { compact: boolean }) => (
  <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
    <Chains compact={compact} />
  </Physics>
);

export default ChainsLayer;
