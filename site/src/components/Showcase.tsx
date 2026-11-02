import { m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Laptop } from "./MacShowcase";
import MacShowcase from "./MacShowcase";
import { AndroidPtr, PhoneScreenInner, WinArrow, WinScreenInner } from "./ui/devices";

/**
 * One continuous scroll film, five projects, one pinned screen.
 *   the laptop opens and walks the table extractor
 *   the laptop becomes a Windows PC, a phone slides in, one cursor crosses
 *     between them and the typing follows it
 *   namestorage: a laptop behind CGNAT, Google sign-in, STUN, then a direct
 *     encrypted channel to the browser
 *   the AWS app: request flow, deploy path, alarm
 *   the RNN vs LSTM lab as two training curves
 * Everything is a function of one smoothed scroll value (q), so it reverses
 * instantly. Acts one and two keep their original timing in "p" space, a
 * remap of q; the AWS and NLP acts use "L", the old 0.62..1 range, remapped
 * onto the end of q. Reduced motion gets the static laptop section instead.
 */

const Q2 = 0.4363; // q where the PC and phone act ends
const Q3 = 0.7326; // q where the namestorage act ends
const qs = (x: number) => (x / 0.62) * Q2; // old p (acts 1-2) to q
const qL = (x: number) => Q3 + ((x - 0.62) / 0.38) * (1 - Q3); // old p (acts 4-5) to q

const PC_TEXT = "Typed on the PC.";
const PHONE_TEXT = "Now it lands here.";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const slice = (s: string, t: number) => s.slice(0, Math.round(clamp(t) * s.length));

const CAPS: { a: number; b: number; t: string }[] = [
  { a: qs(0.03), b: qs(0.1), t: "A scanned page arrives. Skewed, speckled." },
  { a: qs(0.1), b: qs(0.17), t: "OpenCV finds the boxes and grid lines." },
  { a: qs(0.17), b: qs(0.24), t: "A vision-language model reads each cell. Guards reject text that can't be right." },
  { a: qs(0.24), b: qs(0.32), t: "Out comes Excel, merged cells and all." },
  { a: qs(0.33), b: qs(0.44), t: "Next: one mouse and keyboard, shared between a PC and a phone." },
  { a: qs(0.44), b: qs(0.55), t: "The cursor leaves the PC at the screen edge." },
  { a: qs(0.55), b: qs(0.63), t: "And the keys follow it onto the phone." },
  { a: 0.445, b: 0.515, t: "Next: a personal web drive on my own laptop, behind CGNAT, with no open port." },
  { a: 0.515, b: 0.585, t: "The laptop only dials out. Google signs me in, and the server checks my allow-list." },
  { a: 0.585, b: 0.655, t: "STUN finds a path through both NATs. Tailscale Funnel gives the server a public address." },
  { a: 0.655, b: 0.725, t: "Then files go straight from browser to laptop, encrypted. No server holds them." },
  { a: qL(0.65), b: qL(0.82), t: "A containerized app on AWS, from push to alarm." },
  { a: qL(0.85), b: 1.0, t: "And a lab comparing an RNN with an LSTM on text classification." },
];
const ACTS = [
  { n: "01", label: "Table extractor", a: 0, b: qs(0.32) },
  { n: "02", label: "MouseShare", a: qs(0.32), b: Q2 },
  { n: "03", label: "namestorage", a: Q2, b: Q3 },
  { n: "06", label: "AWS app", a: Q3, b: qL(0.84) },
  { n: "07", label: "RNN vs LSTM", a: qL(0.84), b: 1.01 },
];

