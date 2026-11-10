import type { Dictionary } from '@/lib/i18n/types';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';

/** Four-step delivery process: what working with Devixa looks like. */
export const Process = ({ process }: { process: Dictionary['process'] }) => (
  <section id="process" aria-labelledby="process-title" className="relative px-4 py-28 md:px-8">
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <SectionLabel index="04">{process.label}</SectionLabel>
          <h2 id="process-title" className="type-display mt-5 max-w-[18ch] text-[clamp(1.8rem,4vw,4rem)]">
            {process.title}
          </h2>
        </div>
        <p className="max-w-sm text-fg/70">{process.intro}</p>
      </div>
      <Reveal className="mt-14 grid gap-px border border-line/20 bg-line/20 md:grid-cols-2 lg:grid-cols-4">
        {process.steps.map((step, i) => (
          <div key={step.title} data-reveal className="group relative flex min-h-[300px] flex-col bg-panel/85 p-7 backdrop-blur-md md:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center border border-crimson font-mono text-sm text-crimson transition-colors duration-300 group-hover:bg-crimson group-hover:text-obsidian">
                {i + 1}
              </span>
              <span className="h-px flex-1 bg-line/20" />
            </div>
            <h3 className="mt-10 text-2xl font-semibold leading-tight tracking-tight">{step.title}</h3>
            <p className="mt-4 text-fg/70">{step.body}</p>
          </div>
        ))}
      </Reveal>
    </div>
  </section>
);
