import { profile } from "../data";
import OrderField from "./ui/order-field";
import { PrismaHero } from "./ui/prisma-hero";

/**
 * Opening screen. The backdrop is drawn live in code (see ui/order-field),
 * so there is no video to download and nothing to wait for.
 */
export default function Hero() {
  return (
    <div id="top">
      <PrismaHero
        title="Piyush"
        titleLabel="Piyush Chaudhary"
        headline={profile.headline}
        description={profile.heroSub}
        ctaLabel="See the work"
        ctaHref="#projects"
        secondaryLabel="GitHub"
        secondaryHref={profile.links.github}
        backdrop={<OrderField />}
      />
    </div>
  );
}
