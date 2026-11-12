import { ArrowUpRight } from 'lucide-react';
import type { MediaItem } from '@/lib/admin/types';
import type { Dictionary } from '@/lib/i18n/types';
import { Keycap } from '@/components/ui/Keycap';
import { Reveal } from '@/components/ui/Reveal';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

/** Verified deployments rendered as production manifests. */
export const Projects = ({ projects, media = [] }: { projects: Dictionary['projects']; media?: MediaItem[] }) => (
  <section id="work" aria-labelledby="work-title" className="relative px-4 py-28 md:px-8">
    <div className="mx-auto max-w-[1600px]">
      <SectionLabel index="03">{projects.label}</SectionLabel>
      <h2 id="work-title" className="type-display mt-5 max-w-[16ch] text-[clamp(1.8rem,4vw,4rem)]">
        {projects.title}
      </h2>

      <Reveal className="mt-14 space-y-6">
        {projects.items.map((project, i) => (
          <div key={project.name} data-reveal>
            <SpotlightCard className="grid gap-8 p-6 md:p-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex items-center gap-1.5 text-crimson">
                    <span className="h-1.5 w-1.5 animate-blink rounded-full bg-crimson shadow-[0_0_8px_#FF2A2A]" /> Live
                  </span>
                  <span className="hidden sm:inline">{project.sector}</span>
                </div>
                <h3 className="type-display mt-6 text-[clamp(1.6rem,3.4vw,3.5rem)] [overflow-wrap:anywhere]">{project.name}</h3>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-fg/50 sm:hidden">{project.sector}</p>
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex items-center gap-2 border border-line/40 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-colors hover:border-crimson hover:bg-crimson hover:text-obsidian"
                  >
                    {projects.fields.live}: {project.url.replace('https://', '')} <ArrowUpRight size={14} />
                  </a>
                ) : null}
              </div>
              <dl className="grid gap-px self-start border border-line/20 bg-line/20 sm:grid-cols-2 lg:col-span-7">
                {(
                  [
                    [projects.fields.client, project.client],
                    [projects.fields.task, project.task],
                    [projects.fields.solution, project.solution],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="bg-panel p-5">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">{label}</dt>
                    <dd className="mt-2 text-fg/85">{value}</dd>
                  </div>
                ))}
                <div className="bg-panel p-5">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-crimson">{projects.fields.tech}</dt>
                  <dd className="mt-3 flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Keycap key={tech}>{tech}</Keycap>
                    ))}
                  </dd>
                </div>
              </dl>
              {/* Optional images managed in the admin CMS (slot "project-<index>"); nothing renders without them. */}
              {(() => {
                const images = media.filter((m) => m.slot === `project-${i}`);
                if (images.length === 0) return null;
                const [cover, ...thumbs] = images;
                return (
                  <div className="grid gap-3 lg:col-span-12 lg:grid-cols-4">
                    {/* eslint-disable-next-line @next/next/no-img-element -- CMS images are stored as data URLs */}
                    <img src={cover!.src} alt={cover!.alt || project.name} loading="lazy" className="aspect-video w-full border border-line/20 object-cover lg:col-span-4" />
                    {thumbs.map((m) => (
                      // eslint-disable-next-line @next/next/no-img-element -- CMS images are stored as data URLs
                      <img key={m.id} src={m.src} alt={m.alt || project.name} loading="lazy" className="aspect-video w-full border border-line/20 object-cover" />
                    ))}
                  </div>
                );
              })()}
            </SpotlightCard>
          </div>
        ))}
      </Reveal>
    </div>
  </section>
);