function Cap({ p, i }: { p: MotionValue<number>; i: number }) {
  const { a, b, t } = CAPS[i];
  const first = i === 0;
  const last = i === CAPS.length - 1;
  const xs = first ? [0, a, b - 0.02, b] : last ? [a, a + 0.03, 1, 1] : [a, a + 0.025, b - 0.025, b];
  const opacity = useTransform(p, xs, first ? [0, 1, 1, 0] : last ? [0, 1, 1, 1] : [0, 1, 1, 0]);
  const y = useTransform(p, xs, first ? [0, 0, 0, -12] : last ? [12, 0, 0, 0] : [12, 0, 0, -12]);
  return (
    <m.p
      className="absolute inset-x-0 top-0 mx-auto max-w-[28ch] text-balance text-center font-display text-[clamp(1.25rem,3vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.03em] sm:max-w-[34ch]"
      style={{ opacity, y }}
    >
      {t}
    </m.p>
  );
}

function ActDot({ p, i }: { p: MotionValue<number>; i: number }) {
  const { a, b, n, label } = ACTS[i];
  const opacity = useTransform(p, [a - 0.02, a + 0.01, b - 0.01, b + 0.01], [0.3, 1, 1, 0.3]);
  return (
    <m.li className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] sm:text-[0.72rem]" style={{ opacity }}>
      <span className="text-signal">{n}</span>
      <span className="hidden sm:inline">{label}</span>
    </m.li>
  );
}

/* ------------------------------ act 3: AWS ------------------------------ */

type Pt = [number, number];
function along(pts: Pt[], t: number): Pt {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let d = clamp(t) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = seg[i] ? d / seg[i] : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= seg[i];
  }
  return pts[pts.length - 1];
}

const ROUTE_A: Pt[] = [[110, 250], [250, 250], [380, 175], [520, 175], [610, 250]];
const ROUTE_B: Pt[] = [[110, 250], [250, 250], [380, 325], [520, 325], [610, 250]];

function Packet({ a3, pts, phase, loops }: { a3: MotionValue<number>; pts: Pt[]; phase: number; loops: number }) {
  const f = (v: number) => along(pts, (v * loops + phase) % 1);
  const cx = useTransform(a3, (v) => f(v)[0]);
  const cy = useTransform(a3, (v) => f(v)[1]);
  const o = useTransform(a3, [0.12, 0.2, 0.92, 1], [0, 1, 1, 0.9]);
  return <m.circle r="6" fill="#7fd6e6" style={{ cx, cy, opacity: o }} />;
}

function Node({ a3, x, y, w, h, label, at, accent = false }: { a3: MotionValue<number>; x: number; y: number; w: number; h: number; label: string; at: number; accent?: boolean }) {
  const o = useTransform(a3, [at, at + 0.08], [0, 1]);
  return (
    <m.g style={{ opacity: o }}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill="#101c22" stroke={accent ? "#7fd6e6" : "rgba(230,238,238,0.35)"} strokeWidth="1.5" />
      <text x={x + w / 2} y={y + h / 2 + 7} textAnchor="middle" fill="#e6eeee" fontFamily="IBM Plex Sans, system-ui, sans-serif" fontSize="20">
        {label}
      </text>
    </m.g>
  );
}

function Line({ a3, d, at, dash = false }: { a3: MotionValue<number>; d: string; at: number; dash?: boolean }) {
  const pathLength = useTransform(a3, [at, at + 0.12], [0, 1]);
  return <m.path d={d} fill="none" stroke="rgba(127,214,230,0.5)" strokeWidth="1.6" strokeDasharray={dash ? "6 6" : undefined} style={{ pathLength }} />;
}

