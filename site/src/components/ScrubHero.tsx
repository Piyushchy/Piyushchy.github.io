import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { profile } from "../data";
import { PrismaHero, WordsPullUp } from "./ui/prisma-hero";

/**
 * Scroll-scrubbed hero. Engineering follows the 10k-websites scrub standard:
 * streamed Blob fetch with a loading ring, dt-normalised lerp in a rAF loop that
 * rests, gated seeks, delta-gated DOM writes, caption bands paced in scroll
 * distance, four-layer legibility, five static-hero gates kept live, and a page
 * that is complete without the video.
 */

const HERO_VH = 600; // hero height in viewport heights (scroll range = HERO_VH - 100)
const VIDEO_URL = `${import.meta.env.BASE_URL}media/hero-scrub.mp4`;
const POSTER_URL = `${import.meta.env.BASE_URL}media/hero-poster.jpg`;
const ENDING_URL = `${import.meta.env.BASE_URL}media/hero-ending.jpg`;
const VIDEO_BYTES = 2444578; // real byte size, the fallback when Content-Length is missing

/** Must match the CSS media query in index.css character for character. */
const GATES = [
  "(max-width: 720px)",
  "(orientation: portrait) and (max-width: 1024px)",
  "(orientation: portrait) and (pointer: coarse)",
  "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
  "(prefers-reduced-motion: reduce)",
];

type Fx = "scatter" | "snap" | "rise";
const BANDS: { a: number; b: number }[] = [
  // Timed against the footage: the light bar crosses the upper-left text zone
  // between about 0.12 and 0.40, so band 1 sits low (below the bar's early path)
  // and band 2 waits until the bar has passed.
  { a: 0, b: 0.28 },
  { a: 0.42, b: 0.68 },
  { a: 0.72, b: 1 },
];

