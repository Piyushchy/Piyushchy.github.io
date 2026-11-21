import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

/**
 * A stylised holographic bust, built from primitives (no photo, no model file).
 * Faceted low-poly surfaces with a hologram shader (rim light, scan lines, a sweeping band,
 * dithered dissolve at the base) plus wireframe edges. It blinks, breathes, looks at the pointer,
 * and spins when dragged. Skill tags orbit it. Three.js loads only when the panel nears the screen,
 * and the render loop stops while it is off screen. Reduced motion gets one still frame.
 */

const TAGS = ["Python", "AWS", "WebRTC", "React", "NLP", "Kotlin", "Linux"];

const VERT = /* glsl */ `
uniform float uTime;
uniform float uGlitch;
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  float row = floor(w.y * 14.0);
  float g = step(0.55, fract(sin(row * 12.9 + floor(uTime * 18.0)) * 4375.5)) * uGlitch;
  w.x += g * 0.14 * (fract(sin(row * 3.1) * 999.0) - 0.5) * 2.0;
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const FRAG_BODY = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uGlow;
uniform float uOpacity;
varying vec3 vW;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
  vec3 V = normalize(cameraPosition - vW);
  float nd = abs(dot(n, V));
  float fres = pow(1.0 - nd, 2.2);
  float lam = 0.25 + 0.75 * max(dot(n, normalize(vec3(-0.5, 0.8, 0.7))), 0.0);
  float scanl = 0.82 + 0.18 * sin(vW.y * 110.0 - uTime * 2.5);
  float y0 = mix(1.0, -2.0, fract(uTime * 0.12));
  float band = smoothstep(0.09, 0.0, abs(vW.y - y0));
  float fade = smoothstep(-2.0, -1.15, vW.y);
  if (fade < hash(gl_FragCoord.xy)) discard;
  vec3 c = uColor * (0.16 + lam * 0.55) + uColor * fres * 1.1 + vec3(0.6, 1.0, 1.0) * band * 0.45 + uColor * uGlow;
  c *= scanl * (0.97 + 0.03 * sin(uTime * 40.0));
  gl_FragColor = vec4(c, 0.9 * uOpacity);
}
`;

const FRAG_LINE = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uOpacity;
varying vec3 vW;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  float fade = smoothstep(-2.0, -1.15, vW.y);
  if (fade < hash(gl_FragCoord.xy)) discard;
  float y0 = mix(1.0, -2.0, fract(uTime * 0.12));
  float band = smoothstep(0.14, 0.0, abs(vW.y - y0));
  gl_FragColor = vec4(uColor * (0.8 + band * 1.2), (0.3 + band * 0.5) * uOpacity);
}
`;

const FRAG_GLOW = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
varying vec3 vW;
void main() {
  float a = smoothstep(2.2, -1.9, vW.y) * smoothstep(-2.1, -1.6, vW.y) * 0.10;
  a *= 0.8 + 0.2 * sin(uTime * 2.0 + vW.y * 6.0);
  gl_FragColor = vec4(uColor, a);
}
`;

