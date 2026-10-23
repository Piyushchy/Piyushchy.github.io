import { m as motion, useInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import type { CSSProperties, ReactNode, Ref } from "react";

/*
 * PrismaHero, integrated from the supplied component.
 *
 * Changes from the original, all deliberate:
 *  - `motion`/`useInView` come from "motion/react" (Motion is the current name of
 *    Framer Motion) and `motion` is the lightweight `m` component, so it works
 *    inside the site's LazyMotion setup without shipping the full bundle twice.
 *  - Content is props instead of hard-coded Prisma text, and the remote cloudfront
 *    video is optional (`videoSrc`); the site passes a still image instead.
 *  - Colours use the site tokens (`text-primary`, `--text-primary`) rather than a
 *    hard-coded cream.
 *  - Body copy is a readable size on phones, and the CTA is a real link.
 */

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 20, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- WordsPullUpMultiStyle ---------------- */
interface Segment {
  text: string;
  className?: string;
}

interface WordsPullUpMultiStyleProps {
  segments: Segment[];
  className?: string;
  style?: CSSProperties;
}

export const WordsPullUpMultiStyle = ({ segments, className = "", style }: WordsPullUpMultiStyleProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const words: { word: string; className?: string }[] = [];
  segments.forEach((seg) => {
    seg.text.split(" ").forEach((w) => {
      if (w) words.push({ word: w, className: seg.className });
    });
  });

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ y: 20, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${w.className ?? ""}`}
          style={{ marginRight: "0.25em" }}
        >
          {w.word}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------------- Hero ---------------- */
export interface PrismaHeroProps {
  /** The big wordmark at the bottom-left. */
  title: string;
  /** Accessible full name for the wordmark (defaults to `title`). */
  titleLabel?: string;
  /** Optional H1 shown above the description. When set, it is the page's h1. */
  headline?: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  /** Optional pill nav like the original. The site already has a header, so it is off by default. */
  navItems?: { label: string; href: string }[];
  /** Optional element drawn behind the copy (a canvas, an image). */
  backdrop?: ReactNode;
  /** Optional background video, like the original. */
  videoSrc?: string;
  /** Poster shown until the video can play. */
  videoPoster?: string;
  /** Ref to the background layer so the caller can paint its image lazily. */
  bgRef?: Ref<HTMLDivElement>;
  showAsterisk?: boolean;
}

const PrismaHero = ({
  title,
  titleLabel,
  headline,
  description,
  ctaLabel,
  ctaHref,
  secondaryLabel,
  secondaryHref,
  navItems,
  videoSrc,
  videoPoster,
  backdrop,
  bgRef,
  showAsterisk = false,
}: PrismaHeroProps) => {
  return (
    <section className="min-h-[100svh] w-full p-2 sm:p-3">
      <div className="relative min-h-[calc(100svh-1rem)] w-full overflow-hidden rounded-2xl bg-[var(--canvas)] sm:min-h-[calc(100svh-1.5rem)] md:rounded-[2rem]">
        {/* Background video */}
        {videoSrc && (
          <video
            autoPlay
            muted
            playsInline
            preload="auto"
            poster={videoPoster}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
            src={videoSrc}
          />
        )}
        {backdrop}
        {/* Background image, painted by the caller */}
        <div ref={bgRef} aria-hidden="true" className="absolute inset-0 bg-cover bg-[60%_center]" />

        {/* Noise overlay */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-overlay" />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        {/* Legibility scrim for the copy */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/20" />

        {/* Navbar */}
        {navItems && navItems.length > 0 && (
          <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2" aria-label="Hero">
            <div className="flex items-center gap-3 rounded-b-2xl bg-black px-4 py-2 sm:gap-6 md:gap-12 md:rounded-b-3xl md:px-8 lg:gap-14">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[10px] text-primary/80 transition-colors hover:text-primary sm:text-xs md:text-sm"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 sm:px-6 md:px-10">
          <div className="grid grid-cols-12 items-end gap-4">
            <div className="col-span-12 lg:col-span-8">
              {headline ? (
                <>
                  <h1 className="max-w-[18ch] font-display text-[clamp(2.1rem,9.4vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.035em] text-primary [text-shadow:var(--tshadow)]">
                    {headline}
                  </h1>
                  <div
                    className="mt-6 whitespace-nowrap font-display font-bold leading-[0.85] tracking-[-0.07em] text-primary text-[25vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]"
                    style={{ fontSize: "min(25vw, 22vh, 14rem)" }}
                  >
                    <span className="sr-only">{titleLabel ?? title}</span>
                    <span aria-hidden="true">
                      <WordsPullUp text={title} showAsterisk={showAsterisk} />
                    </span>
                  </div>
                </>
              ) : (
                <h1 className="font-display font-medium leading-[0.85] tracking-[-0.07em] text-primary text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw]">
                  <WordsPullUp text={title} showAsterisk={showAsterisk} />
                </h1>
              )}
            </div>

            <div className="col-span-12 flex flex-col gap-5 pb-6 lg:col-span-4 lg:pb-10">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm text-primary/85 sm:text-base md:text-lg"
                style={{ lineHeight: 1.35 }}
              >
                {description}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap items-center gap-3"
              >
                <a
                  href={ctaHref}
                  className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-sm font-medium text-black transition-all hover:gap-3 sm:text-base"
                >
                  {ctaLabel}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                    <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                  </span>
                </a>
                {secondaryLabel && secondaryHref && (
                  <a
                    href={secondaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center rounded-full border border-primary/40 px-5 text-sm text-primary transition-colors hover:border-primary sm:text-base"
                  >
                    {secondaryLabel}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { PrismaHero };
