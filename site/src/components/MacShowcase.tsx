import { m, useMotionValue, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";

/**
 * Scroll-driven product showcase. The section pins to the viewport, a laptop
 * lid swings open as you scroll, and the screen walks through the table
 * extraction pipeline in four steps. Everything is driven by one scroll
 * progress value (0 to 1). Reduced motion shows the finished state instead.
 */

const COLS = [0, 92, 176, 262, 340];
const ROWS = [0, 44, 84, 124, 164, 204, 244, 284];
const NR = ROWS.length - 1;
const NC = COLS.length - 1;
const N = NR * NC; // 28 cells
const LX = 62; // left page table origin
const LY = 104;
const RS = 0.84; // right sheet scale
const RX = 482;
const RY = 100;

const STEPS = [
  { key: "Scan", caption: "A page arrives. Scanned, skewed, speckled." },
  { key: "Grid", caption: "OpenCV finds the boxes and grid lines." },
  { key: "Read", caption: "A vision-language model reads each cell. Guards throw out text that can't be right." },
  { key: "Export", caption: "The result lands in Excel, merged cells and all." },
];
// scroll ranges (progress 0..1) where each step is on screen
const RANGE: [number, number][] = [
  [0.16, 0.38],
  [0.38, 0.58],
  [0.58, 0.8],
  [0.8, 1.0],
];

const cells = Array.from({ length: N }, (_, k) => {
  const r = Math.floor(k / NC);
  const c = k % NC;
  return { k, r, c, w: COLS[c + 1] - COLS[c], h: ROWS[r + 1] - ROWS[r] };
});
const barLens = [0.78, 0.5, 0.64];
// deterministic scan speckle so the page looks like a real scan and never changes between renders
const SPECKS: [number, number, number][] = Array.from({ length: 46 }, (_, i) => [
  48 + ((i * 97) % 366),
  54 + ((i * 53) % 404),
  0.6 + ((i * 7) % 5) * 0.28,
]);

function Caption({ p, i }: { p: MotionValue<number>; i: number }) {
  const [a, b] = RANGE[i];
  const last = i === STEPS.length - 1;
  const first = i === 0;
  const opacity = useTransform(p, first ? [0.1, 0.18, b - 0.04, b] : last ? [a, a + 0.04, 1, 1] : [a, a + 0.04, b - 0.04, b], first ? [0, 1, 1, 0] : last ? [0, 1, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(p, first ? [0.1, 0.18, b - 0.04, b] : last ? [a, a + 0.04, 1, 1] : [a, a + 0.04, b - 0.04, b], first ? [14, 0, 0, -14] : last ? [14, 0, 0, 0] : [14, 0, 0, -14]);
  return (
    <m.p
      className="absolute inset-x-0 top-0 mx-auto max-w-[26ch] text-balance text-center font-display text-[clamp(1.5rem,3.4vw,2.9rem)] font-medium leading-[1.08] tracking-[-0.03em] sm:max-w-[30ch]"
      style={{ opacity, y }}
    >
      {STEPS[i].caption}
    </m.p>
  );
}

function StepDot({ p, i }: { p: MotionValue<number>; i: number }) {
  const [a, b] = RANGE[i];
  const last = i === STEPS.length - 1;
  const opacity = useTransform(p, last ? [a - 0.02, a + 0.02] : [a - 0.02, a + 0.02, b - 0.02, b + 0.02], last ? [0.3, 1] : [0.3, 1, 1, 0.3]);
  return (
    <m.li className="flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.14em]" style={{ opacity }}>
      <span className="text-signal">{String(i + 1).padStart(2, "0")}</span>
      {STEPS[i].key}
    </m.li>
  );
}

function SheetCell({ idx, k, c, r, w, h }: { idx: MotionValue<number>; k: number; c: number; r: number; w: number; h: number }) {
  const opacity = useTransform(idx, (v) => Math.min(1, Math.max(0, v - k)));
  const x = RX + COLS[c] * RS;
  const y = RY + ROWS[r] * RS;
  const n = 1 + ((r * 3 + c) % 2);
  return (
    <m.g style={{ opacity }}>
      {Array.from({ length: n }).map((_, i) => (
        <rect
          key={i}
          x={x + 7}
          y={y + 10 + i * 9}
          width={Math.max(10, (w * RS - 14) * barLens[(r * 3 + c + i) % 3])}
          height={3}
          rx={1.5}
          fill="#e6eeee"
          opacity={i === 0 ? 0.7 : 0.4}
        />
      ))}
      <rect x={x} y={y} width={w * RS} height={h * RS} fill="none" stroke="#7fd6e6" strokeOpacity={0.35} strokeWidth={0.8} />
    </m.g>
  );
}

function Screen({ p }: { p: MotionValue<number> }) {
  const screenOn = useTransform(p, [0.1, 0.2], [0, 1]);
  const pageIn = useTransform(p, [0.16, 0.26], [0, 1]);
  const draw = useTransform(p, [0.4, 0.52], [0, 1]);
  const boxes = useTransform(p, [0.5, 0.58], [0, 1]);
  const sheetIn = useTransform(p, [0.58, 0.64], [0, 1]);
  const idx = useTransform(p, [0.63, 0.8], [0, N]);
  const hiOn = useTransform(idx, (v) => (v > 0.05 && v < N ? 1 : 0));
  const hiX = useTransform(idx, (v) => LX + COLS[Math.min(NC - 1, Math.floor(Math.min(v, N - 1)) % NC)] + 2);
  const hiY = useTransform(idx, (v) => LY + ROWS[Math.floor(Math.min(v, N - 1) / NC)] + 2);
  const chrome = useTransform(p, [0.8, 0.88], [0, 1]);
  const merged = useTransform(p, [0.86, 0.94], [0, 1]);
  const chip = useTransform(p, [0.9, 0.98], [0, 1]);

  return (
    <m.svg viewBox="0 0 800 500" className="block h-full w-full" style={{ opacity: screenOn }} aria-hidden="true">
      <rect width="800" height="500" fill="#0b161b" />
      {/* window chrome */}
      <rect width="800" height="30" fill="#0f1d23" />
      <circle cx="18" cy="15" r="4.5" fill="#e6eeee" opacity="0.18" />
      <circle cx="34" cy="15" r="4.5" fill="#e6eeee" opacity="0.18" />
      <circle cx="50" cy="15" r="4.5" fill="#e6eeee" opacity="0.18" />
      <text x="400" y="19" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#a3b3b8" letterSpacing="1.4">
        TABLE EXTRACTOR
      </text>

      {/* scanned page, kept crooked like the real input */}
      <m.g style={{ opacity: pageIn }}>
        <g transform="rotate(-2.2 230 258)">
          <rect x="40" y="48" width="380" height="420" rx="3" fill="#13222a" stroke="#e6eeee" strokeOpacity="0.16" />
          {SPECKS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#e6eeee" opacity="0.18" />
          ))}
          <rect x="62" y="68" width="130" height="4" rx="2" fill="#e6eeee" opacity="0.3" />
          <rect x="62" y="80" width="80" height="3" rx="1.5" fill="#e6eeee" opacity="0.16" />
          {cells.map((c) => {
            const n = 1 + ((c.r * 3 + c.c) % 2);
            return Array.from({ length: n }).map((_, i) => (
              <rect
                key={`${c.k}-${i}`}
                x={LX + COLS[c.c] + 8 + ((c.r * 5) % 7) - 3}
                y={LY + ROWS[c.r] + 12 + i * 11 + ((c.c * 3) % 5) - 2}
                width={Math.max(10, (c.w - 16) * barLens[(c.r * 3 + c.c + i) % 3])}
                height={3}
                rx={1.5}
                fill="#e6eeee"
                opacity={i === 0 ? 0.4 : 0.22}
              />
            ));
          })}
          {/* grid lines draw in as OpenCV finds them */}
          <g fill="none" stroke="#7fd6e6" strokeWidth="1.2">
            {ROWS.map((y) => (
              <m.path key={`h${y}`} d={`M${LX} ${LY + y} L${LX + COLS[NC]} ${LY + y}`} style={{ pathLength: draw }} />
            ))}
            {COLS.map((x) => (
              <m.path key={`v${x}`} d={`M${LX + x} ${LY} L${LX + x} ${LY + ROWS[NR]}`} style={{ pathLength: draw }} />
            ))}
          </g>
          {/* detected boxes */}
          <m.g fill="rgba(127,214,230,0.07)" stroke="#7fd6e6" strokeWidth="1" style={{ opacity: boxes }}>
            {cells.map((c) => (
              <rect key={c.k} x={LX + COLS[c.c] + 2} y={LY + ROWS[c.r] + 2} width={c.w - 4} height={c.h - 4} />
            ))}
          </m.g>
          {/* the cell being read */}
          <m.rect width="86" height="38" fill="rgba(127,214,230,0.25)" stroke="#a9e7f1" strokeWidth="1.6" style={{ x: hiX, y: hiY, opacity: hiOn }} />
        </g>
      </m.g>

      {/* the spreadsheet the cells land in */}
      <m.g style={{ opacity: sheetIn }}>
        <rect x="450" y="48" width="320" height="420" rx="3" fill="#0f1d23" stroke="#e6eeee" strokeOpacity="0.16" />
        <m.g style={{ opacity: chrome }}>
          <rect x="450" y="48" width="320" height="22" fill="#e6eeee" opacity="0.06" />
          {["A", "B", "C", "D"].map((l, i) => (
            <text
              key={l}
              x={RX + (COLS[i] + (COLS[i + 1] - COLS[i]) / 2) * RS}
              y="63"
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="9"
              fill="#a3b3b8"
            >
              {l}
            </text>
          ))}
          {Array.from({ length: NR }).map((_, r) => (
            <text
              key={r}
              x="466"
              y={RY + ROWS[r] * RS + 22}
              textAnchor="middle"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="9"
              fill="#a3b3b8"
            >
              {r + 1}
            </text>
          ))}
        </m.g>
        {cells.map((c) => (
          <SheetCell key={c.k} idx={idx} k={c.k} c={c.c} r={c.r} w={c.w} h={c.h} />
        ))}
        {/* a merged header cell across the top row */}
        <m.rect
          x={RX}
          y={RY}
          width={COLS[NC] * RS}
          height={ROWS[1] * RS}
          fill="rgba(127,214,230,0.12)"
          stroke="#7fd6e6"
          strokeWidth="1.4"
          style={{ opacity: merged }}
        />
        <m.g style={{ opacity: chip }}>
          <rect x="560" y="428" width="196" height="26" rx="13" fill="#7fd6e6" />
          <text x="658" y="445" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill="#0a1317" letterSpacing="1.2">
            SAVED AS .XLSX
          </text>
        </m.g>
      </m.g>
    </m.svg>
  );
}

export function Laptop({ p, extra }: { p: MotionValue<number>; extra?: ReactNode }) {
  const rotateX = useTransform(p, [0, 0.16], [86, 0]);
  const scale = useTransform(p, [0, 0.16], [0.86, 1]);
  const glow = useTransform(p, [0.1, 0.22], [0, 1]);
  return (
    <div className="mac-wrap" aria-hidden="true">
      <m.div className="mac-lid" style={{ rotateX, scale }}>
        <div className="mac-bezel">
          <span className="mac-cam" />
          <div className="mac-screen">
            <Screen p={p} />
            {extra}
          </div>
        </div>
      </m.div>
      <div className="mac-base">
        <span className="mac-notch" />
      </div>
      <m.div className="mac-glow" style={{ opacity: glow }} />
    </div>
  );
}

export default function MacShowcase() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const still = useMotionValue(1);
  const p = reduced ? still : scrollYProgress;

  if (reduced) {
    return (
      <section id="pipeline" className="py-16 md:py-24" aria-labelledby="pipeline-title">
        <div className="wrap">
          <p className="marker">02 / One project up close</p>
          <h2 id="pipeline-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl">
            Up close: the table extractor
          </h2>
          <div className="mt-10 flex justify-center">
            <Laptop p={p} />
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.key} className="border-t hairline pt-3">
                <span className="marker text-signal">{String(i + 1).padStart(2, "0")} / {s.key}</span>
                <p className="mt-1 text-paper-dim">{s.caption}</p>
              </li>
            ))}
          </ol>
          <p className="marker mt-6">Illustration of the pipeline, not real data</p>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="pipeline" className="relative h-[300vh]" aria-labelledby="pipeline-title">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-5 overflow-hidden px-4 pt-14 sm:gap-7">
        <div className="text-center">
          <p className="marker">02 / One project up close</p>
          <h2 id="pipeline-title" className="sr-only">
            Up close: the table extractor
          </h2>
        </div>
        <div className="relative h-[clamp(5.5rem,15svh,8rem)] w-full max-w-4xl">
          {STEPS.map((_, i) => (
            <Caption key={i} p={p} i={i} />
          ))}
        </div>
        <Laptop p={p} />
        <ol className="flex flex-wrap justify-center gap-x-6 gap-y-1" aria-label="Pipeline steps">
          {STEPS.map((_, i) => (
            <StepDot key={i} p={p} i={i} />
          ))}
        </ol>
        <p className="marker text-center text-paper-faint">Illustration of the pipeline, not real data</p>
      </div>
    </section>
  );
}
