'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { CanvasBoundary } from './CanvasBoundary';

const Lanyard = dynamic(() => import('./Lanyard'), { ssr: false });

/** Mounts the lanyard only once the footer approaches the viewport. */
export const LanyardMount = () => {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { rootMargin: '200px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={host} className="absolute inset-0">
      {visible ? (
        <CanvasBoundary>
          <Lanyard />
        </CanvasBoundary>
      ) : null}
    </div>
  );
};
