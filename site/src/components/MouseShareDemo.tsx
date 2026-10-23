import { m, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

/**
 * MouseShare, live. A Windows PC and an Android phone side by side.
 * Move your real mouse over the stage: one cursor follows it, turns into a
 * dot while it crosses the gap, and lands on the other device as that
 * device's own pointer. Whatever you type goes to the screen the cursor was
 * last on. On touch, tap a screen and type. Until you touch it, a short
 * scripted run shows the idea. It is an illustration of the behaviour, not
 * the real app, and nothing you type leaves the page.
 */

type Dev = "pc" | "phone";
type Region = Dev | "gap";
const MAX = 90;

const WinArrow = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
    <path d="M3 2v15l4.2-3.6 2.6 5.6 2.6-1.2-2.6-5.5H15z" fill="#fff" stroke="#000" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);
const AndroidPtr = () => (
  <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
    <circle cx="15" cy="15" r="12" fill="rgba(255,255,255,0.22)" stroke="#fff" strokeWidth="1.6" />
    <circle cx="15" cy="15" r="4.2" fill="#fff" />
  </svg>
);

function Caret({ on }: { on: boolean }) {
  return on ? <span className="ms-caret" aria-hidden="true" /> : null;
}

function Pc({ text, active, screenRef, onPick }: { text: string; active: boolean; screenRef: React.Ref<HTMLDivElement>; onPick: () => void }) {
  return (
    <div className="ms-pc" data-active={active}>
      <div className="ms-pc-bezel">
        <div ref={screenRef} className="ms-pc-screen" onPointerDown={onPick}>
          <div className="ms-win-bloom" aria-hidden="true" />
          <div className="ms-notepad">
            <div className="ms-np-title">
              <span>Untitled - Notepad</span>
              <span className="ms-np-ctl" aria-hidden="true">
                <i>&#8211;</i>
                <i>&#9633;</i>
                <i>&#10005;</i>
              </span>
            </div>
            <div className="ms-np-menu" aria-hidden="true">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
            </div>
            <div className="ms-np-text">
              {text}
              <Caret on={active} />
            </div>
          </div>
          <div className="ms-taskbar" aria-hidden="true">
            <span className="ms-tb-left" />
            <span className="ms-tb-center">
              <svg viewBox="0 0 16 16" width="1em" height="1em">
                <path fill="#4cc2ff" d="M1 2.4 7 1.5v5.6H1zM8 1.4l7-1v6.7H8zM1 8h6v5.6l-6-.9zM8 8h7v6.6l-7-1z" />
              </svg>
              <span className="ms-tb-search" />
              <span className="ms-tb-dot" style={{ background: "#f5a623" }} />
              <span className="ms-tb-dot" style={{ background: "#3ecf8e" }} />
              <span className="ms-tb-dot" style={{ background: "#7fd6e6" }} />
            </span>
            <span className="ms-tb-right">
              <span>10:42</span>
              <span>23-10-2026</span>
            </span>
          </div>
        </div>
      </div>
      <div className="ms-pc-neck" />
      <div className="ms-pc-foot" />
    </div>
  );
}

