import { m, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import OrderField from "./ui/order-field";
import { about, profile, timeline } from "../data";
import { reveal } from "../presets";

const FACTS = [
  ["Studying", "B.Tech Computer Engineering, 4th year, K.J. Somaiya"],
  ["Internships", "State Bank of India (two), Mazagon Dock"],
  ["Learning", "Cloud, NLP, and 3D for an anime project"],
];

export function About() {
  return (
    <section id="about" className="py-16 md:py-24" aria-labelledby="about-title">
      <div className="wrap grid gap-8 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-5">
          <m.p className="marker" {...reveal(0)}>
            01 / About
          </m.p>
          <m.h2 id="about-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
            Hi, I'm <span className="text-signal">Piyush</span>.
          </m.h2>
          <m.dl className="mt-10 max-w-[22rem] border-t hairline" {...reveal(0.12, 20)}>
            {FACTS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[6rem_1fr] gap-3 border-b hairline py-3">
                <dt className="marker pt-0.5">{k}</dt>
                <dd className="text-paper-dim">{v}</dd>
              </div>
            ))}
          </m.dl>
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

function Timeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.7", "end 0.6"] });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <ol ref={ref} className="relative mt-10 md:mt-14">
      <span className="absolute bottom-0 left-[7px] top-2 w-px bg-rule" aria-hidden="true" />
      <m.span
        className="absolute bottom-0 left-[7px] top-2 w-px origin-top bg-signal"
        style={{ scaleY: reduced ? 1 : fill }}
        aria-hidden="true"
      />
      {timeline.map((t, i) => (
        <m.li
          key={t.title}
          className="relative grid gap-2 py-8 pl-9 md:grid-cols-12 md:gap-8 md:pl-12"
          {...reveal(i * 0.05)}
        >
          <span className="absolute left-0 top-10 h-[15px] w-[15px] rounded-full border border-signal bg-ink" aria-hidden="true" />
          <p className="marker md:col-span-3 md:pt-2">{t.when}</p>
          <div className="md:col-span-9">
            <h3 className="text-3xl sm:text-4xl">{t.title}</h3>
            <p className="mt-1 text-signal">{t.org}</p>
            {t.note && <p className="mt-3 max-w-xl text-paper-dim">{t.note}</p>}
          </div>
        </m.li>
      ))}
    </ol>
  );
}

export function Experience() {
  return (
    <section id="experience" className="py-16 md:py-24" aria-labelledby="exp-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          07 / Path
        </m.p>
        <m.h2 id="exp-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
          Experience &amp; education
        </m.h2>
        <Timeline />
      </div>
    </section>
  );
}

export function Contact() {
  const { links } = profile;
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: "-25% 0px" });
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(links.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${links.email}`;
    }
  };
  const rows: { label: string; href: string; text: string }[] = [];
  rows.push({ label: "GitHub", href: links.github, text: "github.com/Piyushchy" });
  if (links.linkedin) rows.push({ label: "LinkedIn", href: links.linkedin, text: "Connect on LinkedIn" });
  if (links.resume) rows.push({ label: "Resume", href: links.resume, text: "View and download (PDF, Word, LaTeX)" });

  return (
    <section ref={ref} id="contact" className="px-2 py-10 sm:px-3 md:py-16" aria-labelledby="contact-title">
      <div className="relative mx-auto max-w-[96rem] overflow-hidden rounded-2xl border hairline bg-ink-2/60 md:rounded-[2rem]">
        {seen && <OrderField />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/60 to-ink/75" aria-hidden="true" />
        <div className="wrap relative z-10 py-16 md:py-28">
          <m.p className="marker" {...reveal(0)}>
            08 / Contact
          </m.p>
          <m.h2
            id="contact-title"
            className="mt-3 max-w-[16ch] text-[clamp(2.8rem,9vw,7.5rem)] leading-[0.98] [text-shadow:var(--tshadow)]"
            {...reveal(0.06, 18)}
          >
            Let's build something <span className="text-signal">that holds up</span>.
          </m.h2>
          <m.p className="mt-6 max-w-xl text-paper-dim sm:text-lg" {...reveal(0.12)}>
            I'm open to internships, collaborations and interesting problems. The quickest way to reach me is email.
          </m.p>

          {links.email && (
            <m.div className="mt-10 flex flex-wrap items-center gap-3" {...reveal(0.16)}>
              <a
                href={`mailto:${links.email}`}
                className="group inline-flex max-w-full items-center gap-3 rounded-full bg-primary py-1.5 pl-5 pr-1.5 font-display text-[0.98rem] font-medium text-black transition-all hover:gap-4 sm:pl-6 sm:text-2xl"
              >
                {links.email}
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-primary transition-transform group-hover:scale-110 sm:h-12 sm:w-12" aria-hidden="true">
                  →
                </span>
              </a>
              <button
                type="button"
                onClick={copy}
                className="tap rounded-full border hairline bg-ink/60 px-5 font-mono text-xs uppercase tracking-[0.14em] backdrop-blur-md transition-colors hover:border-signal hover:text-signal"
              >
                {copied ? "Copied" : "Copy email"}
              </button>
              <span className="sr-only" role="status" aria-live="polite">
                {copied ? "Email address copied" : ""}
              </span>
            </m.div>
          )}

          <m.ul className="mt-10 max-w-xl border-t hairline" {...reveal(0.2)}>
            {rows.map((r) => (
              <li key={r.label} className="border-b hairline">
                <a
                  href={r.href}
                  {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex min-h-[56px] items-center justify-between gap-4 py-3 transition-colors hover:text-signal"
                >
                  <span className="marker w-24 shrink-0">{r.label}</span>
                  <span className="flex-1 truncate font-display text-xl sm:text-2xl">{r.text}</span>
                  <span aria-hidden="true" className="font-mono transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                  {r.href.startsWith("http") && <span className="sr-only">(opens in a new tab)</span>}
                </a>
              </li>
            ))}
          </m.ul>
        </div>
      </div>
    </section>
  );
}

const YEAR = new Date().getFullYear();

export function Footer() {
  const year = YEAR;
  return (
    <footer style={{ paddingBottom: "var(--safe-bottom)" }}>
      <div className="pointer-events-none select-none overflow-hidden px-3 pt-6 md:pt-10" aria-hidden="true">
        <p className="whitespace-nowrap bg-gradient-to-b from-paper/25 to-transparent bg-clip-text text-center font-display text-[24vw] font-bold leading-[0.8] tracking-[-0.07em] text-transparent">
          Piyush
        </p>
      </div>
      <div className="border-t hairline">
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
      </div>
    </footer>
  );
}
