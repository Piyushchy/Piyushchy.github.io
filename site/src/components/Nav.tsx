import { AnimatePresence, m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { profile } from "../data";
import { useActiveSection } from "../hooks";
import { EASE } from "../presets";

const LINKS = [
  { id: "about", label: "About" },
  { id: "pipeline", label: "Pipeline" },
  { id: "projects", label: "Projects" },
  { id: "activity", label: "Activity" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];
const IDS = ["top", ...LINKS.map((l) => l.id)];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(IDS);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Escape closes, focus returns to the toggle; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled || open ? "hairline md:border-transparent" : "border-transparent"
      }`}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      {/* Blur lives on its own layer: backdrop-filter on the header itself would
          become the containing block for the fixed mobile menu and collapse it. */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 transition-opacity duration-300 md:hidden ${
          scrolled || open ? "bg-ink/85 opacity-100 backdrop-blur-md" : "opacity-0"
        }`}
      />
      <nav className="wrap flex h-14 items-center justify-between" aria-label="Primary">
        <a href="#top" className="tap font-display text-xl leading-none md:hidden" aria-label={`${profile.name}, back to top`}>
          Piyush<span className="text-signal">.</span>
        </a>

        <ul className="absolute left-1/2 top-0 hidden h-12 -translate-x-1/2 items-center gap-1 rounded-b-2xl border border-t-0 hairline bg-ink/80 px-4 backdrop-blur-md md:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                aria-current={active === l.id ? "true" : undefined}
                className={`tap px-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] transition-colors hover:text-paper ${
                  active === l.id ? "text-signal" : "text-paper-dim"
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={profile.links.github}
          target="_blank"
          rel="noopener noreferrer"
          className="tap ml-auto hidden border hairline bg-ink/60 px-3 font-mono text-[0.72rem] uppercase tracking-[0.14em] backdrop-blur-md transition-colors hover:border-signal hover:text-signal md:inline-flex"
        >
          GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>

        <button
          ref={btnRef}
          type="button"
          className="tap -mr-2 min-w-[44px] justify-center md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="relative block h-3 w-6" aria-hidden="true">
            <span
              className={`absolute left-0 top-0 block h-px w-6 bg-paper transition-transform duration-300 ${
                open ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute bottom-0 left-0 block h-px w-6 bg-paper transition-transform duration-300 ${
                open ? "-translate-y-[5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            ref={menuRef}
            className="fixed inset-x-0 bottom-0 bg-ink md:hidden"
            style={{ top: "calc(3.5rem + var(--safe-top))", paddingBottom: "var(--safe-bottom)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.25, ease: EASE } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <ul className="wrap flex h-full flex-col justify-center gap-1 pb-16">
              {LINKS.map((l, i) => (
                <m.li
                  key={l.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE, delay: 0.05 + i * 0.045 } }}
                >
                  <a
                    href={`#${l.id}`}
                    onClick={() => setOpen(false)}
                    className="tap flex w-full items-baseline gap-4 border-b hairline py-4 font-display text-4xl"
                  >
                    <span className="marker w-6">{String(i + 1).padStart(2, "0")}</span>
                    {l.label}
                  </a>
                </m.li>
              ))}
              <m.li
                className="mt-6 flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.35, delay: 0.3 } }}
              >
                <a
                  href={profile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap border hairline px-4 font-mono text-xs uppercase tracking-[0.14em]"
                >
                  GitHub<span className="sr-only"> (opens in a new tab)</span>
                </a>
                {profile.links.linkedin && (
                  <a
                    href={profile.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap border hairline px-4 font-mono text-xs uppercase tracking-[0.14em]"
                  >
                    LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </m.li>
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
