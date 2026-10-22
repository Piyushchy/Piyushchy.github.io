/** Shared easing: fast start, soft landing. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Scroll-reveal props. Spread onto any `m.*` element:
 *   <m.p {...reveal(0.1)}>…</m.p>
 * Animates once, when ~8% of the element has entered the viewport.
 */
export const reveal = (delay = 0, y = 14) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "0px 0px -8% 0px" },
  transition: { duration: 0.6, ease: EASE, delay },
});