function Aws({ p }: { p: MotionValue<number> }) {
  const a3 = useTransform(p, [0.64, 0.8], [0, 1]);
  const vis = useTransform(p, [0.62, 0.68, 0.8, 0.84], [0, 1, 1, 0]);
  const ring = useTransform(a3, [0.82, 1], [0.6, 2.2]);
  const ringO = useTransform(a3, [0.8, 0.9, 1], [0, 0.8, 0]);
  const alarm = useTransform(a3, [0.8, 0.9], [0, 1]);
  return (
    <m.svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" style={{ opacity: vis }} aria-hidden="true">
      <Line a3={a3} d="M170 250 H250" at={0.04} />
      <Line a3={a3} d="M360 250 L380 175 H400" at={0.1} />
      <Line a3={a3} d="M360 250 L380 325 H400" at={0.1} />
      <Line a3={a3} d="M530 175 L610 250" at={0.18} />
      <Line a3={a3} d="M530 325 L610 250" at={0.18} />
      <Line a3={a3} d="M200 440 H300 M390 440 H470" at={0.3} dash />
      <Line a3={a3} d="M470 440 V345" at={0.4} dash />
      <Line a3={a3} d="M620 150 V100" at={0.55} dash />
      <Line a3={a3} d="M610 430 V285" at={0.6} dash />
      <rect x="380" y="130" width="170" height="240" rx="12" fill="rgba(127,214,230,0.04)" stroke="rgba(127,214,230,0.3)" strokeDasharray="4 5" />
      <text x="465" y="120" textAnchor="middle" fill="#a3b3b8" fontFamily="IBM Plex Mono, monospace" fontSize="14" letterSpacing="1.5">ECS FARGATE</text>
      <Node a3={a3} x={40} y={222} w={130} h={56} label="Users" at={0} />
      <Node a3={a3} x={250} y={222} w={110} h={56} label="ALB" at={0.06} accent />
      <Node a3={a3} x={400} y={150} w={130} h={50} label="Task" at={0.12} />
      <Node a3={a3} x={400} y={300} w={130} h={50} label="Task" at={0.14} />
      <Node a3={a3} x={610} y={222} w={150} h={56} label="RDS MySQL" at={0.2} accent />
      <Node a3={a3} x={60} y={412} w={140} h={56} label="CodePipeline" at={0.3} />
      <Node a3={a3} x={300} y={412} w={90} h={56} label="ECR" at={0.34} />
      <Node a3={a3} x={560} y={412} w={140} h={56} label="Bastion" at={0.58} />
      <Node a3={a3} x={560} y={50} w={120} h={50} label="SNS alarm" at={0.52} />
      <Packet a3={a3} pts={ROUTE_A} phase={0} loops={4} />
      <Packet a3={a3} pts={ROUTE_A} phase={0.5} loops={4} />
      <Packet a3={a3} pts={ROUTE_B} phase={0.25} loops={4} />
      <Packet a3={a3} pts={ROUTE_B} phase={0.75} loops={4} />
      <m.circle cx="620" cy="75" r="40" fill="none" stroke="#7fd6e6" strokeWidth="2" style={{ scale: ring, opacity: ringO, transformBox: "fill-box", transformOrigin: "center" }} />
      <m.g style={{ opacity: alarm }}>
        <rect x="560" y="50" width="120" height="50" rx="8" fill="rgba(127,214,230,0.18)" stroke="#7fd6e6" strokeWidth="1.8" />
        <text x="620" y="82" textAnchor="middle" fill="#e6eeee" fontFamily="IBM Plex Sans, system-ui, sans-serif" fontSize="20">SNS alarm</text>
      </m.g>
    </m.svg>
  );
}

/* ----------------------------- act 4: RNN vs LSTM ----------------------------- */

function curve(f: (x: number) => number) {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    pts.push(`${i ? "L" : "M"}${(110 + x * 600).toFixed(1)} ${(380 - f(x) * 300).toFixed(1)}`);
  }
  return pts.join(" ");
}
const RNN_D = curve((x) => 0.18 + 0.52 * Math.exp(-2.4 * x) + 0.45 * (1 - Math.exp(-2.4 * x)) * 0.62 + Math.sin(x * 41) * 0.012);
const LSTM_D = curve((x) => 0.72 * Math.exp(-3.4 * x) + 0.16 + Math.sin(x * 37 + 1) * 0.008 + 0.0);