export default function Hologram({ reduced = false }: { reduced?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = box.current!;
    let dead = false;
    let started = false;
    let visible = false;
    let raf = 0;
    let cleanup = () => {};
    let kick = () => {};

    const start = async () => {
      if (started) return;
      started = true;
      try {
        const T = await import("three");
        if (dead) return;
        const renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);
        renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:pan-y;";

        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
        camera.position.set(0, -0.15, 5.7);
        camera.lookAt(0, -0.8, 0);

        const shared = { uTime: { value: 0 }, uGlitch: { value: 0 } };
        const body = (color: number, glow = 0, opacity = 1) =>
          new T.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG_BODY,
            transparent: true,
            uniforms: { ...shared, uColor: { value: new T.Color(color) }, uGlow: { value: glow }, uOpacity: { value: opacity } },
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 1,
          });
        const lineMat = new T.ShaderMaterial({
          vertexShader: VERT,
          fragmentShader: FRAG_LINE,
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
          uniforms: { ...shared, uColor: { value: new T.Color(0x7fe6ff) }, uOpacity: { value: 1 } },
        });
        const mSkin = body(0x3fb6d4);
        const mHair = body(0x2b57b8);
        const mJacket = body(0x1d6aa8);
        const mShirt = body(0x6fd0e6);
        const mLapel = body(0x2a86c4);
        const mFeature = body(0xbff6ff, 0.9);
        const mEye = body(0xe8fdff, 1.6);

        const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, edges = true, thr = 18) => {
          const mesh = new T.Mesh(geo, mat);
          parent.add(mesh);
          if (edges) mesh.add(new T.LineSegments(new T.EdgesGeometry(geo, thr), lineMat));
          return mesh;
        };

        const root = new T.Group();
        scene.add(root);
        const figure = new T.Group();
        root.add(figure);

        // torso and shoulders
        const torsoGeo = new T.SphereGeometry(1, 22, 14);
        torsoGeo.scale(1.12, 0.66, 0.52);
        const torso = add(figure, torsoGeo, mJacket, true, 22);
        torso.position.set(0, -1.38, 0);
        // shirt V and lapels
        const shirtShape = new T.Shape();
        shirtShape.moveTo(-0.2, 0);
        shirtShape.lineTo(0.2, 0);
        shirtShape.lineTo(0, -0.62);
        shirtShape.closePath();
        const shirt = add(figure, new T.ShapeGeometry(shirtShape), mShirt, false);
        shirt.position.set(0, -0.78, 0.37);
        shirt.rotation.x = -0.28;
        const lapel = (s: number) => {
          const sh = new T.Shape();
          sh.moveTo(0, 0);
          sh.lineTo(0.3 * s, 0.02);
          sh.lineTo(0.12 * s, -0.78);
          sh.lineTo(0.02 * s, -0.7);
          sh.closePath();
          const l = add(figure, new T.ShapeGeometry(sh), mLapel, true, 5);
          l.position.set(s * 0.1, -0.78, 0.375);
          l.rotation.set(-0.28, s * -0.2, s * 0.04);
        };
        lapel(1);
        lapel(-1);
        // neck
        const neck = add(figure, new T.CylinderGeometry(0.16, 0.2, 0.42, 10, 1), mSkin, true, 25);
        neck.position.set(0, -0.78, 0);

        // head pivots at the neck so it can look around
        const headPivot = new T.Group();
        headPivot.position.set(0, -0.62, 0);
        figure.add(headPivot);
        const H = new T.Group();
        H.position.set(0, 0.62, 0);
        headPivot.add(H);

        const headGeo = new T.IcosahedronGeometry(0.5, 2);
        const pos = headGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          x *= 0.82;
          z *= 0.9;
          y *= 1.12;
          if (y < 0) {
            const t = Math.min(1, -y / 0.56);
            const k = 1 - 0.3 * t * t;
            x *= k;
            z *= 1 - 0.12 * t;
          }
          pos.setXYZ(i, x, y, z);
        }
        headGeo.computeVertexNormals();
        add(H, headGeo, mSkin, true, 14);

        // hair: back cap and a swept quiff
        const capGeo = new T.SphereGeometry(0.545, 18, 12, 0, Math.PI * 2, 0, 1.28);
        capGeo.scale(0.86, 1.1, 0.94);
        const cap = add(H, capGeo, mHair, true, 20);
        cap.position.set(0, 0.04, -0.03);
        cap.rotation.x = -0.22;
        const quiffGeo = new T.IcosahedronGeometry(0.27, 1);
        quiffGeo.scale(1.45, 0.62, 1.25);
        const quiff = add(H, quiffGeo, mHair, true, 25);
        quiff.position.set(0.03, 0.56, 0.2);
        quiff.rotation.set(-0.5, 0, -0.08);
        const sideGeo = new T.BoxGeometry(0.06, 0.17, 0.26);
        for (const s of [-1, 1]) {
          const side = add(H, sideGeo, mHair, true, 25);
          side.position.set(s * 0.385, 0.27, -0.04);
        }

        // face
        const eyes: THREE.Mesh[] = [];
        for (const s of [-1, 1]) {
          const eye = add(H, new T.SphereGeometry(0.05, 10, 8), mEye, false);
          eye.position.set(s * 0.17, 0.06, 0.425);
          eyes.push(eye);
          const brow = add(H, new T.BoxGeometry(0.14, 0.024, 0.03), mFeature, false);
          brow.position.set(s * 0.17, 0.155, 0.43);
          brow.rotation.z = -s * 0.12;
          const ear = add(H, new T.IcosahedronGeometry(0.075, 0), mSkin, true, 20);
          ear.position.set(s * 0.405, 0.0, -0.02);
          ear.scale.set(0.5, 1.1, 0.8);
        }
        const nose = add(H, new T.ConeGeometry(0.05, 0.17, 4), mSkin, true, 20);
        nose.position.set(0, -0.04, 0.455);
        nose.rotation.x = -0.25;
        const mouth = add(H, new T.BoxGeometry(0.15, 0.02, 0.03), mFeature, false);
        mouth.position.set(0, -0.23, 0.41);

        // projector base, rings, beam
        const baseMat = new T.MeshBasicMaterial({ color: 0x7fe6ff, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false });
        const rings: THREE.Mesh[] = [];
        [[0.95, 0.007], [1.25, 0.005], [1.55, 0.004]].forEach(([r, w], i) => {
          const ring = new T.Mesh(new T.TorusGeometry(r, w, 6, 140), baseMat.clone());
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -1.95;
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 - i * 0.14;
          root.add(ring);
          rings.push(ring);
        });
        const beam = new T.Mesh(
          new T.CylinderGeometry(1.0, 1.25, 4.1, 40, 1, true),
          new T.ShaderMaterial({
            vertexShader: VERT,
            fragmentShader: FRAG_GLOW,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
            side: T.DoubleSide,
            uniforms: { ...shared, uColor: { value: new T.Color(0x4fd0ee) } },
          }),
        );
        beam.position.y = 0.0;
        root.add(beam);

        // orbiting skill tags
        const tagGroup = new T.Group();
        root.add(tagGroup);
        const tags = TAGS.map((label, i) => {
          const c = document.createElement("canvas");
          c.width = 256;
          c.height = 72;
          const x = c.getContext("2d")!;
          x.fillStyle = "rgba(10,25,32,0.72)";
          x.strokeStyle = "rgba(127,214,230,0.85)";
          x.lineWidth = 3;
          x.beginPath();
          x.roundRect(4, 4, 248, 64, 32);
          x.fill();
          x.stroke();
          x.fillStyle = "#bff6ff";
          x.font = "600 30px 'IBM Plex Mono', ui-monospace, monospace";
          x.textAlign = "center";
          x.textBaseline = "middle";
          x.fillText(label, 128, 37);
          const tex = new T.CanvasTexture(c);
          tex.colorSpace = T.SRGBColorSpace;
          const spr = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
          spr.scale.set(0.66, 0.186, 1);
          tagGroup.add(spr);
          return { spr, a0: (i / TAGS.length) * Math.PI * 2, y: -1.55 + ((i * 0.61) % 1.0) * 1.25, r: 1.2 + (i % 2) * 0.18 };
        });

        const resize = () => {
          const r = el.getBoundingClientRect();
          const w = Math.max(1, r.width), h = Math.max(1, r.height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.fov = w / h < 1 ? 37 : 30;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(() => {
          resize();
          if (!raf) render(last);
        });
        ro.observe(el);

        // interaction
        let nx = 0, ny = 0, hx = 0, hy = 0, yaw = 0, dragYaw = 0, vel = 0;
        let drag = false, lastX = 0, hover = false, pulse = 0, glitch = 0, nextGlitch = 3;
        let blink = 0, nextBlink = 2;
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          if (drag) {
            const d = (e.clientX - lastX) * 0.012;
            dragYaw += d;
            vel = d;
            lastX = e.clientX;
          } else if (e.pointerType !== "touch") {
            hover = true;
            nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
          }
        };
        const onDown = (e: PointerEvent) => {
          drag = true;
          lastX = e.clientX;
          el.setPointerCapture(e.pointerId);
          pulse = 1;
          glitch = 1;
        };
        const onUp = () => (drag = false);
        const onLeave = () => {
          hover = false;
          nx = 0;
          ny = 0;
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        el.addEventListener("pointerleave", onLeave);

        let last = performance.now();
        let time = 0;
        const render = (now: number) => {
          raf = 0;
          const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
          last = now;
          if (!reduced) {
            time += dt;
            if (!hover && !drag) {
              nx = Math.sin(time * 0.5) * 0.55;
              ny = Math.sin(time * 0.33) * 0.2;
            }
            if (!drag) {
              dragYaw += vel;
              vel *= 0.94;
              dragYaw *= 1 - Math.min(1, dt * 0.9);
            }
            const k = Math.min(1, dt * 4);
            hx += (nx - hx) * k;
            hy += (ny - hy) * k;
            pulse = Math.max(0, pulse - dt * 1.5);
            glitch = Math.max(0, glitch - dt * 5);
            if (time > nextGlitch) {
              glitch = 1;
              nextGlitch = time + 5 + Math.random() * 5;
            }
            if (time > nextBlink) {
              blink = 0.14;
              nextBlink = time + 2.2 + Math.random() * 3;
            }
            blink = Math.max(0, blink - dt);
          }
          const t = reduced ? 1.2 : time;
          shared.uTime.value = t;
          shared.uGlitch.value = glitch;
          yaw = hx * 0.5 + dragYaw;
          figure.rotation.y = yaw;
          headPivot.rotation.y = hx * 0.45;
          headPivot.rotation.x = hy * 0.22;
          figure.position.y = Math.sin(t * 1.3) * 0.012;
          figure.scale.setScalar(1 + Math.sin(t * 1.3) * 0.004);
          const eyeY = blink > 0 ? 0.08 : 1;
          eyes.forEach((e) => e.scale.set(1, eyeY, 1));
          rings.forEach((r, i) => {
            r.rotation.z = t * (0.18 + i * 0.07) * (i % 2 ? -1 : 1);
            const s = 1 + pulse * (0.35 + i * 0.12);
            r.scale.set(s, s, 1);
            (r.material as THREE.MeshBasicMaterial).opacity = (0.55 - i * 0.14) * (0.8 + 0.2 * Math.sin(t * 2 + i)) + pulse * 0.4;
          });
          tags.forEach((g, i) => {
            const a = g.a0 + t * (0.28 + (i % 3) * 0.05);
            g.spr.position.set(Math.cos(a) * g.r, g.y + Math.sin(t * 0.8 + i) * 0.06, Math.sin(a) * g.r);
            const front = (Math.sin(a) + 1) / 2;
            g.spr.material.opacity = 0.35 + front * 0.65;
          });
          renderer.render(scene, camera);
          if (visible && !document.hidden && !reduced) raf = requestAnimationFrame(render);
        };
        kick = () => {
          if (!raf && visible && !document.hidden) {
            last = performance.now();
            raf = requestAnimationFrame(render);
          }
        };
        const onVis = () => kick();
        document.addEventListener("visibilitychange", onVis);
        setReady(true);
        render(performance.now());
        kick();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          document.removeEventListener("visibilitychange", onVis);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerdown", onDown);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);
          el.removeEventListener("pointerleave", onLeave);
          scene.traverse((o) => {
            const m = o as THREE.Mesh;
            m.geometry?.dispose?.();
            const mat = m.material as THREE.Material | THREE.Material[] | undefined;
            (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!dead) setFailed(true);
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          start();
          kick();
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
    <figure
      role="img"
      aria-label="Interactive holographic bust. Move the pointer to make it look around, drag to spin it, tap to glitch it."
      className="m-0"
    >
      <div ref={box} className="holo relative h-[22rem] w-full select-none sm:h-[28rem] md:h-[32rem]">
        {failed && <p className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.16em] text-paper-dim">3D unavailable</p>}
        <span className="pointer-events-none absolute left-0 top-0 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-signal">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-signal align-middle motion-safe:animate-pulse" />
          {ready || failed ? "Live hologram" : "Booting"}
        </span>
      </div>
      <figcaption className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper-dim">
        {typeof window !== "undefined" && window.matchMedia("(hover: none)").matches ? "Drag to spin · tap to glitch" : "Move to look · drag to spin · tap to glitch"}
      </figcaption>
    </figure>
  );
}
