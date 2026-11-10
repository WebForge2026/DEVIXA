import { cn } from '@/lib/utils';

/** 8-point spike-star glyph + DEVIXA wordmark. */
export const StarGlyph = ({ className }: { className?: string }) => {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 12 : 4.6;
    return `${(12 + Math.cos(a) * r).toFixed(2)},${(12 + Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} aria-hidden>
      <polygon points={points} fill="currentColor" />
    </svg>
  );
};

export const Wordmark = ({ className }: { className?: string }) => (
  <span className={cn('flex items-center gap-2', className)}>
    <StarGlyph className="text-crimson" />
    <span className="type-display text-[22px] leading-none">Devixa</span>
  </span>
);