function Nlp({ p }: { p: MotionValue<number> }) {
  const vis = useTransform(p, [0.82, 0.88], [0, 1]);
  const draw = useTransform(p, [0.86, 0.96], [0, 1]);
  const lab = useTransform(p, [0.94, 0.99], [0, 1]);
  return (
    <m.svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" style={{ opacity: vis }} aria-hidden="true">
      <g stroke="rgba(230,238,238,0.14)" strokeWidth="1">
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="110" x2="710" y1={80 + i * 75} y2={80 + i * 75} />
        ))}
      </g>
      <line x1="110" y1="80" x2="110" y2="380" stroke="rgba(230,238,238,0.4)" />
      <line x1="110" y1="380" x2="710" y2="380" stroke="rgba(230,238,238,0.4)" />
      <text x="110" y="64" fill="#a3b3b8" fontFamily="IBM Plex Mono, monospace" fontSize="14" letterSpacing="1.5">LOSS</text>
      <text x="710" y="415" textAnchor="end" fill="#a3b3b8" fontFamily="IBM Plex Mono, monospace" fontSize="14" letterSpacing="1.5">EPOCHS</text>
      <m.path d={RNN_D} fill="none" stroke="#a3b3b8" strokeWidth="3" strokeLinecap="round" style={{ pathLength: draw }} />
      <m.path d={LSTM_D} fill="none" stroke="#7fd6e6" strokeWidth="3.4" strokeLinecap="round" style={{ pathLength: draw }} />
      <m.g style={{ opacity: lab }} fontFamily="IBM Plex Sans, system-ui, sans-serif" fontSize="22">
        <text x="560" y="214" fill="#a3b3b8">RNN</text>
        <text x="560" y="330" fill="#7fd6e6">LSTM</text>
      </m.g>
    </m.svg>
  );
}

/* ------------------------------ act 3: namestorage ------------------------------ */

type Bz = [Pt, Pt, Pt, Pt];
function bez(b: Bz, n = 24): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * b[0][0] + 3 * u * u * t * b[1][0] + 3 * u * t * t * b[2][0] + t * t * t * b[3][0],
      u * u * u * b[0][1] + 3 * u * u * t * b[1][1] + 3 * u * t * t * b[2][1] + t * t * t * b[3][1],
    ]);
  }
  return out;
}
const DIRECT: Bz = [[150, 215], [250, 95], [560, 95], [660, 215]];
const DIRECT_PTS = bez(DIRECT);
const DIRECT_BACK = [...DIRECT_PTS].reverse();
const DIRECT_D = "M150 215 C250 95 560 95 660 215";

function Dot({ a, pts, from, to }: { a: MotionValue<number>; pts: Pt[]; from: number; to: number }) {
  const cx = useTransform(a, (v) => along(pts, clamp((v - from) / (to - from)))[0]);
  const cy = useTransform(a, (v) => along(pts, clamp((v - from) / (to - from)))[1]);
  const o = useTransform(a, [from - 0.001, from, to, to + 0.001], [0, 1, 1, 0]);
  return <m.circle r="7" fill="#7fd6e6" style={{ cx, cy, opacity: o }} />;
}

function Flow({ a, pts, phase }: { a: MotionValue<number>; pts: Pt[]; phase: number }) {
  const f = (v: number) => along(pts, (v * 6 + phase) % 1);
  const cx = useTransform(a, (v) => f(v)[0]);
  const cy = useTransform(a, (v) => f(v)[1]);
  const o = useTransform(a, [0.82, 0.88, 1], [0, 1, 1]);
  return <m.circle r="5" fill="#bdf1f9" style={{ cx, cy, opacity: o }} />;
}

function Label({ a, x, y, at, children }: { a: MotionValue<number>; x: number; y: number; at: number; children: React.ReactNode }) {
  const o = useTransform(a, [at, at + 0.05], [0, 1]);
  return (
    <m.text x={x} y={y} textAnchor="middle" fill="#a3b3b8" fontFamily="IBM Plex Mono, monospace" fontSize="14" letterSpacing="1.5" style={{ opacity: o }}>
      {children}
    </m.text>
  );
}

