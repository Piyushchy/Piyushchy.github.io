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

## Notes
- Fonts (Instrument Serif, IBM Plex Sans/Mono) are bundled locally; no third-party requests.
- No analytics or tracking.
- Social preview image: `public/og.png` (1200x630). Replace it to change link previews.
