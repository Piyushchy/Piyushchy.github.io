# Portfolio source

React + TypeScript + Vite + Tailwind. GitHub Pages serves the built files from the
repository root, so this folder holds the source and the root holds the output.

## Edit your content
Everything personal lives in `src/data.ts`: name, intro, links (LinkedIn, email,
resume), projects, skills, timeline. Empty link fields are hidden automatically.
Add a project by appending an object to `projects`; set `repo` / `demo` to show links.

## Run locally
```
cd site
pnpm install
pnpm dev          # http://localhost:5173
```

## Publish
```
pnpm build            # type-check + production build into site/dist
pnpm publish:pages    # copies dist/ into the repo root
git add -A && git commit -m "Update site" && git push
```
Pages must be set to deploy from branch `main`, folder `/ (root)`.

## Activity (contribution skyline)
The "A year on GitHub" section renders only when `src/contributions.json` has real data
(it ships empty, so the section is hidden and the component is never downloaded).
To fill it with your real contributions:
```
GITHUB_TOKEN=<token> pnpm contributions     # writes src/contributions.json
pnpm build && pnpm publish:pages
```
The token is read from the environment only and is never stored. Any token that can read
public data works. The component is `src/components/ui/contribution-skyline.tsx`
(one class tweak so stat units wrap on narrow screens).

## Motion
Animation uses Motion (`motion/react`) through `LazyMotion` + `m` components. Scroll reveals
are `{...reveal(delay)}` from `src/presets.ts`; reduced-motion preferences are honored
globally by `MotionConfig` in `src/motion.tsx`.

## Notes
- Fonts (Instrument Serif, IBM Plex Sans/Mono) are bundled locally; no third-party requests.
- No analytics or tracking.
- Social preview image: `public/og.png` (1200x630). Replace it to change link previews.
