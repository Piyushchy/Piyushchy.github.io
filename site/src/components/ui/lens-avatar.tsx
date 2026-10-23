import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * A camera lens that looks at you. It stands in for a face: the whole disc
 * tilts toward the cursor, the pupil, iris and glass shift at different
 * depths, the aperture blinks now and then, tightens when the cursor is over
 * a link or button, and snaps on click. With no mouse (touch) it drifts and
 * looks around by itself. Reduced motion shows it still and centred.
 */

const BLADES = 8;
const clamp = (v: number, a = -1, b = 1) => Math.min(b, Math.max(a, v));

function octagon(r: number) {
  const pts: string[] = [];
  for (let i = 0; i < BLADES; i++) {
    const a = (Math.PI * 2 * i) / BLADES + Math.PI / BLADES;
    pts.push(`${(200 + Math.cos(a) * r).toFixed(1)} ${(200 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

export default function LensAvatar({ className = "" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // gaze, -1..1 on each axis
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const sx = useSpring(gx, { stiffness: 120, damping: 16, mass: 0.6 });
  const sy = useSpring(gy, { stiffness: 120, damping: 16, mass: 0.6 });
  // aperture, 0 closed .. 1 open
  const open = useMotionValue(0.82);
  const so = useSpring(open, { stiffness: 260, damping: 24 });

  const rotY = useTransform(sx, (v) => v * 26);
  const rotX = useTransform(sy, (v) => -v * 22);
  const px = useTransform(sx, (v) => v * 30);
  const py = useTransform(sy, (v) => v * 30);
  const ix = useTransform(sx, (v) => v * 14);
  const iy = useTransform(sy, (v) => v * 14);
  const hx = useTransform(sx, (v) => -v * 12);
  const hy = useTransform(sy, (v) => -v * 12);
  const bx = useTransform(sx, (v) => v * 3);
  const by = useTransform(sy, (v) => v * 3);
  const hole = useTransform(so, (v) => octagon(18 + v * 62));
  const retR = useTransform(so, (v) => 62 + (1 - v) * 10);

  useEffect(() => {
    if (reduced) return;
    const el = box.current!;
    let mouse = false;
    let idle = 0;
    let blinkT = 0;
    let over = false;

    const look = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const x = (cx - (r.left + r.width / 2)) / (Math.max(window.innerWidth, 600) * 0.45);
      const y = (cy - (r.top + r.height / 2)) / (Math.max(window.innerHeight, 600) * 0.45);
      gx.set(clamp(x * 1.6));
      gy.set(clamp(y * 1.6));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouse = true;
      look(e.clientX, e.clientY);
      const t = e.target as Element | null;
      const hit = !!t?.closest("a, button, [role='button']");
      if (hit !== over) {
        over = hit;
        open.set(hit ? 0.42 : 0.82);
      }
    };
    const shutter = () => {
      open.set(0.05);
      window.setTimeout(() => open.set(over ? 0.42 : 0.82), 130);
    };
    const blink = () => {
      shutter();
      blinkT = window.setTimeout(blink, 3500 + Math.random() * 3500);
    };
    blinkT = window.setTimeout(blink, 2200);

    // no mouse: look around on its own
    const wander = window.setInterval(() => {
      if (mouse) return;
      idle += 0.5;
      gx.set(Math.sin(idle * 0.9) * 0.7);
      gy.set(Math.cos(idle * 0.6) * 0.45);
    }, 900);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", shutter, { passive: true });
    return () => {
      window.clearTimeout(blinkT);
      window.clearInterval(wander);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", shutter);
    };
  }, [reduced, gx, gy, open]);

  const ticks = Array.from({ length: 72 }, (_, i) => i);

  return (
    <div ref={box} className={`lens-wrap ${className}`} role="img" aria-label="A camera lens that follows your cursor, standing in for a portrait">
      <m.div className="lens-tilt" style={reduced ? undefined : { rotateX: rotX, rotateY: rotY }}>
        <svg viewBox="0 0 400 400" className="lens-svg" aria-hidden="true">
          <defs>
            <radialGradient id="lg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="55%" stopColor="#7fd6e6" stopOpacity="0" />
              <stop offset="82%" stopColor="#7fd6e6" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#7fd6e6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lg-barrel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2c3f47" />
              <stop offset="0.5" stopColor="#101c22" />
              <stop offset="1" stopColor="#223239" />
            </linearGradient>
            <radialGradient id="lg-glass" cx="42%" cy="38%" r="75%">
              <stop offset="0" stopColor="#173440" />
              <stop offset="0.6" stopColor="#0a171d" />
              <stop offset="1" stopColor="#05090c" />
            </radialGradient>
            <radialGradient id="lg-pupil" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#bdf1f9" />
              <stop offset="0.35" stopColor="#4cb9cf" />
              <stop offset="1" stopColor="#0c3340" />
            </radialGradient>
            <path id="lg-text" d="M200 200 m-171 0 a171 171 0 1 1 342 0 a171 171 0 1 1 -342 0" />
            <clipPath id="lg-clip">
              <circle cx="200" cy="200" r="118" />
            </clipPath>
          </defs>

          <circle cx="200" cy="200" r="198" fill="url(#lg-glow)" />

          <m.g style={{ x: bx, y: by }}>
            <circle cx="200" cy="200" r="190" fill="#0b161b" stroke="rgba(230,238,238,0.22)" />
            <g className="lens-spin">
              {ticks.map((i) => (
                <line key={i} x1="200" y1="14" x2="200" y2={i % 6 === 0 ? 28 : 21} stroke="rgba(230,238,238,0.5)" strokeWidth={i % 6 === 0 ? 1.8 : 1} transform={`rotate(${i * 5} 200 200)`} />
              ))}
            </g>
            <circle cx="200" cy="200" r="168" fill="url(#lg-barrel)" stroke="rgba(230,238,238,0.18)" />
            <text fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="3.2" fill="rgba(163,179,184,0.8)">
              <textPath href="#lg-text">PIYUSH CHAUDHARY · 1:1.8 · TABLES · CLOUD · ANDROID · NLP · SCAN ·</textPath>
            </text>
            <circle cx="200" cy="200" r="134" fill="#05090c" stroke="rgba(127,214,230,0.35)" strokeWidth="1.5" />
          </m.g>

          <g clipPath="url(#lg-clip)">
            <circle cx="200" cy="200" r="118" fill="url(#lg-glass)" />
            {/* what the lens sees: a grid, a pupil of light */}
            <m.g style={{ x: px, y: py }}>
              <g stroke="rgba(127,214,230,0.16)" strokeWidth="1">
                {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
                  <g key={i}>
                    <line x1={200 + i * 30} y1="60" x2={200 + i * 30} y2="340" />
                    <line x1="60" y1={200 + i * 30} x2="340" y2={200 + i * 30} />
                  </g>
                ))}
              </g>
              <circle cx="200" cy="200" r="46" fill="url(#lg-pupil)" />
              <circle cx="200" cy="200" r="46" fill="none" stroke="rgba(190,240,248,0.6)" />
            </m.g>
            {/* iris: dark blades with an octagonal opening */}
            <m.g style={{ x: ix, y: iy }}>
              <IrisBlades hole={hole} />
            </m.g>
            {/* reticle brackets tighten as the lens focuses */}
            <m.g style={{ x: px, y: py }}>
              <Reticle r={retR} />
            </m.g>
            {/* glass reflection, opposite the gaze */}
            <m.g style={{ x: hx, y: hy }}>
              <path d="M110 150 A104 104 0 0 1 200 96" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="6" strokeLinecap="round" />
              <circle cx="262" cy="262" r="7" fill="rgba(255,255,255,0.22)" />
            </m.g>
          </g>
        </svg>
      </m.div>
    </div>
  );
}

function IrisBlades({ hole }: { hole: MotionValue<string> }) {
  // big disc with the octagon cut out (even-odd), plus blade seams
  const d = useTransform(hole, (h) => `M200 70 A130 130 0 1 1 199.9 70 Z ${h}`);
  return (
    <>
      <m.path d={d} fill="#05090c" fillRule="evenodd" stroke="rgba(230,238,238,0.18)" />
      <g stroke="rgba(230,238,238,0.12)" strokeWidth="1">
        {Array.from({ length: BLADES }, (_, i) => (
          <line key={i} x1="200" y1="200" x2="200" y2="72" transform={`rotate(${(360 / BLADES) * i + 22.5} 200 200)`} />
        ))}
      </g>
    </>
  );
}

function Corner({ r, sx, sy }: { r: MotionValue<number>; sx: number; sy: number }) {
  const x = useTransform(r, (v) => 200 + sx * v);
  const y = useTransform(r, (v) => 200 + sy * v);
  return <m.path d="M0 0 H16 M0 0 V16" fill="none" stroke="#bdf1f9" strokeWidth="2" strokeLinecap="round" style={{ x, y, scaleX: sx, scaleY: sy }} />;
}

function Reticle({ r }: { r: MotionValue<number> }) {
  return (
    <g opacity="0.9">
      <Corner r={r} sx={-1} sy={-1} />
      <Corner r={r} sx={1} sy={-1} />
      <Corner r={r} sx={-1} sy={1} />
      <Corner r={r} sx={1} sy={1} />
    </g>
  );
}