const LINE_1 = "Scanned pages. Crooked rows. Smudged columns.";
const LINE_2 = "I make it line up.";
const HEADLINE = "I turn messy documents into structured data.";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p: number, e0: number, e1: number) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Splits text into word and character spans with seeded offsets (identical on every load). */
function Split({ text, fx, seed }: { text: string; fx: Fx; seed: number }) {
  const words = useMemo(() => {
    const r = rng(seed);
    const parts = text.split(" ");
    const total = text.length;
    let idx = 0;
    return parts.map((w, wi) => {
      const chars = [...w].map((ch) => {
        const i = idx++;
        let v: Vars;
        if (fx === "scatter") {
          v = {
            "--th": (r() * 0.55).toFixed(3),
            "--jx": `${((r() - 0.5) * 170).toFixed(0)}px`,
            "--jy": `${((r() - 0.5) * 100).toFixed(0)}px`,
            "--jr": `${((r() - 0.5) * 50).toFixed(0)}deg`,
          };
        } else if (fx === "snap") {
          v = {
            "--th": ((i / total) * 0.5 + r() * 0.06).toFixed(3),
            "--jx": `${(-(36 + r() * 70)).toFixed(0)}px`,
          };
        } else {
          v = {};
        }
        return { ch, v };
      });
      idx++;
      const wv: Vars = fx === "rise" ? { "--th": ((wi / parts.length) * 0.5).toFixed(3) } : {};
      return { chars, wv };
    });
  }, [text, fx, seed]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) => (
          <span key={wi} className="w" style={w.wv}>
            {w.chars.map((c, ci) => (
              <span key={ci} className="c" style={c.v}>
                {c.ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </>
  );
}

function Wordmark() {
  return (
    <div className="wordmark" data-wordmark>
      <span className="sr-only">Piyush Chaudhary</span>
      <span aria-hidden="true">
        <WordsPullUp text="Piyush" />
      </span>
    </div>
  );
}

function HeroLinks() {
  const { links } = profile;
  return (
    <>
      <a
        href="#projects"
        className="group inline-flex items-center gap-2 self-start rounded-full bg-primary py-1 pl-5 pr-1 text-base font-medium text-black transition-all hover:gap-3"
      >
        See the work
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black transition-transform group-hover:scale-110">
          <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
        </span>
      </a>
      <a
        href={links.github}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[44px] items-center rounded-full border border-primary/40 px-5 text-base text-primary transition-colors hover:border-primary"
      >
        GitHub<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </>
  );
}

export default function ScrubHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const staticBgRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const hero = heroRef.current!;
    const stage = stageRef.current!;
    const video = videoRef.current!;
    const poster = posterRef.current!;
    const ring = ringRef.current!;
    const bandEls = bandRefs.current.filter(Boolean) as HTMLDivElement[];

    /* ---------- caption bands (delta-gated writes) ---------- */
    const cache = bandEls.map(() => ({ op: -1, k: -1, vis: "" }));
    let loadK = 0;
    let loadRaf = 0;
    const startLoadRamp = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = clamp((now - t0 - 250) / 1400, 0, 1);
        const e = 1 - Math.pow(1 - t, 3);
        if (e !== loadK) {
          loadK = e;
          updateCaptions(heroProgress());
        }
        if (t < 1) loadRaf = requestAnimationFrame(step);
      };
      loadRaf = requestAnimationFrame(step);
    };

    function heroProgress() {
      const range = hero.offsetHeight - window.innerHeight;
      if (range <= 0) return 0;
      return clamp(-hero.getBoundingClientRect().top / range, 0, 1);
    }

    function updateCaptions(p: number) {
      bandEls.forEach((el, i) => {
        const { a, b } = BANDS[i];
        const f = Math.min(0.04, (b - a) / 3);
        let op = smoothstep(p, a, a + f) * (1 - smoothstep(p, b - f, b));
        if (i === 0) op = 1 - smoothstep(p, b - f, b);
        if (i === BANDS.length - 1) op = smoothstep(p, a, a + f);
        let k = clamp((p - a) / 0.05, 0, 1);
        if (i === 0) k = Math.max(k, loadK);
        const c = cache[i];
        const opR = Math.round(op * 100) / 100;
        if (opR !== c.op) {
          c.op = opR;
          el.style.opacity = String(opR);
        }
        const vis = opR > 0.01 ? "visible" : "hidden";
        if (vis !== c.vis) {
          c.vis = vis;
          el.style.visibility = vis;
          el.dataset.live = opR > 0.6 ? "1" : "0";
        } else if (i === BANDS.length - 1) {
          el.dataset.live = opR > 0.6 ? "1" : "0";
        }
        if (Math.abs(k - c.k) >= 0.008 || (k === 1 && c.k !== 1) || (k === 0 && c.k !== 0)) {
          c.k = k;
          el.style.setProperty("--k", k.toFixed(3));
        }
      });
    }

    /* ---------- gated seeks ---------- */
    let seekBusy = false;
    let pendingTime: number | null = null;
    const requestSeek = (t: number) => {
      if (!video.duration || !isFinite(video.duration)) return;
      if (seekBusy) {
        pendingTime = t;
        return;
      }
      seekBusy = true;
      video.currentTime = clamp(t, 0, video.duration);
    };
    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const t = pendingTime;
        pendingTime = null;
        requestSeek(t);
      }
    };
    const onVideoError = () => {
      seekBusy = false;
      pendingTime = null;
      if (video.src) failVideo(); // a dead video never leaves a stuck ring
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onVideoError);

    /* ---------- lerp loop that rests ---------- */
    let target = 0;
    let shown = 0;
    let rafId: number | null = null;
    let lastTick = 0;
    let heroOnScreen = true;
    const tick = (now: number) => {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      const k = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
      requestSeek(shown * video.duration);
    };
    const onScroll = () => {
      target = heroProgress();
      updateCaptions(target);
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((e) => {
      heroOnScreen = e[0].isIntersecting;
      if (heroOnScreen) onScroll();
    });
    io.observe(hero);

    /* ---------- streamed Blob loader (poster first, honest ring, watchdog) ---------- */
    let videoStarted = false;
    let posterPainted = false;
    let objectUrl = "";
    function failVideo() {
      stage.classList.add("video-failed");
      stage.classList.remove("video-loading", "video-ready");
    }
    async function loadHeroBlob() {
      stage.classList.add("video-loading");
      const ctrl = new AbortController();
      let watchdog = window.setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(VIDEO_URL, { priority: "low", signal: ctrl.signal } as RequestInit);
      if (!res.ok || !res.body) throw new Error("video unavailable");
      const total = Number(res.headers.get("Content-Length")) || VIDEO_BYTES;
      const reader = res.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let got = 0;
      let lastRing = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        clearTimeout(watchdog);
        watchdog = window.setTimeout(() => ctrl.abort(), 20000);
        chunks.push(value as Uint8Array<ArrayBuffer>);
        got += value.length;
        const frac = total ? Math.min(1, got / total) : 0;
        const now = performance.now();
        if (total && (now - lastRing > 100 || frac === 1)) {
          lastRing = now;
          ring.style.setProperty("--ld", String(Math.round(126 * (1 - frac))));
        }
      }
      clearTimeout(watchdog);
      ring.style.setProperty("--ld", "0");
      objectUrl = URL.createObjectURL(new Blob(chunks, { type: res.headers.get("Content-Type") || "video/mp4" }));
      video.src = objectUrl;
      video.load();
      video.addEventListener(
        "canplay",
        () => {
          requestSeek(heroProgress() * video.duration);
          stage.classList.remove("video-loading");
          stage.classList.add("video-ready");
        },
        { once: true },
      );
    }
    function initHeroOnce() {
      if (videoStarted) return;
      videoStarted = true;
      if (!posterPainted) {
        posterPainted = true;
        poster.style.backgroundImage = `url('${POSTER_URL}')`;
      }
      let started = false;
      const go = () => {
        if (started) return;
        started = true;
        loadHeroBlob().catch(failVideo);
      };
      const img = new Image();
      img.onload = go;
      img.onerror = go;
      img.src = POSTER_URL;
      window.setTimeout(go, 4000);
    }

    /* ---------- the five static-hero gates, decided live ---------- */
    let scrubOn = false;
    let staticPainted = false;
    const enableScrub = () => {
      if (scrubOn) return;
      scrubOn = true;
      initHeroOnce();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      cache.forEach((c) => {
        c.op = -1;
        c.k = -1;
        c.vis = "";
      });
      startLoadRamp();
      updateCaptions(heroProgress());
      onScroll();
    };
    const disableScrub = () => {
      if (!scrubOn) return;
      scrubOn = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      cancelAnimationFrame(loadRaf);
    };
    const applyHeroMode = () => {
      if (GATES.some((q) => window.matchMedia(q).matches)) {
        disableScrub();
        if (!staticPainted && staticBgRef.current) {
          staticPainted = true;
          staticBgRef.current.style.backgroundImage = `url('${ENDING_URL}')`;
        }
      } else {
        enableScrub();
      }
    };
    const mqls = GATES.map((q) => window.matchMedia(q));
    mqls.forEach((q) => q.addEventListener("change", applyHeroMode));
    applyHeroMode();

    return () => {
      mqls.forEach((q) => q.removeEventListener("change", applyHeroMode));
      disableScrub();
      io.disconnect();
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onVideoError);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return (
    <section id="top" aria-labelledby="hero-title" className="hero">
      {/* Scrub hero: laptops and desktops */}
      <div ref={heroRef} className="hero-scrub" style={{ height: `${HERO_VH}vh` }}>
        <div ref={stageRef} className="hero-stage video-loading">
          <div ref={posterRef} className="hero-poster" aria-hidden="true" />
          <video
            ref={videoRef}
            className="hero-video"
            preload="none"
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
          />
          <div className="hero-scrim" aria-hidden="true" />

          <div className="band-layer">
            <div
              ref={(el) => {
                bandRefs.current[0] = el;
              }}
              className="band band-1 fx-scatter"
              style={{ opacity: 1 }}
            >
              <p className="band-line">
                <Split text={LINE_1} fx="scatter" seed={11} />
              </p>
              <p className="scroll-cue chip" aria-hidden="true">
                Scroll
              </p>
            </div>
            <div
              ref={(el) => {
                bandRefs.current[1] = el;
              }}
              className="band band-2 fx-snap"
              style={{ visibility: "hidden", opacity: 0 }}
            >
              <p className="band-line">
                <Split text={LINE_2} fx="snap" seed={23} />
              </p>
            </div>
            <div
              ref={(el) => {
                bandRefs.current[2] = el;
              }}
              className="band band-3 fx-rise"
              style={{ visibility: "hidden", opacity: 0 }}
            >
              <h1 id="hero-title" className="band-h1">
                <Split text={HEADLINE} fx="rise" seed={37} />
              </h1>
              <p className="band-sub">{profile.heroSub}</p>
              <div className="band-cta">
                <HeroLinks />
              </div>
            </div>
          </div>

          <Wordmark />

          <svg className="ring chip" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="126" ref={ringRef} style={{ strokeDashoffset: "var(--ld, 126)" }} />
          </svg>
        </div>
      </div>

      {/* Static hero: phones, portrait tablets, reduced motion */}
      <div className="hero-static">
        <PrismaHero
          title="Piyush"
          titleLabel="Piyush Chaudhary"
          headline={HEADLINE}
          description={profile.heroSub}
          ctaLabel="See the work"
          ctaHref="#projects"
          secondaryLabel="GitHub"
          secondaryHref={profile.links.github}
          bgRef={staticBgRef}
        />
      </div>
    </section>
  );
}
