import { m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef } from "react";
import { profile } from "../data";
import Hero from "./Hero";
import StoryCanvas from "./ui/story-canvas";
import { PrismaHero } from "./ui/prisma-hero";

/**
 * The opening film. One pinned screen, about three screens of scrolling:
 * the name, then a short story in four lines told over a live canvas.
 * Drawn in code, so it never waits on a download and reverses instantly.
 * "Skip intro" jumps past it; reduced motion gets the calm hero instead.
 */
const CAPS: { a: number; b: number; t: string }[] = [
  { a: 0.13, b: 0.32, t: "It starts with input that doesn't behave." },
  { a: 0.36, b: 0.59, t: "I find the structure in it." },
  { a: 0.63, b: 0.84, t: "Then build whatever carries it: pipelines, apps, tools." },
  { a: 0.88, b: 1, t: "Five projects. Two internships. Final year." },
];

function Cap({ p, i }: { p: MotionValue<number>; i: number }) {
  const { a, b, t } = CAPS[i];
  const last = i === CAPS.length - 1;
  const xs = last ? [a, a + 0.04, 1] : [a, a + 0.04, b - 0.04, b];
  const opacity = useTransform(p, xs, last ? [0, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(p, xs, last ? [14, 0, 0] : [14, 0, 0, -14]);
  return (
    <m.p
      className="absolute inset-x-0 bottom-0 mx-auto max-w-[24ch] text-balance text-center font-display text-[clamp(1.5rem,3.6vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em] [text-shadow:var(--tshadow)] sm:max-w-[30ch]"
      style={{ opacity, y }}
    >
      {t}
    </m.p>
  );
}

function Stage() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.4 });
  const fade = useTransform(p, [0.02, 0.1], [1, 0]);
  const events = useTransform(p, (v) => (v < 0.08 ? "auto" : "none"));
  const strip = useTransform(p, [0.1, 0.16, 1], [0, 1, 1]);
  const skip = useTransform(p, [0.08, 0.14, 0.94, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[330vh]" aria-label="Introduction">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <PrismaHero
          title="Piyush"
          titleLabel="Piyush Chaudhary"
          headline={profile.headline}
          description={profile.heroSub}
          ctaLabel="See the work"
          ctaHref="#projects"
          secondaryLabel="GitHub"
          secondaryHref={profile.links.github}
          backdrop={<StoryCanvas progress={p} />}
          contentStyle={{ opacity: fade, pointerEvents: events }}
          scrimStyle={{ opacity: fade }}
        />
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 bottom-2 h-[46%] rounded-b-2xl bg-gradient-to-t from-ink/90 via-ink/50 to-transparent md:rounded-b-[2rem]"
          style={{ opacity: strip }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[clamp(7rem,20svh,10rem)] px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
          <div className="relative h-full">
            {CAPS.map((_, i) => (
              <Cap key={i} p={p} i={i} />
            ))}
          </div>
        </div>
        <m.a
          href="#about"
          className="tap absolute right-5 top-16 z-30 border hairline bg-ink/60 px-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] backdrop-blur-md transition-colors hover:border-signal hover:text-signal"
          style={{ opacity: skip }}
        >
          Skip intro ↓
        </m.a>
      </div>
    </section>
  );
}

export default function Story() {
  const reduced = useReducedMotion();
  return reduced ? <Hero /> : <Stage />;
}
