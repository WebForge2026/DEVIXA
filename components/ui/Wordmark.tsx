import { cn } from '@/lib/utils';

/**
 * DX monogram on a 40 × 24 grid. The D keeps its round bowl; the X's left arms reach into
 * the bowl at the top and bottom, so the two letters interlock into one connected mark.
 */
export const DX_VIEWBOX = '0 0 40 24';
/** D with its counter (even-odd fill). */
export const DX_D_PATH = 'M0 0H10A12 12 0 0 1 10 24H0ZM5 5H10A7 7 0 0 1 10 19H5Z';
/** X: two diagonals, positioned to overlap the D's bowl. */
export const DX_X_PATH = 'M15 0H21L40 24H34ZM34 0H40L21 24H15Z';
export const DX_CRIMSON = '#FF2A2A';

/** The DX logo. D uses the current text colour, X is brand crimson. Size it with h-* (width follows). */
export const DxMark = ({ className, title }: { className?: string; title?: string }) => (
  <svg
    viewBox={DX_VIEWBOX}
    className={cn('block h-6 w-auto', className)}
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
  >
    <path d={DX_D_PATH} fill="currentColor" fillRule="evenodd" />
    <path d={DX_X_PATH} fill={DX_CRIMSON} />
  </svg>
);

/** Header logo. */
export const Wordmark = ({ className }: { className?: string }) => <DxMark className={cn('h-[22px]', className)} />;
