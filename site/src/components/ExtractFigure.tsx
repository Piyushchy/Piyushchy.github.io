import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

/**
 * The one interactive moment: press and hold to run an "extraction".
 * Holding pulls the scan bar down a crooked, smudged table page; each row
 * straightens and its cells are boxed as the bar passes. Releasing early eases
 * the progress back (never snaps). Completing it keeps the result and reports
 * the cell count. Reduced motion shows the finished state with no hold needed.
 */
const COLS = [0, 92, 176, 262, 340];
const ROWS = [0, 44, 84, 124, 164, 204, 244, 284];
const X0 = 30;
const Y0 = 56;
const NR = ROWS.length - 1;
const NC = COLS.length - 1;
const TABLE_H = ROWS[ROWS.length - 1];
const SKEW_X = [-7, 5, -4, 8, -6, 4, -5];
const SKEW_R = [-1.4, 1, -0.7, 1.6, -1.1, 0.8, -1.2];
const HOLD_SECONDS = 1.8;
const BACK_SECONDS = 2.6;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export default function ExtractFigure({ className = "" }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [done, setDone] = useState(false);
  const [holding, setHolding] = useState(false);
  const st = useRef({ p: 0, holding: false, raf: 0, last: 0, shown: -1, done: false });

  useEffect(() => {
    const svg = svgRef.current!;
    const s = st.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const write = () => {
      const v = Math.round(s.p * 1000) / 1000;
      if (v !== s.shown) {
        s.shown = v;
        svg.style.setProperty("--p", String(v));
        svg.dataset.scan = v > 0 && v < 1 ? "1" : "0";
      }
    };
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - (s.last || now)) / 1000);
      s.last = now;
      if (s.holding) s.p = Math.min(1, s.p + dt / HOLD_SECONDS);
      else if (!s.done) s.p = Math.max(0, s.p - dt / BACK_SECONDS);
      write();
      if (s.p >= 1 && !s.done) {
        s.done = true;
        setDone(true);
      }
      if ((s.holding && s.p < 1) || (!s.holding && !s.done && s.p > 0)) {
        s.raf = requestAnimationFrame(step);
      } else {
        s.raf = 0;
        s.last = 0;
      }
    };
    const kick = () => {
      if (!s.raf) s.raf = requestAnimationFrame(step);
    };
    (svg as unknown as { _kick: () => void })._kick = kick;
    const applyReduce = () => {
      if (reduce.matches) {
        s.p = 1;
        s.done = true;
        setDone(true);
        write();
      }
    };
    applyReduce();
    reduce.addEventListener("change", applyReduce);
    return () => {
      reduce.removeEventListener("change", applyReduce);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  const hold = (on: boolean) => {
    const s = st.current;
    s.holding = on;
    setHolding(on);
    (svgRef.current as unknown as { _kick?: () => void })._kick?.();
  };

  const cells: { x: number; y: number; w: number; h: number; r: number; c: number }[] = [];
  for (let r = 0; r < NR; r++)
    for (let c = 0; c < NC; c++)
      cells.push({ x: X0 + COLS[c], y: Y0 + ROWS[r], w: COLS[c + 1] - COLS[c], h: ROWS[r + 1] - ROWS[r], r, c });

  return (
    <figure className={className}>
      <button
        type="button"
        className="extract-btn block w-full text-left"
        aria-label={done ? "Extraction complete: 28 cells found" : "Run extraction. Press and hold."}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          hold(true);
        }}
        onPointerUp={() => hold(false)}
        onPointerCancel={() => hold(false)}
        onKeyDown={(e) => {
          if ((e.key === " " || e.key === "Enter") && !e.repeat) {
            e.preventDefault();
            hold(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") hold(false);
        }}
        onBlur={() => hold(false)}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 400 420"
          aria-hidden="true"
          className="extract-svg h-auto w-full"
          style={{ "--p": 0 } as Vars}
        >
          <rect x="6" y="6" width="388" height="408" rx="3" fill="#0f1a20" stroke="#e6eeee" strokeOpacity="0.16" />
          <rect x="30" y="24" width="120" height="4" rx="2" fill="#e6eeee" opacity="0.28" />
          <rect x="30" y="34" width="70" height="3" rx="1.5" fill="#e6eeee" opacity="0.14" />
          <text x="370" y="30" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#a3b3b8" letterSpacing="1.2">
            PAGE 01
          </text>

          {/* grid lines straighten from crooked to square as the bar passes */}
          {ROWS.map((y, r) => (
            <line
              key={`h${y}`}
              className="ex-row"
              style={{ "--r": r, "--sx": `${SKEW_X[r % NR]}px`, "--sr": `${SKEW_R[r % NR]}deg` } as Vars}
              x1={X0}
              x2={X0 + COLS[NC]}
              y1={Y0 + y}
              y2={Y0 + y}
              stroke="#e6eeee"
              strokeOpacity="0.24"
            />
          ))}
          {COLS.map((x, c) => (
            <line
              key={`v${x}`}
              className="ex-col"
              style={{ "--c": c } as Vars}
              x1={X0 + x}
              x2={X0 + x}
              y1={Y0}
              y2={Y0 + TABLE_H}
              stroke="#e6eeee"
              strokeOpacity="0.24"
            />
          ))}

          {/* ink marks: smudged rows shift into place */}
          {Array.from({ length: NR }).map((_, r) => (
            <g
              key={r}
              className="ex-row"
              style={{ "--r": r, "--sx": `${SKEW_X[r]}px`, "--sr": `${SKEW_R[r]}deg` } as Vars}
            >
              {cells
                .filter((c) => c.r === r)
                .map((c) => {
                  const n = 1 + ((r * 3 + c.c) % 2);
                  const lens = [0.78, 0.5, 0.64];
                  return Array.from({ length: n }).map((_, i) => (
                    <rect
                      key={`${c.c}-${i}`}
                      x={c.x + 8}
                      y={c.y + 12 + i * 11}
                      width={Math.max(10, (c.w - 16) * lens[(r * 3 + c.c + i) % 3])}
                      height={3}
                      rx={1.5}
                      fill="#e6eeee"
                      opacity={i === 0 ? 0.34 : 0.2}
                    />
                  ));
                })}
            </g>
          ))}

          {/* detected cell boxes appear row by row */}
          <g fill="none" stroke="#7fd6e6" strokeWidth="1.25">
            {cells.map((c, i) => (
              <rect
                key={i}
                className="ex-cell"
                style={{ "--r": c.r } as Vars}
                x={c.x + 2}
                y={c.y + 2}
                width={c.w - 4}
                height={c.h - 4}
              />
            ))}
          </g>

          <g className="ex-scan" transform={`translate(0 ${Y0})`}>
            <g className="ex-scan-move">
              <rect x={X0 - 14} y="-10" width={COLS[NC] + 28} height="20" fill="url(#exglow)" />
              <line x1={X0 - 14} x2={X0 + COLS[NC] + 14} y1="0" y2="0" stroke="#7fd6e6" strokeWidth="1.5" />
            </g>
          </g>
          <defs>
            <linearGradient id="exglow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7fd6e6" stopOpacity="0" />
              <stop offset="0.5" stopColor="#7fd6e6" stopOpacity="0.22" />
              <stop offset="1" stopColor="#7fd6e6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="30" y={Y0 + TABLE_H + 26} width="250" height="3" rx="1.5" fill="#e6eeee" opacity="0.16" />
          <rect x="30" y={Y0 + TABLE_H + 36} width="180" height="3" rx="1.5" fill="#e6eeee" opacity="0.1" />
        </svg>
        <span className="marker mt-3 flex items-center justify-between gap-4">
          <span>Fig. 1 · a page, read</span>
          <span className={done ? "text-signal" : holding ? "text-signal" : ""} aria-live="polite">
            {done ? "28 cells found" : holding ? "Reading…" : "Press and hold"}
          </span>
        </span>
      </button>
    </figure>
  );
}