function Ns({ q }: { q: MotionValue<number> }) {
  const a = useTransform(q, [0.465, 0.7], [0, 1]);
  const vis = useTransform(q, [Q2 + 0.01, Q2 + 0.04, Q3 - 0.04, Q3], [0, 1, 1, 0]);
  const dim = useTransform(a, [0.8, 0.9], [1, 0.22]);
  const direct = useTransform(a, [0.7, 0.82], [0, 1]);
  const directTxt = useTransform(a, [0.86, 0.92], [0, 1]);
  return (
    <m.svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full" style={{ opacity: vis }} aria-hidden="true">
      <m.rect x="598" y="150" width="196" height="190" rx="12" fill="rgba(127,214,230,0.04)" stroke="rgba(127,214,230,0.3)" strokeDasharray="4 5" style={{ opacity: useTransform(a, [0, 0.08], [0, 1]) }} />
      <Label a={a} x={696} y={140} at={0.02}>HOME NETWORK, CGNAT</Label>
      <m.g style={{ opacity: dim }}>
        <rect x="318" y="150" width="174" height="190" rx="12" fill="rgba(127,214,230,0.04)" stroke="rgba(127,214,230,0.3)" strokeDasharray="4 5" />
        <Label a={a} x={405} y={140} at={0.04}>TAILSCALE FUNNEL</Label>
        <Line a3={a} d="M640 245 H480" at={0.1} dash />
        <Line a3={a} d="M170 225 L335 78" at={0.24} />
        <Line a3={a} d="M170 245 H330" at={0.38} />
        <Line a3={a} d="M130 275 L345 425" at={0.56} dash />
        <Line a3={a} d="M700 275 L470 425" at={0.56} dash />
        <Node a3={a} x={335} y={36} w={140} h={50} label="Google" at={0.04} />
        <Node a3={a} x={330} y={215} w={150} h={60} label="Signaling" at={0.06} accent />
        <Node a3={a} x={335} y={410} w={140} h={50} label="STUN" at={0.08} />
        <Label a={a} x={560} y={232} at={0.16}>OUTBOUND ONLY</Label>
        <Label a={a} x={405} y={322} at={0.46}>ALLOW-LIST CHECKED</Label>
      </m.g>
      <Node a3={a} x={30} y={215} w={140} h={60} label="Browser" at={0} accent />
      <Node a3={a} x={640} y={215} w={140} h={60} label="Laptop" at={0.02} accent />
      <m.path d={DIRECT_D} fill="none" stroke="#7fd6e6" strokeWidth="3.2" strokeLinecap="round" style={{ pathLength: direct, filter: "drop-shadow(0 0 6px rgba(127,214,230,0.8))" }} />
      <m.text x="405" y="108" textAnchor="middle" fill="#bdf1f9" fontFamily="IBM Plex Mono, monospace" fontSize="14" letterSpacing="1.5" style={{ opacity: directTxt }}>
        DIRECT, ENCRYPTED
      </m.text>
      <Dot a={a} pts={[[100, 215], [405, 68]]} from={0.26} to={0.33} />
      <Dot a={a} pts={[[405, 68], [100, 215]]} from={0.33} to={0.4} />
      <Dot a={a} pts={[[170, 245], [405, 245]]} from={0.4} to={0.46} />
      <Dot a={a} pts={[[480, 245], [705, 245]]} from={0.48} to={0.52} />
      <Dot a={a} pts={[[705, 245], [100, 245]]} from={0.52} to={0.58} />
      <Dot a={a} pts={[[100, 275], [405, 435]]} from={0.6} to={0.67} />
      <Dot a={a} pts={[[705, 275], [405, 435]]} from={0.6} to={0.67} />
      <Flow a={a} pts={DIRECT_PTS} phase={0} />
      <Flow a={a} pts={DIRECT_PTS} phase={0.5} />
      <Flow a={a} pts={DIRECT_BACK} phase={0.25} />
      <Flow a={a} pts={DIRECT_BACK} phase={0.75} />
    </m.svg>
  );
}

