import { lazy, Suspense } from "react";
import { m } from "motion/react";
import raw from "../contributions.json";
import { reveal } from "../presets";

/**
 * Real GitHub contribution data only. `src/contributions.json` holds
 * [{ "date": "YYYY-MM-DD", "count": 3 }, ...] and is produced by
 * `pnpm contributions` (see scripts/fetch-contributions.mjs).
 * While it is empty this whole section renders nothing, and the heavy
 * canvas component is never even downloaded.
 */
const data = raw as { date: string; count: number }[];

const ContributionSkyline = lazy(() => import("./ui/contribution-skyline"));

export default function Activity() {
  if (!data.length) return null;
  return (
    <section id="activity" className="py-16 md:py-24" aria-labelledby="activity-title">
      <div className="wrap">
        <m.p className="marker" {...reveal(0)}>
          Activity
        </m.p>
        <m.h2 id="activity-title" className="mt-3 text-5xl sm:text-6xl md:text-7xl" {...reveal(0.06)}>
          A year on GitHub
        </m.h2>
        <m.div className="mt-10" {...reveal(0.1)}>
          <Suspense fallback={<div className="h-[260px]" aria-hidden="true" />}>
            <ContributionSkyline
              data={data}
              palette="ember"
              title={null}
              footer={undefined}
              orbit
            />
          </Suspense>
        </m.div>
      </div>
    </section>
  );
}
