import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";

/**
 * The opening film, computed live (no video file).
 *
 * One field of marks, one number (scroll progress 0..1) that drives everything:
 *   0.00  the page sits flat behind the name; a scan bar tidies it on load
 *   0.06  the page slips back into a crooked scan and tilts into space
 *   0.30  a scan bar sweeps it straight again and boxes the cells
 *   0.60  the cells lift off and gather into five clusters, one per project
 *   0.85  a path ties the clusters together
 * Because it is drawn, not seeked, it reverses instantly and never lags.
 */

const ACC = [127, 214, 230];
const INK = [230, 238, 238];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function kf(p: number, k: [number, number][]) {
  if (p <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) {
    if (p <= k[i][0]) {
      const [p0, v0] = k[i - 1];
      const [p1, v1] = k[i];
      return lerp(v0, v1, ease((p - p0) / (p1 - p0)));
    }
  }
  return k[k.length - 1][1];
}
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const NODES = [
  { name: "Table extractor", sub: "SBI Global IT Centre", fx: 0.14, fy: 0.5 },
  { name: "Mazagon Dock", sub: "Internship", fx: 0.32, fy: 0.34 },
  { name: "MouseShare", sub: "PC to phone", fx: 0.5, fy: 0.5 },
  { name: "RNN vs LSTM", sub: "NLP coursework", fx: 0.68, fy: 0.34 },
  { name: "Cloud-native app", sub: "AWS", fx: 0.86, fy: 0.5 },
];
const NODES_NARROW = [
  { fx: 0.3, fy: 0.2 },
  { fx: 0.72, fy: 0.3 },
  { fx: 0.3, fy: 0.42 },
  { fx: 0.72, fy: 0.52 },
  { fx: 0.4, fy: 0.64 },
];

type Pt = {
  hx: number;
  hy: number;
  nx: number;
  ny: number;
  na: number;
  w: number;
  l: number;
  k: number;
  ox: number;
  oy: number;
  oz: number;
  d: number;
};

