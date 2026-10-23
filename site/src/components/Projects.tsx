import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useId, useRef, useState } from "react";
import { projects, type Project } from "../data";
import { reveal } from "../presets";

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Stack({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-2" aria-label="Technologies">
      {items.map((s) => (
        <li key={s} className="border hairline px-2.5 py-1 font-mono text-[0.72rem] text-paper-dim">
          {s}
        </li>
      ))}
    </ul>
  );
}

function ProjectCard({
  p,
  i,
  n,
  progress,
  stack,
}: {
  p: Project;
  i: number;
  n: number;
  progress: MotionValue<number>;
  stack: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const hasDetail = p.built.length > 0 || p.decisions.length > 0;
  // As the next card slides over this one, this one settles back and dims.
  const last = i === n - 1;
  const scale = useTransform(progress, [i / n, 1], [1, last ? 1 : 1 - (n - 1 - i) * 0.035]);
  const shade = useTransform(progress, [i / n, 1], [1, last ? 1 : 1 - (n - 1 - i) * 0.12]);
  const filter = useTransform(shade, (v) => `brightness(${v})`);

  return (
    <div
      className={stack ? "sticky" : undefined}
      style={stack ? { top: `calc(5rem + ${i} * 0.9rem)`, zIndex: i + 1 } : undefined}
    >
      <m.article
        className="stack-card origin-top rounded-2xl border hairline bg-ink-2 p-6 sm:p-8 md:p-12"
        style={stack ? { scale, filter } : undefined}
        aria-labelledby={`${panelId}-t`}
        data-open={open}
      >
      <div className="grid gap-5 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-2">
          <span className="font-display text-5xl leading-none text-signal md:text-6xl" aria-hidden="true">
            {p.index}
          </span>
        </div>

        <div className="md:col-span-10">
          <p className="marker">{p.kind}</p>
          <h3
            id={`${panelId}-t`}
            className={`mt-2 leading-[1.05] ${p.featured ? "text-4xl sm:text-5xl md:text-6xl" : "text-3xl sm:text-4xl"}`}
          >
            {p.title}
          </h3>
          <p className="mt-4 max-w-[40rem] text-paper-dim sm:text-lg">{p.summary}</p>

          <div className="mt-5">
            <Stack items={p.stack} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1">
            {hasDetail && (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`${panelId}-p`}
                onClick={() => setOpen((o) => !o)}
                className="tap gap-2 font-mono text-xs uppercase tracking-[0.14em] text-signal"
              >
                <span aria-hidden="true" className="inline-block w-3 text-center">
                  {open ? "−" : "+"}
                </span>
                {open ? "Hide case study" : "Case study"}
              </button>
            )}
            {p.repo && <ExtLink href={p.repo}>Source</ExtLink>}
            {p.demo && <ExtLink href={p.demo}>Live demo</ExtLink>}
            <span className="font-mono text-[0.72rem] text-paper-faint">{p.status}</span>
          </div>

          {hasDetail && (
            <div id={`${panelId}-p`} className="expander" data-open={open} role="region" aria-label={`${p.title} case study`}>
              <div>
                <div className="grid gap-8 pt-8 sm:grid-cols-2">
                  <div>
                    <h4 className="marker mb-3">The problem</h4>
                    <p className="text-paper-dim">{p.problem}</p>
                    {p.decisions.length > 0 && (
                      <>
                        <h4 className="marker mb-3 mt-8">Decisions &amp; lessons</h4>
                        <ul className="space-y-3 text-paper-dim">
                          {p.decisions.map((d) => (
                            <li key={d} className="flex gap-3">
                              <span className="mt-[0.75em] h-[2px] w-3 shrink-0 bg-signal" aria-hidden="true" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <div>
                    <h4 className="marker mb-3">What I built</h4>
                    <ul className="space-y-3 text-paper-dim">
                      {p.built.map((b) => (
                        <li key={b} className="flex gap-3">
                          <span className="mt-[0.75em] h-[2px] w-3 shrink-0 bg-signal" aria-hidden="true" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </m.article>
    </div>
  );
}

export default function Projects() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const stack = !reduced;
  return (
    <section id="projects" className="py-16 md:py-24" aria-labelledby="projects-title">
      <div className="wrap">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
          <div>
            <m.p className="marker" {...reveal(0)}>
              03 / Selected work
            </m.p>
            <m.h2 id="projects-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
              Projects
            </m.h2>
          </div>
        </div>
        <div ref={ref} className="space-y-6 md:space-y-10">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} p={p} i={i} n={projects.length} progress={scrollYProgress} stack={stack} />
          ))}
        </div>
      </div>
    </section>
  );
}