function Phone({ text, active, screenRef, onPick }: { text: string; active: boolean; screenRef: React.Ref<HTMLDivElement>; onPick: () => void }) {
  return (
    <div className="ms-phone" data-active={active}>
      <span className="ms-phone-btn" aria-hidden="true" />
      <div className="ms-phone-body">
        <div ref={screenRef} className="ms-phone-screen" onPointerDown={onPick}>
          <span className="ms-hole" aria-hidden="true" />
          <div className="ms-status" aria-hidden="true">
            <span>10:42</span>
            <span className="ms-status-ic">
              <svg viewBox="0 0 16 12" width="1.2em" height="1em">
                <path fill="#e6e1e5" d="M8 11 .5 3.2a10.6 10.6 0 0 1 15 0z" />
              </svg>
              <svg viewBox="0 0 10 14" width="0.7em" height="1em">
                <rect x="1" y="2" width="8" height="11" rx="1.6" fill="#e6e1e5" />
                <rect x="3.5" y="0" width="3" height="2" fill="#e6e1e5" />
              </svg>
            </span>
          </div>
          <div className="ms-appbar" aria-hidden="true">
            <span>&#8592;</span>
            <span className="ms-appbar-title">Note</span>
            <span className="ms-appbar-dots">&#8942;</span>
          </div>
          <div className="ms-note">
            <div className="ms-note-title" aria-hidden="true">Typed from my PC</div>
            <div className="ms-note-text">
              {text}
              <Caret on={active} />
            </div>
          </div>
          <div className="ms-nav" aria-hidden="true">
            <svg viewBox="0 0 14 14" width="1em" height="1em">
              <path d="M11 2 3 7l8 5z" fill="#e6e1e5" />
            </svg>
            <svg viewBox="0 0 14 14" width="1em" height="1em">
              <circle cx="7" cy="7" r="5" fill="none" stroke="#e6e1e5" strokeWidth="1.8" />
            </svg>
            <svg viewBox="0 0 14 14" width="1em" height="1em">
              <rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="none" stroke="#e6e1e5" strokeWidth="1.8" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MouseShareDemo() {
  const secRef = useRef<HTMLElement>(null);
  const devRef = useRef<HTMLDivElement>(null);
  const pcScreen = useRef<HTMLDivElement>(null);
  const phoneScreen = useRef<HTMLDivElement>(null);
  const cursor = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const reduced = useReducedMotion();

  const [active, setActive] = useState<Dev>("pc");
  const [region, setRegion] = useState<Region>("pc");
  const [glide, setGlide] = useState(false);
  const [shown, setShown] = useState(false);
  const [texts, setTexts] = useState<Record<Dev, string>>({ pc: "", phone: "" });
  const activeRef = useRef<Dev>("pc");
  const run = useRef({ id: 0, started: false, user: false });
  const touchOnly = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;

  const choose = useCallback((d: Dev) => {
    activeRef.current = d;
    setActive(d);
    setRegion(d);
  }, []);

  const place = (x: number, y: number) => {
    if (cursor.current) cursor.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const rel = (el: HTMLElement | null, fx: number, fy: number) => {
    const s = devRef.current!.getBoundingClientRect();
    const r = el!.getBoundingClientRect();
    return { x: r.left - s.left + r.width * fx, y: r.top - s.top + r.height * fy };
  };
  const hit = (cx: number, cy: number): Region => {
    const inside = (el: HTMLElement | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    };
    if (inside(pcScreen.current)) return "pc";
    if (inside(phoneScreen.current)) return "phone";
    return "gap";
  };

  // real mouse: one cursor, region decides its look and where typing goes
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    run.current.user = true;
    run.current.id++;
    setGlide(false);
    setShown(true);
    const s = devRef.current!.getBoundingClientRect();
    place(e.clientX - s.left, e.clientY - s.top);
    const r = hit(e.clientX, e.clientY);
    setRegion(r);
    if (r !== "gap" && r !== activeRef.current) choose(r);
    if (document.activeElement !== input.current) input.current?.focus({ preventScroll: true });
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    setShown(false);
    if (document.activeElement === input.current) input.current?.blur();
  };
  const pick = (d: Dev) => {
    choose(d);
    input.current?.focus({ preventScroll: true });
  };

  const add = (s: string) =>
    setTexts((t) => {
      const d = activeRef.current;
      const next = (t[d] + s).slice(0, MAX);
      return { ...t, [d]: next };
    });
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    e.currentTarget.value = "";
    if (v) add(v);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setTexts((t) => ({ ...t, [activeRef.current]: t[activeRef.current].slice(0, -1) }));
    } else if (e.key === "Enter") {
      add("\n");
    } else if (e.key === "Escape") {
      input.current?.blur();
    }
  };
  const reset = () => setTexts({ pc: "", phone: "" });

  // the scripted run: only until the visitor takes over
  useEffect(() => {
    const el = devRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || run.current.started || run.current.user) return;
        run.current.started = true;
        const my = ++run.current.id;
        const ok = () => run.current.id === my;
        const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
        const type = async (d: Dev, s: string) => {
          for (const ch of s) {
            if (!ok()) return;
            setTexts((t) => ({ ...t, [d]: t[d] + ch }));
            await wait(62);
          }
        };
        const go = async (d: Dev, fx: number, fy: number, from: Dev | null) => {
          const p = rel(d === "pc" ? pcScreen.current : phoneScreen.current, fx, fy);
          if (!from) {
            setGlide(false);
            place(p.x, p.y);
            setShown(true);
            await wait(80);
          } else {
            setGlide(true);
            setRegion("gap");
            place(p.x, p.y);
            await wait(1000);
          }
          if (!ok()) return;
          choose(d);
        };
        (async () => {
          await wait(500);
          if (!ok()) return;
          await go("pc", 0.45, 0.5, null);
          await wait(500);
          await type("pc", "Typed on the PC.");
          await wait(600);
          if (!ok()) return;
          await go("phone", 0.5, 0.45, "pc");
          await wait(500);
          await type("phone", "Now it lands here.");
          await wait(700);
          if (!ok()) return;
          await go("pc", 0.7, 0.75, "phone");
          await wait(1400);
          if (ok()) setShown(false);
        })();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [choose]);

  // entrance: devices arrive as the section scrolls in
  const { scrollYProgress } = useScroll({ target: secRef, offset: ["start 0.95", "start 0.4"] });
  const pcY = useTransform(scrollYProgress, [0, 1], [50, 0]);
  const pcS = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const pcO = useTransform(scrollYProgress, [0, 0.6], [0, 1]);
  const phX = useTransform(scrollYProgress, [0, 1], [90, 0]);
  const phR = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const phO = useTransform(scrollYProgress, [0.1, 0.7], [0, 1]);

  const pcStyle = reduced ? undefined : { y: pcY, scale: pcS, opacity: pcO };
  const phStyle = reduced ? undefined : { x: phX, rotate: phR, opacity: phO };

  return (
    <section ref={secRef} id="mouseshare" className="py-16 md:py-24" aria-labelledby="ms-title">
      <div className="wrap">
        <p className="marker">03 / Try it</p>
        <h2 id="ms-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl">
          MouseShare, <span className="text-signal">live</span>
        </h2>
        <p className="mt-4 max-w-xl text-paper-dim sm:text-lg">
          {touchOnly
            ? "My PC's mouse and keyboard, shared with an Android phone. Tap a screen and type to see where the keys land."
            : "My PC's mouse and keyboard, shared with an Android phone. Move your mouse from the PC across to the phone, then type. The keys land on whichever screen the cursor is on."}
        </p>

        <div
          ref={devRef}
          className="ms-stage relative mx-auto mt-10 md:mt-14"
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <m.div className="ms-pc-wrap" style={pcStyle}>
            <Pc text={texts.pc} active={active === "pc"} screenRef={pcScreen} onPick={() => pick("pc")} />
            <p className="ms-tag">
              <span>Windows PC</span>
              {active === "pc" && <b>typing here</b>}
            </p>
          </m.div>

          <div className="ms-link" data-live={region === "gap"} aria-hidden="true">
            <span className="ms-link-line" />
            <span className="ms-link-dot" />
          </div>

          <m.div className="ms-phone-wrap" style={phStyle}>
            <Phone text={texts.phone} active={active === "phone"} screenRef={phoneScreen} onPick={() => pick("phone")} />
            <p className="ms-tag">
              <span>Android phone</span>
              {active === "phone" && <b>typing here</b>}
            </p>
          </m.div>

          <div ref={cursor} className="ms-cursor" data-glide={glide} data-shown={shown} data-region={region} aria-hidden="true">
            {region === "pc" && <WinArrow />}
            {region === "phone" && <AndroidPtr />}
            {region === "gap" && <span className="ms-orb" />}
          </div>

          <input
            ref={input}
            className="ms-input"
            aria-label="Type here to send keys to the PC or the phone in the demo"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={onInput}
            onKeyDown={onKey}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <button type="button" className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]" aria-pressed={active === "pc"} onClick={() => pick("pc")}>
            Type on PC
          </button>
          <button type="button" className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]" aria-pressed={active === "phone"} onClick={() => pick("phone")}>
            Type on phone
          </button>
          <button type="button" className="tap link-underline font-mono text-xs uppercase tracking-[0.14em]" onClick={reset}>
            Clear
          </button>
        </div>
        <p className="marker mt-5 text-center">Illustration of how it behaves, not the real app. Nothing you type leaves this page.</p>
      </div>
    </section>
  );
}
