/**
 * Hero visual: an abstract scanned table page. Orange boxes "detect" cells one
 * by one while a scan line sweeps down, echoing what the extraction pipeline does.
 * Purely decorative (aria-hidden); the caption says it is an illustration.
 */
const COLS = [0, 92, 176, 262, 340]; // x edges
const ROWS = [0, 44, 84, 124, 164, 204, 244, 284]; // y edges (first row = header)
const X0 = 30;
const Y0 = 56;

function Bars({ x, y, w, seed }: { x: number; y: number; w: number; seed: number }) {
  const lens = [0.78, 0.5, 0.64];
  const n = 1 + (seed % 2);
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <rect
          key={i}
          x={x + 8}
          y={y + 12 + i * 11}
          width={Math.max(10, (w - 16) * lens[(seed + i) % 3])}
          height={3}
          rx={1.5}
          fill="#ece7dc"
          opacity={i === 0 ? 0.32 : 0.18}
        />
      ))}
    </>
  );
}

export default function ScanFigure({ className = "" }: { className?: string }) {
  const cells: { x: number; y: number; w: number; h: number; r: number; c: number }[] = [];
  for (let r = 0; r < ROWS.length - 1; r++) {
    for (let c = 0; c < COLS.length - 1; c++) {
      cells.push({
        x: X0 + COLS[c],
        y: Y0 + ROWS[r],
        w: COLS[c + 1] - COLS[c],
        h: ROWS[r + 1] - ROWS[r],
        r,
        c,
      });
    }
  }
  const tableH = ROWS[ROWS.length - 1];

  return (
    <figure className={className}>
      <svg
        viewBox="0 0 400 420"
        role="img"
        aria-label="Illustration of a scanned page with a table whose cells are being detected one by one"
        className="h-auto w-full"
        style={{ ["--sweep" as string]: `${tableH + 20}px` }}
      >
        {/* page */}
        <rect x="6" y="6" width="388" height="408" rx="3" fill="#13151a" stroke="#ece7dc" strokeOpacity="0.16" />
        {/* skew-ish page header lines */}
        <rect x="30" y="24" width="120" height="4" rx="2" fill="#ece7dc" opacity="0.28" />
        <rect x="30" y="34" width="70" height="3" rx="1.5" fill="#ece7dc" opacity="0.14" />
        <text x="370" y="30" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#a9a597" letterSpacing="1.2">
          PAGE 01
        </text>

        {/* grid lines */}
        <g stroke="#ece7dc" strokeOpacity="0.22" strokeWidth="1">
          {ROWS.map((y) => (
            <line key={`h${y}`} x1={X0} x2={X0 + COLS[COLS.length - 1]} y1={Y0 + y} y2={Y0 + y} />
          ))}
          {COLS.map((x) => (
            <line key={`v${x}`} x1={X0 + x} x2={X0 + x} y1={Y0} y2={Y0 + tableH} />
          ))}
        </g>

        {/* header row fill */}
        <rect x={X0} y={Y0} width={COLS[COLS.length - 1]} height={ROWS[1]} fill="#ece7dc" opacity="0.05" />

        {/* ink placeholders */}
        <g>
          {cells.map((c, i) => (
            <Bars key={i} x={c.x} y={c.y} w={c.w} seed={c.r * 3 + c.c} />
          ))}
        </g>

        {/* detected cell boxes */}
        <g fill="none" stroke="#ff6a3d" strokeWidth="1.25">
          {cells.map((c, i) => (
            <rect
              key={i}
              className="cell-box"
              style={{ ["--cd" as string]: `${500 + c.r * 330 + c.c * 40}ms` }}
              x={c.x + 2}
              y={c.y + 2}
              width={c.w - 4}
              height={c.h - 4}
              opacity={0.85}
            />
          ))}
        </g>

        {/* scan line */}
        <g className="scan-line" transform={`translate(0 ${Y0})`}>
          <rect x={X0 - 14} y="-10" width={COLS[COLS.length - 1] + 28} height="20" fill="url(#glow)" />
          <line x1={X0 - 14} x2={X0 + COLS[COLS.length - 1] + 14} y1="0" y2="0" stroke="#ff6a3d" strokeWidth="1.5" />
        </g>

        <defs>
          <linearGradient id="glow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#ff6a3d" stopOpacity="0" />
            <stop offset="0.5" stopColor="#ff6a3d" stopOpacity="0.22" />
            <stop offset="1" stopColor="#ff6a3d" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* footer lines */}
        <rect x="30" y={Y0 + tableH + 26} width="250" height="3" rx="1.5" fill="#ece7dc" opacity="0.16" />
        <rect x="30" y={Y0 + tableH + 36} width="180" height="3" rx="1.5" fill="#ece7dc" opacity="0.1" />
      </svg>
      <figcaption className="marker mt-3 flex items-center justify-between gap-4">
        <span>Fig. 1 · how a page gets read</span>
        <span className="text-signal">illustration</span>
      </figcaption>
    </figure>
  );
}
