import { cn } from '@/lib/utils';

/**
 * DX monogram, two ribbons on a 45 × 32 grid:
 * - ribbon 1: upper stem + top bar, bending down into the X's "\" (text colour)
 * - ribbon 2: lower stem + bottom bar, bending up into the X's "/" (crimson gradient, on top)
 * The rounded bends close the D; where the ribbons cross they form the X.
 */
export const DX_VIEWBOX = '0 0 45 32';
export const DX_STROKE = 6.4;
export const DX_RIBBON_TOP = 'M3.2 13.6V3.2H8.5C14.5 3.2 18.2 5.4 21.4 9.4L47 37';
export const DX_RIBBON_BOTTOM = 'M3.2 18.4V28.8H8.5C14.5 28.8 18.2 26.6 21.4 22.6L47 -5';
export const DX_GRADIENT = [
  ['0', '#990000'],
  ['0.55', '#FF2A2A'],
  ['1', '#FF5A3C'],
] as const;

/**
 * The DX logo. Ribbon 1 uses the current text colour. Size it with h-* (width follows).
 * `id` keeps gradient/clip ids unique when several marks are on one page.
 */
export const DxMark = ({ className, id = 'dx' }: { className?: string; id?: string }) => (
  <svg viewBox={DX_VIEWBOX} className={cn('block h-6 w-auto overflow-visible', className)} aria-hidden>
    <defs>
      <clipPath id={`${id}-clip`}>
        <rect width="45" height="32" />
      </clipPath>
      <linearGradient id={`${id}-red`} x1="0" y1="1" x2="1" y2="0">
        {DX_GRADIENT.map(([offset, color]) => (
          <stop key={offset} offset={offset} stopColor={color} />
        ))}
      </linearGradient>
    </defs>
    <g clipPath={`url(#${id}-clip)`} fill="none" strokeWidth={DX_STROKE} strokeLinejoin="round">
      <path d={DX_RIBBON_TOP} stroke="currentColor" />
      <path d={DX_RIBBON_BOTTOM} stroke={`url(#${id}-red)`} />
    </g>
  </svg>
);

/** Header logo. */
export const Wordmark = ({ className }: { className?: string }) => <DxMark id="dx-header" className={cn('h-[26px]', className)} />;
