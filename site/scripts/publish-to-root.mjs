// Copies the production build (site/dist) into the repository root, which is
// what GitHub Pages serves for a user site (Piyushchy.github.io on main, "/").
// Usage: pnpm build && pnpm publish:pages
import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, "../dist");
const root = resolve(here, "../..");

if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/index.html not found. Run `pnpm build` first.");
  process.exit(1);
}

// Remove previously published output (but never the source folder or git data).
rmSync(join(root, "assets"), { recursive: true, force: true });
for (const f of readdirSync(dist)) {
  if (f === "assets") continue;
  rmSync(join(root, f), { recursive: true, force: true });
}

cpSync(dist, root, { recursive: true });
writeFileSync(join(root, ".nojekyll"), "");
console.log(`Published ${dist} -> ${root}`);
