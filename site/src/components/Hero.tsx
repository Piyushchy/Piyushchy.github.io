import { useEffect, useRef, useState } from "react";
import { profile } from "../data";
import { PrismaHero } from "./ui/prisma-hero";

/**
 * Opening screen. The short clip plays once on its own, then rests on its
 * last frame. Nothing is tied to scrolling. Visitors who prefer reduced
 * motion, have Data Saver on, or are on a slow connection get the still
 * image instead and never download the video.
 */
const BASE = import.meta.env.BASE_URL;
const VIDEO = `${BASE}media/hero-scrub.mp4`;
const POSTER = `${BASE}media/hero-poster.jpg`;
const ENDING = `${BASE}media/hero-ending.jpg`;

type Conn = { saveData?: boolean; effectiveType?: string };

function canPlayVideo() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: Conn }).connection;
  if (c?.saveData) return false;
  if (c?.effectiveType && /^(slow-2g|2g|3g)$/.test(c.effectiveType)) return false;
  return true;
}

export default function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const [video] = useState(canPlayVideo);

  useEffect(() => {
    // Without the video, paint the still. With it, the poster covers the wait.
    if (!video && bgRef.current) bgRef.current.style.backgroundImage = `url(${ENDING})`;
  }, [video]);

  return (
    <div id="top">
      <PrismaHero
        title="Piyush"
        titleLabel="Piyush Chaudhary"
        headline={profile.headline}
        description={profile.heroSub}
        ctaLabel="See the work"
        ctaHref="#projects"
        secondaryLabel="GitHub"
        secondaryHref={profile.links.github}
        videoSrc={video ? VIDEO : undefined}
        videoPoster={POSTER}
        bgRef={bgRef}
      />
    </div>
  );
}
