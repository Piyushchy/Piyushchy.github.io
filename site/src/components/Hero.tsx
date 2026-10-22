import { m } from "motion/react";
import { profile } from "../data";
import { reveal } from "../presets";
import ScanFigure from "./ScanFigure";

export default function Hero() {
  const { links } = profile;
  return (
    <section id="top" className="relative pt-24 sm:pt-28 md:pt-32" aria-labelledby="hero-title">
      <div className="wrap grid items-end gap-10 pb-16 md:grid-cols-12 md:gap-8 md:pb-24">
        <div className="md:col-span-7 lg:col-span-7">
          <m.p className="marker" {...reveal(0)}>
            <span className="text-signal">●</span>&nbsp; {profile.role}
          </m.p>
          <m.h1
            id="hero-title"
            className="mt-6 text-[clamp(2.6rem,9.5vw,6.4rem)] leading-[0.98]"
            {...reveal(0.08, 18)}
          >
            I turn messy documents into{" "}
            <em className="text-signal" style={{ fontStyle: "italic" }}>
              structured data
            </em>
            .
          </m.h1>
          <m.p
            className="mt-7 max-w-[34rem] text-[1.0625rem] text-paper-dim sm:text-lg"
            {...reveal(0.16)}
          >
            {profile.intro}
          </m.p>

          <m.div className="mt-9 flex flex-wrap items-center gap-x-3 gap-y-3" {...reveal(0.24)}>
            <a
              href="#projects"
              className="tap bg-signal px-6 font-medium text-ink transition-colors hover:bg-paper"
            >
              See the projects
            </a>
            {links.resume ? (
              <a href={links.resume} className="tap border hairline px-6 transition-colors hover:border-signal hover:text-signal">
                Resume
              </a>
            ) : (
              <a href="#contact" className="tap border hairline px-6 transition-colors hover:border-signal hover:text-signal">
                Get in touch
              </a>
            )}
            <span className="flex items-center gap-4 sm:ml-2">
              <a
                href={links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]"
              >
                GitHub<span className="sr-only"> (opens in a new tab)</span>
              </a>
              {links.linkedin && (
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]"
                >
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </span>
          </m.div>
        </div>

        <m.div className="md:col-span-5" {...reveal(0.2, 20)}>
          <ScanFigure className="mx-auto w-full max-w-[22rem] md:max-w-none" />
        </m.div>
      </div>
      <div className="wrap">
        <div className="border-t hairline" />
      </div>
    </section>
  );
}
