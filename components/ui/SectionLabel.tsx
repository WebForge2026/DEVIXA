import { cn } from '@/lib/utils';

/** Industrial section tag: index · label, with a live status LED. */
export const SectionLabel = ({ index, children, className }: { index: string; children: string; className?: string }) => (
  <div className={cn('flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted', className)}>
    <span className="h-1.5 w-1.5 animate-blink bg-crimson shadow-[0_0_10px_#FF2A2A]" />
    <span className="text-fg">{index}</span>
    <span className="h-px w-8 bg-line/50" />
    <span>{children}</span>
  </div>
);
