'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { CanvasBoundary } from './CanvasBoundary';

const CyberChromeScene = lazy(() => import('./CyberChromeScene'));

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
          <Suspense fallback={null}>
            <CyberChromeScene />
          </Suspense>
        </CanvasBoundary>
      ) : null}
    </div>
  );
};
