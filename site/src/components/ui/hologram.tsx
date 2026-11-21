import { useEffect, useRef, useState } from "react";

/**
 * A holographic portrait. Not a mesh: every point of a grid cut from the photo is a
 * glowing particle pushed out by a hand-built depth map, drawn in one WebGL call.
 * The GPU does all the animation (breathing, scan band, glitch, burst), so the page
 * only pays for one draw per frame, and only while the panel is on screen.
 * Pointer tilts it, dragging spins it, a tap glitches it. Reduced motion gets one still frame.
 */
const BASE = import.meta.env.BASE_URL + "hologram/";
const GW = 250;
const GH = 225;

const VERT = `
precision highp float;
attribute vec3 a_p;
attribute float a_k;
uniform sampler2D u_color;
uniform sampler2D u_data;
uniform float u_t, u_burst, u_glitch, u_px, u_aspect;
uniform vec2 u_rot;
varying vec4 v_col;
float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
void main(){
  float t = u_t;
  float r = a_p.z;
  vec3 pos;
  vec3 col;
  float alpha;
  float size;
  if (a_k < 0.5) {
    vec2 uv = a_p.xy;
    vec4 d = texture2D(u_data, uv);
    vec3 c = texture2D(u_color, uv).rgb;
    float depth = d.r;
    float edge = d.b;
    pos = vec3((uv.x - 0.5) * ${((GW / GH) * 2).toFixed(3)}, (0.5 - uv.y) * 2.0, (depth - 0.4) * 0.55);
    pos.y += sin(t * 1.2) * 0.006 * (1.0 - uv.y * 0.6);
    pos += (vec3(h(r * 3.1), h(r * 5.7), h(r * 9.3)) - 0.5) * 0.006 * (1.0 + edge * 2.0) * sin(t * 3.0 + r * 50.0);
    float band = fract(t * 0.16);
    float scan = smoothstep(0.05, 0.0, abs(uv.y - band));
    pos.x += scan * 0.02 * sin(r * 30.0 + t * 10.0);
    float row = floor(uv.y * 28.0);
    float gl = u_glitch * step(0.5, h(row + floor(t * 14.0)));
    pos.x += gl * (h(row * 1.3) - 0.5) * 0.35;
    vec3 dir = normalize(vec3(h(r * 7.3) - 0.5, h(r * 2.9) - 0.5, h(r * 5.1) - 0.2) + 0.001);
    pos += dir * u_burst * (0.6 + h(r * 11.0) * 1.4);
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 base = mix(vec3(0.04, 0.42, 0.62), vec3(0.55, 0.96, 1.0), smoothstep(0.05, 0.85, lum));
    vec3 tint = mix(base, c * 1.3, 0.22);
    float bright = 0.55 + 0.6 * lum + depth * 0.3 + edge * 0.9 + scan * 1.2;
    float sl = 0.78 + 0.22 * sin(pos.y * 260.0 - t * 4.0);
    col = tint * bright * sl;
    alpha = (0.55 + 0.45 * lum) * (1.0 - smoothstep(0.80, 1.0, uv.y)) * (0.94 + 0.06 * sin(t * 23.0));
    size = u_px * (0.95 + depth * 0.5);
  } else if (a_k < 1.5) {
    float a = a_p.x * 6.2831853 + t * 0.3 * (1.0 + a_p.y);
    float rad = 0.78 + a_p.y * 0.55;
    pos = vec3(cos(a) * rad, -1.02 + sin(t * 2.0 + a_p.x * 40.0) * 0.005, sin(a) * rad);
    col = vec3(0.2, 0.8, 1.0) * (0.55 + 0.45 * sin(a * 3.0 + t * 2.0));
    alpha = 0.7;
    size = u_px * 1.1;
  } else {
    float y = mod(h(r * 5.0) * 2.8 + t * (0.05 + 0.08 * h(r * 8.0)), 2.8) - 1.4;
    pos = vec3((h(r * 3.0) - 0.5) * 2.6, y, (h(r * 7.0) - 0.5) * 1.2);
    col = vec3(0.4, 0.9, 1.0);
    alpha = 0.5 * (1.0 - abs(y) / 1.4);
    size = u_px * 0.7;
  }
  float cy = cos(u_rot.x), sy = sin(u_rot.x);
  pos = vec3(cy * pos.x + sy * pos.z, pos.y, -sy * pos.x + cy * pos.z);
  float cx = cos(u_rot.y), sx = sin(u_rot.y);
  pos = vec3(pos.x, cx * pos.y - sx * pos.z, sx * pos.y + cx * pos.z);
  float s = 3.4 / (3.4 - pos.z);
  gl_Position = vec4(pos.x * s / (1.25 * u_aspect), pos.y * s / 1.25, -pos.z * 0.1, 1.0);
  gl_PointSize = max(size * s, 1.0);
  v_col = vec4(col * alpha, alpha);
}
`;

