import { useEffect, useRef } from "react";

/**
 * "Order from noise", drawn live on a canvas. Nothing is downloaded.
 *
 * A field of small marks starts out crooked and jittered, like a bad scan.
 * A scan bar sweeps across once and every mark it passes snaps onto a clean
 * grid. Moving the pointer over the page boxes the nearest cells, the way a
 * table detector would. Reduced motion draws the finished grid once. The loop
 * stops when the hero is off screen, the tab is hidden, or nothing is moving.
 */

const ACCENT = [127, 214, 230];
const INK = [230, 238, 238];

type Pt = { hx: number; hy: number; nx: number; ny: number; na: number; w: number; l: number };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
// Small seeded generator so the layout is the same on every visit.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export default function OrderField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let pts: Pt[] = [];
    let cell = 34;
    let raf = 0;
    let visible = true;
    let start = 0;
    let sweep = reduced ? 1 : 0; // 0..1 progress of the scan bar
    const mouse = { x: -999, y: -999, tx: -999, ty: -999, on: false, idle: 0 };

    const build = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = w < 600 ? 30 : 38;
      const cols = Math.ceil(w / cell) + 1;
      const rows = Math.ceil(h / cell) + 1;
      const ox = (w - (cols - 1) * cell) / 2;
      const oy = (h - (rows - 1) * cell) / 2;
      const rand = rng(7);
      pts = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const amp = cell * 0.5;
          pts.push({
            hx: ox + i * cell,
            hy: oy + j * cell,
            nx: (rand() - 0.5) * 2 * amp,
            ny: (rand() - 0.5) * 2 * amp,
            na: (rand() - 0.5) * 1.1,
            w: 8 + rand() * 12,
            l: rand(),
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // The bar leans a little, like a page fed in slightly crooked.
      const lean = h * 0.18;
      const barX = -w * 0.15 + sweep * (w * 1.3 + lean);
      const xAt = (y: number) => barX - (y / h) * lean;
      const done = sweep >= 1;

      // clean grid lines appear behind the bar
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${done ? 0.12 : 0.09})`;
      ctx.beginPath();
      const cols = Math.ceil(w / cell) + 1;
      const ox = pts.length ? pts[0].hx : 0;
      const oy = pts.length ? pts[0].hy : 0;
      for (let i = 0; i < cols; i++) {
        const x = ox + i * cell;
        const reach = clamp((xAt(h / 2) - x) / 60);
        if (reach <= 0) continue;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h * reach);
      }
      const rows = Math.ceil(h / cell) + 1;
      for (let j = 0; j < rows; j++) {
        const y = oy + j * cell;
        const reachX = Math.max(0, xAt(y));
        if (reachX <= 0) continue;
        ctx.moveTo(0, y);
        ctx.lineTo(Math.min(w, reachX), y);
      }
      ctx.stroke();

      for (const p of pts) {
        // how far this mark has been tidied: 0 crooked, 1 aligned
        const a = ease(clamp((xAt(p.hy) - p.hx) / 90 + 0.5));
        const x = p.hx + p.nx * (1 - a);
        const y = p.hy + p.ny * (1 - a);
        const ang = p.na * (1 - a);
        const near = Math.exp(-Math.pow((p.hx - xAt(p.hy)) / 40, 2)); // glow at the bar
        const alpha = 0.3 + 0.28 * a + 0.4 * near;
        const c = near > 0.2 ? ACCENT : INK;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
        ctx.fillRect(-p.w / 2, -1, p.w, 2.2);
        if (p.l > 0.55) ctx.fillRect(-p.w / 2, 5, p.w * 0.55, 2);
        ctx.restore();

        // the pointer boxes the cells it touches
        if (mouse.on && a > 0.95) {
          const d = Math.hypot(p.hx - mouse.x, p.hy - mouse.y);
          const k = clamp(1 - d / (cell * 3.2));
          if (k > 0.02) {
            ctx.strokeStyle = `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${0.75 * k})`;
            ctx.lineWidth = 1;
            const s = cell * 0.78;
            ctx.strokeRect(p.hx - s / 2, p.hy - s / 2, s, s);
          }
        }
      }

      // the bar itself
      if (!done && sweep > 0) {
        const g = ctx.createLinearGradient(barX - 70, 0, barX + 6, 0);
        g.addColorStop(0, "rgba(127,214,230,0)");
        g.addColorStop(1, "rgba(127,214,230,0.16)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(barX - 70, 0);
        ctx.lineTo(barX, 0);
        ctx.lineTo(barX - lean, h);
        ctx.lineTo(barX - 70 - lean, h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(190,240,248,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(barX, 0);
        ctx.lineTo(barX - lean, h);
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!start) start = now;
      const t = (now - start - 350) / 3600;
      sweep = clamp(t);
      mouse.x += (mouse.tx - mouse.x) * 0.2;
      mouse.y += (mouse.ty - mouse.y) * 0.2;
      draw();
      const moving = Math.abs(mouse.tx - mouse.x) > 0.5 || Math.abs(mouse.ty - mouse.y) > 0.5;
      if (sweep < 1 || (mouse.on && (moving || mouse.idle++ < 30))) schedule();
    };
    const schedule = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (!mouse.on) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      }
      mouse.on = true;
      mouse.idle = 0;
      if (sweep >= 1) schedule();
    };
    const onLeave = () => {
      mouse.on = false;
      if (sweep >= 1) draw();
    };
    const onResize = () => {
      build();
      draw();
      schedule();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) schedule();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    const onVis = () => (document.hidden ? raf && (cancelAnimationFrame(raf), (raf = 0)) : schedule());

    build();
    draw();
    if (!reduced) {
      schedule();
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVis);
    }
    io.observe(canvas);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`absolute inset-0 h-full w-full ${className}`} />;
}
