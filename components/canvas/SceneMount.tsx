'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { CanvasBoundary } from './CanvasBoundary';

const CyberChromeScene = dynamic(() => import('./CyberChromeScene'), { ssr: false });

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Client-only mount for the fixed background scene; falls back to the CSS atmosphere without WebGL. */
export const SceneMount = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => setEnabled(supportsWebGL()), []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {enabled ? (
        <CanvasBoundary>
          <CyberChromeScene />
        </CanvasBoundary>
      ) : null}
    </div>
  );
};