function Panel({ q, L }: { q: MotionValue<number>; L: MotionValue<number> }) {
  const opacity = useTransform(q, [Q2 + 0.005, Q2 + 0.04], [0, 1]);
  const y = useTransform(q, [Q2 + 0.005, Q2 + 0.04], [60, 0]);
  const scale = useTransform(q, [Q2 + 0.005, Q2 + 0.04], [0.92, 1]);
  const tN = useTransform(q, [Q3 - 0.04, Q3 - 0.01], [1, 0]);
  const tA = useTransform(q, [Q3 - 0.03, Q3, qL(0.8), qL(0.84)], [0, 1, 1, 0]);
  const tL = useTransform(q, [qL(0.82), qL(0.86)], [0, 1]);
  return (
    <m.div className="sc-panel" style={{ opacity, y, scale }} aria-hidden="true">
      <div className="sc-panel-bar">
        <span /><span /><span />
        <div className="sc-panel-title">
          <m.b style={{ opacity: tN }}>namestorage / connection</m.b>
          <m.b style={{ opacity: tA }}>aws-lab7 / architecture</m.b>
          <m.b style={{ opacity: tL }}>nlp-exp6 / training loss</m.b>
        </div>
      </div>
      <div className="sc-panel-body">
        <Ns q={q} />
        <Aws p={L} />
        <Nlp p={L} />
      </div>
    </m.div>
  );
}

/* --------------------------------- the film --------------------------------- */