const FRAG = `
precision mediump float;
varying vec4 v_col;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  float a = smoothstep(1.0, 0.2, dot(q, q) * 4.0);
  gl_FragColor = vec4(v_col.rgb * a, v_col.a * a);
}
`;

const load = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

export default function Hologram({ reduced = false }: { reduced?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current!;
    const canvas = cv.current!;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) {
      setFailed(true);
      return;
    }
    let dead = false;
    let raf = 0;
    let visible = false;
    let started = false;
    let cleanup = () => {};

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const start = async () => {
      if (started) return;
      started = true;
      try {
        const [colorImg, dataImg] = await Promise.all([load(BASE + "color.png"), load(BASE + "data.png")]);
        if (dead) return;

        // points: every masked cell of the grid, a projector ring, a little dust
        const c2 = document.createElement("canvas");
        c2.width = GW;
        c2.height = GH;
        const x2 = c2.getContext("2d", { willReadFrequently: true })!;
        x2.drawImage(dataImg, 0, 0);
        const px = x2.getImageData(0, 0, GW, GH).data;
        const small = window.innerWidth < 700;
        const pts: number[] = [];
        let seed = 7;
        const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647);
        for (let y = 0; y < GH; y++) {
          for (let x = 0; x < GW; x++) {
            if (px[(y * GW + x) * 4 + 1] > 127) {
              if (small && (x + y) % 2 === 1 && px[(y * GW + x) * 4 + 2] < 60) continue;
              pts.push((x + 0.5) / GW, (y + 0.5) / GH, rnd(), 0);
            }
          }
        }
        for (let ring = 0; ring < 3; ring++) {
          const n = 150 + ring * 70;
          for (let i = 0; i < n; i++) pts.push(i / n, ring / 2, rnd(), 1);
        }
        for (let i = 0; i < 140; i++) pts.push(0, 0, rnd() * 50 + 1, 2);
        const data = new Float32Array(pts);
        const count = data.length / 4;

        const prog = gl.createProgram()!;
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const aP = gl.getAttribLocation(prog, "a_p");
        const aK = gl.getAttribLocation(prog, "a_k");
        gl.enableVertexAttribArray(aP);
        gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(aK);
        gl.vertexAttribPointer(aK, 1, gl.FLOAT, false, 16, 12);

        const tex = (img: HTMLImageElement, unit: number) => {
          const t = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        tex(colorImg, 0);
        tex(dataImg, 1);
        gl.uniform1i(gl.getUniformLocation(prog, "u_color"), 0);
        gl.uniform1i(gl.getUniformLocation(prog, "u_data"), 1);
        const U = (n: string) => gl.getUniformLocation(prog, n);
        const uT = U("u_t"), uBurst = U("u_burst"), uGlitch = U("u_glitch"), uPx = U("u_px"), uAsp = U("u_aspect"), uRot = U("u_rot");

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.clearColor(0, 0, 0, 0);

        let W = 0, H = 0, dpr = 1;
        const resize = () => {
          const r = el.getBoundingClientRect();
          dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          W = Math.max(1, Math.round(r.width * dpr));
          H = Math.max(1, Math.round(r.height * dpr));
          if (canvas.width !== W || canvas.height !== H) {
            canvas.width = W;
            canvas.height = H;
          }
          gl.viewport(0, 0, W, H);
          gl.uniform1f(uAsp, W / H);
          gl.uniform1f(uPx, (H / 2.5) * (2 / GH) * 1.4);
        };
        resize();
        const ro = new ResizeObserver(() => {
          resize();
          if (!raf) frame(last);
        });
        ro.observe(el);

        // interaction state
        let tyaw = 0, tpitch = 0, yaw = 0, pitch = 0;
        let drag = false, dragYaw = 0, lastX = 0, hover = false;
        let burst = 0, glitch = 0, nextGlitch = 2.5;
        const rect = () => el.getBoundingClientRect();
        const onMove = (e: PointerEvent) => {
          const r = rect();
          if (drag) {
            dragYaw += (e.clientX - lastX) * 0.012;
            lastX = e.clientX;
          } else if (e.pointerType !== "touch") {
            hover = true;
            tyaw = ((e.clientX - r.left) / r.width - 0.5) * 1.1;
            tpitch = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
          }
        };
        const onDown = (e: PointerEvent) => {
          drag = true;
          lastX = e.clientX;
          el.setPointerCapture(e.pointerId);
          burst = 1;
          glitch = 1;
        };
        const onUp = () => (drag = false);
        const onLeave = () => {
          hover = false;
          tyaw = 0;
          tpitch = 0;
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        el.addEventListener("pointerleave", onLeave);

        let last = performance.now();
        let time = 0;
        const frame = (now: number) => {
          raf = 0;
          const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
          last = now;
          time += dt;
          if (!reduced) {
            if (!hover && !drag) {
              tyaw = Math.sin(time * 0.45) * 0.3;
              tpitch = Math.sin(time * 0.31) * 0.06;
            }
            if (!drag) dragYaw += (0 - dragYaw) * Math.min(1, dt * 2.2);
            const k = Math.min(1, dt * 5);
            yaw += (tyaw + dragYaw - yaw) * k;
            pitch += (tpitch - pitch) * k;
            burst = Math.max(0, burst - dt * 1.6);
            glitch = Math.max(0, glitch - dt * 5);
            if (time > nextGlitch) {
              glitch = 1;
              nextGlitch = time + 4 + Math.random() * 5;
            }
          }
          gl.uniform1f(uT, reduced ? 1.7 : time);
          gl.uniform1f(uBurst, burst * burst * 0.9);
          gl.uniform1f(uGlitch, glitch);
          gl.uniform2f(uRot, yaw, pitch);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.drawArrays(gl.POINTS, 0, count);
          if (visible && !document.hidden && !reduced) raf = requestAnimationFrame(frame);
        };
        const schedule = () => {
          if (!raf && visible && !document.hidden) {
            last = performance.now();
            raf = requestAnimationFrame(frame);
          }
        };
        scheduleRef = schedule;
        const onVis = () => schedule();
        document.addEventListener("visibilitychange", onVis);
        setReady(true);
        frame(performance.now());
        schedule();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          document.removeEventListener("visibilitychange", onVis);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerdown", onDown);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);
          el.removeEventListener("pointerleave", onLeave);
        };
      } catch {
        if (!dead) setFailed(true);
      }
    };

    let scheduleRef: () => void = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          start();
          scheduleRef();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => {
      dead = true;
      io.disconnect();
      cleanup();
    };
  }, [reduced]);

  return (
    <div
      ref={box}
      role="img"
      aria-label="Interactive holographic portrait of Piyush. Move the pointer to tilt it, drag to spin it, tap to glitch it."
      className="holo-box relative aspect-[250/225] w-full max-w-[26rem] touch-pan-y select-none overflow-hidden rounded-2xl border hairline"
    >
      {failed ? (
        <img src={BASE + "color.png"} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 [filter:grayscale(1)_sepia(1)_hue-rotate(150deg)_saturate(3)]" />
      ) : (
        <canvas ref={cv} className="absolute inset-0 h-full w-full" />
      )}
      <span className="pointer-events-none absolute left-3 top-3 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-signal">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-signal align-middle motion-safe:animate-pulse" />
        {ready || failed ? "Live hologram" : "Booting"}
      </span>
      <span className="pointer-events-none absolute bottom-3 left-3 right-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper-dim">
        {typeof window !== "undefined" && window.matchMedia("(hover: none)").matches
          ? "Drag to spin · tap to glitch"
          : "Move to tilt · drag to spin · tap to glitch"}
      </span>
    </div>
  );
}
