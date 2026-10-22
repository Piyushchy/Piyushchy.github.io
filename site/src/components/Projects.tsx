import { m } from "motion/react";
import { useId, useState } from "react";
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

function ProjectRow({ p, defaultOpen = false }: { p: Project; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const hasDetail = p.built.length > 0 || p.decisions.length > 0;

  return (
    <m.article className="border-t hairline py-8 md:py-12" aria-labelledby={`${panelId}-t`} {...reveal(0.02)}>
      <div className="grid gap-5 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-2">
          <span className="font-serif text-5xl leading-none text-signal md:text-6xl" aria-hidden="true">
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
  );
}

export default function Projects() {
  return (
    <section id="projects" className="py-16 md:py-24" aria-labelledby="projects-title">
      <div className="wrap">
        <div className="mb-10 flex items-end justify-between gap-6 md:mb-14">
          <div>
            <m.p className="marker" {...reveal(0)}>
              02 / Selected work
            </m.p>
            <m.h2 id="projects-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
              Projects
            </m.h2>
          </div>
        </div>
        <div>
          {projects.map((p, i) => (
            <ProjectRow key={p.id} p={p} defaultOpen={i === 0} />
          ))}
          <div className="border-t hairline" />
        </div>
      </div>
    </section>
  );
}
