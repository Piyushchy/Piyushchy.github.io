import { m } from "motion/react";
import { about, learning, profile, skillGroups, timeline } from "../data";
import { reveal } from "../presets";
import ExtractFigure from "./ExtractFigure";

export function About() {
  return (
    <section id="about" className="py-16 md:py-24" aria-labelledby="about-title">
      <div className="wrap grid gap-8 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <m.p className="marker" {...reveal(0)}>
            01 / About
          </m.p>
          <m.h2 id="about-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
            Where things <span className="text-signal">break</span>, I look.
          </m.h2>
          <m.div className="mt-10 max-w-[22rem]" {...reveal(0.12, 20)}>
            <ExtractFigure />
          </m.div>
        </div>
        <div className="space-y-6 text-paper-dim sm:text-lg md:col-span-6 md:col-start-7">
          {about.map((para, i) => (
            <m.p key={i} {...reveal(i * 0.08)}>
              {para}
            </m.p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" className="py-16 md:py-24" aria-labelledby="skills-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          03 / Toolbox
        </m.p>
        <m.h2 id="skills-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
          Skills
        </m.h2>
        <m.p className="mt-4 max-w-xl text-paper-dim" {...reveal(0.1)}>
          Only things I've actually used in the projects above.
        </m.p>

        <dl className="mt-10 border-t hairline md:mt-14">
          {skillGroups.map((g) => (
            <m.div
              key={g.label}
              className="grid gap-3 border-b hairline py-6 md:grid-cols-12 md:gap-8"
              {...reveal(0.03)}
            >
              <dt className="marker md:col-span-4 md:pt-1">{g.label}</dt>
              <dd className="md:col-span-8">
                <ul className="flex flex-wrap gap-x-5 gap-y-2 font-display text-2xl sm:text-[1.7rem]">
                  {g.items.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </dd>
            </m.div>
          ))}
        </dl>

        <m.p className="mt-8 max-w-2xl text-paper-dim" {...reveal(0)}>
          <span className="marker mr-3 text-signal">{learning.label}</span>
          {learning.text}
        </m.p>
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experience" className="py-16 md:py-24" aria-labelledby="exp-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          04 / Path
        </m.p>
        <m.h2 id="exp-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
          Experience &amp; education
        </m.h2>
        <ol className="mt-10 border-t hairline md:mt-14">
          {timeline.map((t, i) => (
            <m.li
              key={t.title}
              className="grid gap-2 border-b hairline py-8 md:grid-cols-12 md:gap-8"
              {...reveal(i * 0.08)}
            >
              <p className="marker md:col-span-3 md:pt-2">{t.when}</p>
              <div className="md:col-span-9">
                <h3 className="text-3xl sm:text-4xl">{t.title}</h3>
                <p className="mt-1 text-signal">{t.org}</p>
                <p className="mt-3 max-w-xl text-paper-dim">{t.note}</p>
              </div>
            </m.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  const { links } = profile;
  const rows: { label: string; href: string; text: string; external: boolean }[] = [];
  if (links.email) rows.push({ label: "Email", href: `mailto:${links.email}`, text: links.email, external: false });
  rows.push({ label: "GitHub", href: links.github, text: "github.com/Piyushchy", external: true });
  if (links.linkedin) rows.push({ label: "LinkedIn", href: links.linkedin, text: "Connect on LinkedIn", external: true });

  return (
    <section id="contact" className="py-16 md:py-28" aria-labelledby="contact-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          05 / Contact
        </m.p>
        <m.h2
          id="contact-title"
          className="mt-3 text-[clamp(2.8rem,10vw,7.5rem)] leading-[0.98]"
          {...reveal(0.06, 18)}
        >
          Got a document that <span className="text-signal">won't behave</span>?
        </m.h2>
        <m.p className="mt-6 max-w-xl text-paper-dim sm:text-lg" {...reveal(0.12)}>
          I'm open to internships, collaborations and interesting problems. The quickest way to reach me is below.
        </m.p>

        <m.ul className="mt-10 border-t hairline" {...reveal(0.16)}>
          {rows.map((r) => (
            <li key={r.label} className="border-b hairline">
              <a
                href={r.href}
                {...(r.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex min-h-[64px] items-center justify-between gap-4 py-4 transition-colors hover:text-signal"
              >
                <span className="marker w-24 shrink-0">{r.label}</span>
                <span className="flex-1 truncate font-display text-2xl sm:text-3xl">{r.text}</span>
                <span aria-hidden="true" className="font-mono transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
                {r.external && <span className="sr-only">(opens in a new tab)</span>}
              </a>
            </li>
          ))}
        </m.ul>
      </div>
    </section>
  );
}

const YEAR = new Date().getFullYear();

export function Footer() {
  const year = YEAR;
  return (
    <footer className="border-t hairline" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="wrap flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-paper-dim">
          © {year} {profile.name}
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <a href="https://github.com/Piyushchy" target="_blank" rel="noopener noreferrer" className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]">
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          {profile.links.linkedin && (
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]">
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <a href="#top" className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]">
            Back to top ↑
          </a>
        </nav>
      </div>
    </footer>
  );
}
