import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef } from "react";

/**
 * Scroll-filled statement. The sentence sits pinned in the middle of the
 * screen and each word brightens as you scroll, like the big type moments on
 * Apple product pages. Reduced motion shows the sentence fully lit.
 */

type Seg = { t: string; signal?: boolean };
const SEGMENTS: Seg[] = [
  { t: "Audits still arrive as scanned pages." },
  { t: "Crooked rows.", signal: true },
  { t: "Smudged columns.", signal: true },
  { t: "I build the software that turns them into tables a person can trust." },
];

const WORDS = SEGMENTS.flatMap((s) => s.t.split(" ").map((w) => ({ w, signal: !!s.signal })));

function Word({ w, signal, p, i, n }: { w: string; signal: boolean; p: MotionValue<number>; i: number; n: number }) {
  const a = 0.08 + (i / n) * 0.72;
  const b = a + 0.9 / n;
  const opacity = useTransform(p, [a, Math.min(b, 0.95)], [0.16, 1]);
  return (
    <m.span style={{ opacity }} className={signal ? "text-signal" : undefined}>
      {w}{" "}
    </m.span>
  );
}

const TYPE = "mx-auto max-w-[22ch] text-balance font-display text-[clamp(2.1rem,6.6vw,5.4rem)] font-medium leading-[1.04] tracking-[-0.035em] sm:max-w-[26ch]";

export default function Statement() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  if (reduced) {
    return (
      <section id="statement" className="py-24 md:py-32" aria-label="Statement">
        <p className={`wrap text-center ${TYPE}`}>
          {SEGMENTS.map((s, i) => (
            <span key={i} className={s.signal ? "text-signal" : undefined}>
              {s.t}{" "}
            </span>
          ))}
        </p>
      </section>
    );
  }

  return (
    <section ref={ref} id="statement" className="relative h-[240vh]" aria-label="Statement">
      <div className="sticky top-0 flex h-[100svh] items-center px-5">
        <p className={`text-center ${TYPE}`}>
          <span className="sr-only">{SEGMENTS.map((s) => s.t).join(" ")}</span>
          <span aria-hidden="true">
            {WORDS.map((x, i) => (
              <Word key={i} w={x.w} signal={x.signal} p={scrollYProgress} i={i} n={WORDS.length} />
            ))}
          </span>
        </p>
      </div>
    </section>
  );
}