export default function StoryCanvas({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cell = 38;
    let narrow = false;
    let pts: Pt[] = [];
    let centers: { x: number; y: number }[] = [];
    let R = 60;
    let raf = 0;
    let visible = true;
    let introStart = 0;
    let introS = progress.get() > 0.02 ? 1 : 0;
    let cols = 0;
    let rows = 0;

    const build = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      narrow = w < 700;
      cell = narrow ? 34 : 40;
      cols = Math.ceil(w / cell) + 5;
      rows = Math.ceil(h / cell) + 5;
      R = Math.min(w, h) * (narrow ? 0.085 : 0.075);
      centers = NODES.map((n, i) => {
        const f = narrow ? NODES_NARROW[i] : n;
        return { x: (f.fx - 0.5) * w, y: (f.fy - 0.5) * h };
      });
      const rand = rng(11);
      pts = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const amp = cell * 0.5;
          const joins = rand() < 0.66;
          pts.push({
            hx: (i - (cols - 1) / 2) * cell,
            hy: (j - (rows - 1) / 2) * cell,
            nx: (rand() - 0.5) * 2 * amp,
            ny: (rand() - 0.5) * 2 * amp,
            na: (rand() - 0.5) * 1.2,
            w: 8 + rand() * 12,
            l: rand(),
            k: joins ? Math.floor(rand() * NODES.length) : -1,
            ox: (rand() + rand() + rand() - 1.5) * R * 1.1,
            oy: (rand() + rand() + rand() - 1.5) * R * 1.1,
            oz: (rand() - 0.5) * R * 1.4,
            d: rand(),
          });
        }
      }
    };

    const draw = () => {
      const p = clamp(progress.get());
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;

      // camera
      const ax = kf(p, [[0, 0], [0.2, 0.6], [0.3, 0.6], [0.6, 0.1], [0.85, 0.04], [1, 0]]);
      const ayBase = kf(p, [[0, 0], [0.2, -0.4], [0.3, -0.4], [0.6, -0.05], [0.85, 0.12], [1, 0]]);
      const S = kf(p, [[0, 1.04], [0.2, 0.74], [0.3, 0.74], [0.6, 0.9], [0.8, 1.0], [1, 1.0]]);
      const F = Math.max(w, h) * 1.5;
      const ciG = ease(clamp((p - 0.6) / 0.16));
      const ay = ayBase + Math.sin(p * 10) * 0.05 * ciG;
      const cax = Math.cos(ax);
      const sax = Math.sin(ax);
      const cay = Math.cos(ay);
      const say = Math.sin(ay);
      const proj = (x: number, y: number, z: number) => {
        const x1 = x * cay + z * say;
        const z1 = -x * say + z * cay;
        const y2 = y * cax - z1 * sax;
        const z2 = y * sax + z1 * cax;
        const sc = F / (F + z2);
        return { x: cx + x1 * sc, y: cy + y2 * sc, sc };
      };

      // scan bar: the load-time one below 0.3, the scroll one after
      const messV = ease(clamp((p - 0.06) / 0.14));
      const lean = h * 0.18;
      const sw = p < 0.3 ? introS : clamp((p - 0.3) / 0.28);
      const barX = lerp(-w / 2 - 140, w / 2 + lean + 140, sw);
      const xAt = (y: number) => barX - ((y + h / 2) / h) * lean;
      const barVisible = (p < 0.06 && introS < 1) || (p > 0.3 && p < 0.62);
      const lineBase = p < 0.3 ? 0.1 * (1 - messV) : 0.12;

      // the page itself, a panel in space
      const outA = clamp((1.0 - S) / 0.14) * (1 - ciG);
      if (outA > 0.01) {
        const c = [
          proj(-w / 2 * S, -h / 2 * S, 0),
          proj(w / 2 * S, -h / 2 * S, 0),
          proj(w / 2 * S, h / 2 * S, 0),
          proj(-w / 2 * S, h / 2 * S, 0),
        ];
        ctx.beginPath();
        ctx.moveTo(c[0].x, c[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(c[i].x, c[i].y);
        ctx.closePath();
        ctx.fillStyle = `rgba(16,28,34,${0.55 * outA})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${0.28 * outA})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // grid lines, laid down behind the bar
      const lineA = lineBase * (1 - ciG);
      if (lineA > 0.004) {
        ctx.strokeStyle = `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${lineA})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < cols; i++) {
          const x = (i - (cols - 1) / 2) * cell;
          const a = clamp((xAt(0) - x) / 70);
          if (a <= 0) continue;
          const t = proj(x * S, (-h / 2) * S, 0);
          const b = proj(x * S, (-h / 2 + h * a) * S, 0);
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(b.x, b.y);
        }
        for (let j = 0; j < rows; j++) {
          const y = (j - (rows - 1) / 2) * cell;
          const reach = Math.min(w / 2, xAt(y));
          if (reach <= -w / 2) continue;
          const l = proj((-w / 2) * S, y * S, 0);
          const r = proj(reach * S, y * S, 0);
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(r.x, r.y);
        }
        ctx.stroke();
      }

      // marks
      const boxT = clamp((p - 0.4) / 0.1) * (1 - ciG);
      const flat = Math.abs(ax) < 0.2 && Math.abs(ay) < 0.2;
      for (const pt of pts) {
        const oRaw = ease(clamp((xAt(pt.hy) - pt.hx) / 90 + 0.5));
        const oi = p < 0.3 ? oRaw * (1 - messV) : oRaw;
        const ci = ease(clamp((p - 0.6 - pt.d * 0.12) / 0.16));
        const gx = (pt.hx + pt.nx * (1 - oi)) * S;
        const gy = (pt.hy + pt.ny * (1 - oi)) * S;
        let tx = gx * 1.5;
        let ty = gy * 1.5;
        let tz = 0;
        if (pt.k >= 0) {
          tx = centers[pt.k].x + pt.ox;
          ty = centers[pt.k].y + pt.oy;
          tz = pt.oz;
        }
        const x = lerp(gx, tx, ci);
        const y = lerp(gy, ty, ci);
        const z = lerp(0, tz, ci);
        const q = proj(x, y, z);
        if (q.x < -30 || q.x > w + 30 || q.y < -30 || q.y > h + 30) continue;
        const near = p < 0.62 && barVisible ? Math.exp(-Math.pow((pt.hx - xAt(pt.hy)) / 40, 2)) : 0;
        const mix = clamp(near + (pt.k >= 0 ? ci * 0.9 : 0));
        const r = Math.round(lerp(INK[0], ACC[0], mix));
        const g = Math.round(lerp(INK[1], ACC[1], mix));
        const b = Math.round(lerp(INK[2], ACC[2], mix));
        let alpha = (0.3 + 0.28 * oi + 0.4 * near) * clamp(Math.pow(q.sc, 1.6), 0.25, 1);
        if (pt.k < 0) alpha *= 1 - ci;
        else alpha = lerp(alpha, 0.85, ci * 0.6);
        if (alpha < 0.02) continue;
        const ang = pt.na * (1 - oi) * (1 - ci);
        const len = lerp(pt.w, 4, ci) * q.sc;
        const c0 = Math.cos(ang);
        const s0 = Math.sin(ang);
        ctx.setTransform(dpr * c0, dpr * s0, -dpr * s0, dpr * c0, dpr * q.x, dpr * q.y);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(-len / 2, -1, len, 2.2 * q.sc);
        if (pt.l > 0.55 && ci < 0.5) ctx.fillRect(-len / 2, 5, len * 0.55, 2 * q.sc);
        if (boxT > 0.02 && oi > 0.95 && flat) {
          ctx.strokeStyle = `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${0.12 * boxT})`;
          ctx.lineWidth = 1;
          const s = cell * 0.78 * S * q.sc;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.strokeRect(q.x - s / 2, q.y - s / 2, s, s);
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // the scan bar
      if (barVisible && sw > 0 && sw < 1) {
        const t = proj(xAt(-h / 2) * S, (-h / 2) * S, 0);
        const bt = proj(xAt(h / 2) * S, (h / 2) * S, 0);
        const t2 = proj((xAt(-h / 2) - 80) * S, (-h / 2) * S, 0);
        const b2 = proj((xAt(h / 2) - 80) * S, (h / 2) * S, 0);
        const g = ctx.createLinearGradient(t2.x, 0, t.x, 0);
        g.addColorStop(0, "rgba(127,214,230,0)");
        g.addColorStop(1, "rgba(127,214,230,0.2)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(t2.x, t2.y);
        ctx.lineTo(t.x, t.y);
        ctx.lineTo(bt.x, bt.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(190,240,248,0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(bt.x, bt.y);
        ctx.stroke();
      }

      // clusters: rings, a path between them, and names
      if (ciG > 0.02) {
        const pc = centers.map((c) => proj(c.x, c.y, 0));
        const pathA = clamp((p - 0.78) / 0.1) * 0.55;
        if (pathA > 0.01) {
          ctx.strokeStyle = `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${pathA})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          pc.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
          ctx.stroke();
        }
        const fs = narrow ? 12 : 14;
        pc.forEach((c, i) => {
          const a = ease(clamp((p - 0.68 - i * 0.025) / 0.12));
          if (a < 0.02) return;
          const rr = R * 1.5 * c.sc;
          ctx.strokeStyle = `rgba(${ACC[0]},${ACC[1]},${ACC[2]},${0.4 * a})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.textAlign = "center";
          ctx.font = `500 ${fs}px "IBM Plex Sans", system-ui, sans-serif`;
          ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`;
          ctx.fillText(NODES[i].name, c.x, c.y + rr + fs + 6);
          ctx.font = `400 ${fs - 3}px "IBM Plex Mono", monospace`;
          ctx.fillStyle = `rgba(163,179,184,${a})`;
          ctx.fillText(NODES[i].sub.toUpperCase(), c.x, c.y + rr + fs * 2 + 8);
        });
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!introStart) introStart = now;
      if (introS < 1) introS = clamp((now - introStart - 350) / 3600);
      draw();
      if (introS < 1) schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    build();
    schedule();
    const off = progress.on("change", schedule);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) schedule();
    });
    io.observe(canvas);
    const onResize = () => {
      build();
      schedule();
    };
    const onVis = () => !document.hidden && schedule();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      off();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [progress]);

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
