import { lazy, Suspense } from "react";
import { m } from "motion/react";
import raw from "../contributions.json";
import { reveal } from "../presets";

/**
 * Real GitHub contribution data only. `src/contributions.json` holds
 * [{ "date": "YYYY-MM-DD", "count": 3 }, ...] and is produced by
 * `pnpm contributions` (see scripts/fetch-contributions.mjs).
 * While it is empty, the component's built-in generated sample year is shown
 * and labelled "Sample data" so it is never mistaken for real activity.
 */
const data = raw as { date: string; count: number }[];

const ContributionSkyline = lazy(() => import("./ui/contribution-skyline"));

export default function Activity() {
  const real = data.length > 0;
  return (
    <section id="activity" className="py-16 md:py-24" aria-labelledby="activity-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          Activity
        </m.p>
        <m.h2 id="activity-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
          A year on GitHub
        </m.h2>
        {!real && (
          <m.p className="mt-3 font-mono text-xs text-signal" {...reveal(0.08)}>
            Sample data for now. My real activity replaces it once my GitHub numbers are connected.
          </m.p>
        )}
        <m.div className="mt-10" {...reveal(0.1)}>
          <Suspense fallback={<div className="h-[260px]" aria-hidden="true" />}>
            <div className="mx-auto w-full max-w-[980px]">
              <ContributionSkyline data={real ? data : undefined} />
            </div>
          </Suspense>
        </m.div>
      </div>
    </section>
  );
}