function useNarrow() {
  const [n, setN] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setN(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return n;
}

function Film() {
  const narrow = useNarrow();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const q = useSpring(scrollYProgress, { stiffness: 140, damping: 32, mass: 0.4 });
  // acts one and two keep their original timing in p; the AWS and NLP acts read L
  const p = useTransform(q, [0, Q2, Q2 + 0.035], [0, 0.62, 0.66]);
  const L = useTransform(q, [Q3, 1], [0.62, 1]);
  const pa = useTransform(p, [0, 0.3], [0, 1]);

  // the pair of devices
  const rigX = useTransform(p, [0.3, 0.42], narrow ? ["0%", "0%"] : ["19%", "4%"]);
  const rigS = useTransform(p, [0.3, 0.42], narrow ? [1, 1] : [1.16, 1]);
  const exitO = useTransform(p, [0.6, 0.66], [1, 0]);
  const exitY = useTransform(p, [0.6, 0.66], [0, -70]);
  const exitS = useTransform(p, [0.6, 0.66], [1, 0.9]);

  const winO = useTransform(p, [0.33, 0.38], [0, 1]);
  const phoneX = useTransform(p, [0.36, 0.46], narrow ? ["0%", "0%"] : ["80%", "0%"]);
  const phoneR = useTransform(p, [0.36, 0.46], [-62, -4]);
  const phoneO = useTransform(p, [0.36, 0.42], [0, 1]);

  // typed text follows scroll
  const pcText = useTransform(p, (v) => slice(PC_TEXT, (v - 0.43) / 0.065));
  const phText = useTransform(p, (v) => slice(PHONE_TEXT, (v - 0.575) / 0.04));

  // cursor on the PC, in screen percent
  const pcL = useTransform(p, [0.4, 0.43, 0.5, 0.53], ["62%", "46%", "46%", "98%"]);
  const pcT = useTransform(p, [0.4, 0.43, 0.5, 0.53], ["78%", "40%", "40%", "42%"]);
  const pcO = useTransform(p, [0.39, 0.41, 0.53, 0.545], [0, 1, 1, 0]);
  // the dot that crosses the gap, in rig percent
  const orbL = useTransform(p, [0.53, 0.56], narrow ? ["50%", "50%"] : ["60%", "74%"]);
  const orbT = useTransform(p, [0.53, 0.56], narrow ? ["50%", "66%"] : ["44%", "46%"]);
  const orbO = useTransform(p, [0.525, 0.535, 0.555, 0.565], [0, 1, 1, 0]);
  // cursor on the phone, in screen percent
  const phL = useTransform(p, [0.555, 0.575], ["0%", "52%"]);
  const phT = useTransform(p, [0.555, 0.575], ["44%", "36%"]);
  const phO = useTransform(p, [0.555, 0.565], [0, 1]);
  const phCaret = useTransform(p, [0.57, 0.575], [0, 1]);
  const pcCaret = useTransform(p, [0.42, 0.43, 0.53, 0.54], [0, 1, 1, 0]);

  const skip = useTransform(q, [0.015, 0.04, 0.96, 1], [0, 1, 1, 0]);

  const winScreen = (
    <m.div className="sc-win" style={{ opacity: winO }}>
      <div className="ms-pc-screen" style={{ position: "absolute", inset: 0, aspectRatio: "auto", borderRadius: 0 }}>
        <WinScreenInner
          text={
            <>
              <m.span>{pcText}</m.span>
              <m.span className="ms-caret" style={{ opacity: pcCaret }} aria-hidden="true" />
            </>
          }
          caret={false}
        >
          <m.div className="sc-cursor" style={{ left: pcL, top: pcT, opacity: pcO }}>
            <WinArrow />
          </m.div>
        </WinScreenInner>
      </div>
    </m.div>
  );

  return (
    <section ref={ref} id="pipeline" className="relative h-[1080vh]" aria-label="Projects, up close">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center overflow-hidden px-4 pt-16">
        <p className="marker">02 / Projects, up close</p>
        <div className="relative mt-3 h-[clamp(5.5rem,16svh,8rem)] w-full max-w-4xl">
          {CAPS.map((_, i) => (
            <Cap key={i} p={q} i={i} />
          ))}
        </div>

        <div className="sc-stage">
          <m.div className="sc-exit" style={{ opacity: exitO, y: exitY, scale: exitS }}>
            <m.div className="sc-rig" style={{ x: rigX, scale: rigS }} aria-hidden="true">
              <div className="sc-laptop">
                <Laptop p={pa} extra={winScreen} />
              </div>
              <m.div className="sc-phone" style={{ x: phoneX, rotateY: phoneR, opacity: phoneO }}>
                <div className="ms-phone" data-active="false">
                  <span className="ms-phone-btn" />
                  <div className="ms-phone-body">
                    <div className="ms-phone-screen">
                      <PhoneScreenInner
                        text={
                          <>
                            <m.span>{phText}</m.span>
                            <m.span className="ms-caret" style={{ opacity: phCaret }} aria-hidden="true" />
                          </>
                        }
                        caret={false}
                      >
                        <m.div className="sc-cursor sc-cursor-ph" style={{ left: phL, top: phT, opacity: phO }}>
                          <AndroidPtr />
                        </m.div>
                      </PhoneScreenInner>
                    </div>
                  </div>
                </div>
              </m.div>
              <m.span className="sc-orb" style={{ left: orbL, top: orbT, opacity: orbO }} />
            </m.div>
          </m.div>
          <Panel q={q} L={L} />
        </div>

        <ol className="mt-auto flex flex-wrap justify-center gap-x-6 gap-y-1 pb-3" aria-label="Projects in this section">
          {ACTS.map((_, i) => (
            <ActDot key={i} p={q} i={i} />
          ))}
        </ol>
        <p className="marker pb-5 text-center text-paper-faint">Illustrations of the projects, not real data</p>
        <m.a
          href="#projects"
          className="tap absolute right-5 top-16 z-30 hidden border hairline bg-ink/60 px-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] backdrop-blur-md transition-colors hover:border-signal hover:text-signal sm:inline-flex"
          style={{ opacity: skip }}
        >
          Skip to projects ↓
        </m.a>
      </div>
    </section>
  );
}

export default function Showcase() {
  const reduced = useReducedMotion();
  return reduced ? <MacShowcase /> : <Film />;
}


