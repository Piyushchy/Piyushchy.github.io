import { useEffect, useRef } from "react";

/**
 * The thread. One glowing line winds down the whole page, section to section,
 * and a small object rides it and changes as the story moves on:
 * a crooked scanned page, then a straight grid page, then four tiles (the
 * projects), then an envelope at the end (get in touch). Nodes light as the
 * thread reaches each section. It is drawn from the real section positions,
 * updates only on scroll, and never touches React state.
 */

const IDS = ["about", "pipeline", "mouseshare", "projects", "activity", "skills", "experience", "contact"];
const NS = "http://www.w3.org/2000/svg";
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function Thread() {
  const svg = useRef<SVGSVGElement>(null);
  const base = useRef<SVGPathElement>(null);
  const lit = useRef<SVGPathElement>(null);
  const token = useRef<SVGGElement>(null);
  const page = useRef<SVGGElement>(null);
  const tiles = useRef<SVGGElement>(null);
  const mail = useRef<SVGGElement>(null);
  const nodes = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = svg.current!;
    const main = el.parentElement as HTMLElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let xs: number[] = [];
    let ys: number[] = [];
    let lens: number[] = [];
    let total = 1;
    let nodeLen: number[] = [];
    let raf = 0;

    const measure = () => {
      const mr = main.getBoundingClientRect();
      const w = mr.width;
      const h = main.offsetHeight;
      el.setAttribute("width", String(w));
      el.setAttribute("height", String(h));
      const narrow = w < 768;
      const gx = Math.max(14, (w - 1216) / 4);
      const L = narrow ? 14 : gx;
      const R = narrow ? 14 : w - gx;
      const pts: [number, number][] = [];
      IDS.forEach((id, i) => {
        const s = document.getElementById(id);
        if (!s) return;
        const top = s.getBoundingClientRect().top - mr.top;
        pts.push([i % 2 === 0 ? L : R, top + 70]);
      });
      if (pts.length < 2) return;
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        // stay in the margin for most of the way, then cross over in a short swoop
        const cross = Math.min(210, (y1 - y0) * 0.5);
        const ys0 = y1 - cross;
        d += ` L${x0} ${ys0} C${x0} ${ys0 + cross / 2} ${x1} ${ys0 + cross / 2} ${x1} ${y1}`;
      }
      base.current!.setAttribute("d", d);
      lit.current!.setAttribute("d", d);
      total = base.current!.getTotalLength();
      lit.current!.style.strokeDasharray = String(total);
      // sample the path so scroll maps to a point cheaply
      const step = 20;
      xs = [];
      ys = [];
      lens = [];
      for (let l = 0; l <= total + step; l += step) {
        const p = base.current!.getPointAtLength(Math.min(l, total));
        xs.push(p.x);
        ys.push(p.y);
        lens.push(Math.min(l, total));
      }
      const lenAtY = (y: number) => {
        let lo = 0;
        let hi = ys.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (ys[mid] < y) lo = mid + 1;
          else hi = mid;
        }
        return lens[lo];
      };
      nodeLen = pts.map(([, y]) => lenAtY(y));
      const g = nodes.current!;
      while (g.firstChild) g.removeChild(g.firstChild);
      pts.forEach(([x, y]) => {
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", String(x));
        c.setAttribute("cy", String(y));
        c.setAttribute("r", "5");
        c.setAttribute("class", "thread-node");
        g.appendChild(c);
      });
      update();
    };

    const update = () => {
      raf = 0;
      if (!ys.length) return;
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      const y = window.scrollY + window.innerHeight * 0.62 - mainTop;
      let lo = 0;
      let hi = ys.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (ys[mid] < y) lo = mid + 1;
        else hi = mid;
      }
      const i = lo;
      const len = reduced ? total : lens[i];
      const f = len / total;
      lit.current!.style.strokeDashoffset = String(total - len);

      const kids = nodes.current!.children;
      for (let k = 0; k < kids.length; k++) kids[k].classList.toggle("on", len >= nodeLen[k] - 1);

      const t = token.current!;
      if (reduced) {
        t.setAttribute("opacity", "0");
        return;
      }
      const visible = y > ys[0] - 120 && y < ys[ys.length - 1] + 200;
      t.setAttribute("opacity", visible ? "1" : "0");
      t.setAttribute("transform", `translate(${xs[i].toFixed(1)} ${ys[i].toFixed(1)})`);

      // stages of the object
      const order = ease(clamp((f - 0.04) / 0.2));
      const split = ease(clamp((f - 0.42) / 0.1)) * (1 - ease(clamp((f - 0.8) / 0.08)));
      const post = ease(clamp((f - 0.9) / 0.06));
      const pg = page.current!;
      pg.setAttribute("transform", `rotate(${(-18 * (1 - order)).toFixed(1)}) skewX(${(-12 * (1 - order)).toFixed(1)})`);
      pg.setAttribute("opacity", String((1 - ease(clamp((f - 0.4) / 0.08))).toFixed(2)));
      pg.setAttribute("class", order > 0.98 ? "thread-page ordered" : "thread-page");
      const tl = tiles.current!;
      tl.setAttribute("opacity", split.toFixed(2));
      tl.setAttribute("transform", `rotate(${(f * 540).toFixed(1)}) scale(${(0.7 + split * 0.5).toFixed(2)})`);
      mail.current!.setAttribute("opacity", post.toFixed(2));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    let mt = 0;
    const remeasure = () => {
      window.clearTimeout(mt);
      mt = window.setTimeout(measure, 120);
    };
    measure();
    const ro = new ResizeObserver(remeasure);
    ro.observe(main);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("load", remeasure);
    const late = window.setTimeout(measure, 1200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(mt);
      window.clearTimeout(late);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("load", remeasure);
    };
  }, []);

  return (
    <svg ref={svg} className="thread" aria-hidden="true">
      <defs>
        <radialGradient id="th-glow">
          <stop offset="0" stopColor="#7fd6e6" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7fd6e6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path ref={base} fill="none" stroke="rgba(230,238,238,0.1)" strokeWidth="1.5" />
      <path ref={lit} className="thread-lit" fill="none" stroke="#7fd6e6" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      <g ref={nodes} />
      <g ref={token} opacity="0">
        <circle r="34" fill="url(#th-glow)" />
        <g ref={page} className="thread-page">
          <rect x="-12" y="-16" width="24" height="32" rx="2.5" fill="#101c22" stroke="#e6eeee" strokeOpacity="0.8" />
          <g stroke="#e6eeee" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round">
            <line x1="-7" y1="-8" x2="5" y2="-8" />
            <line x1="-7" y1="-2" x2="7" y2="-2" />
            <line x1="-7" y1="4" x2="3" y2="4" />
            <line x1="-7" y1="10" x2="6" y2="10" />
          </g>
          <g className="thread-grid" stroke="#7fd6e6" strokeWidth="1" opacity="0">
            <line x1="-12" y1="-5" x2="12" y2="-5" />
            <line x1="-12" y1="3" x2="12" y2="3" />
            <line x1="-1" y1="-16" x2="-1" y2="16" />
          </g>
        </g>
        <g ref={tiles} opacity="0">
          {[
            [-9, -9],
            [9, -9],
            [-9, 9],
            [9, 9],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 6} y={y - 6} width="12" height="12" rx="2.5" fill="#101c22" stroke="#7fd6e6" strokeWidth="1.6" />
          ))}
        </g>
        <g ref={mail} opacity="0">
          <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#7fd6e6" />
          <path d="M-15 -8 L0 3 L15 -8" fill="none" stroke="#0a1317" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}
