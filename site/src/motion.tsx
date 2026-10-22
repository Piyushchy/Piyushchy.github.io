import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/**
 * Motion setup for the whole site.
 * - LazyMotion + `m` components keep the animation bundle small (domAnimation only).
 * - reducedMotion="user": visitors who ask the OS for less motion get fades only,
 *   no movement, without any per-component code.
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
