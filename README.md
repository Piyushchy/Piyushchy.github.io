# Piyush Chaudhary — Portfolio

**Live:** https://piyushchy.github.io

A mobile-first, dark-first developer portfolio. The page is a scroll-driven story: an intro drawn live on a canvas, a pinned film that walks through the projects, a thread of light that follows you down the page, and a few small things you can actually use.

## What's on the page

- **Intro** — a pinned scroll story computed in code (no video file). Crooked scanned marks straighten, get boxed, and gather into clusters.
- **Up close** — a pinned scene with four acts: a table extractor on a laptop, MouseShare between a Windows PC and an Android phone, an AWS deployment diagram, and RNN vs LSTM training curves.
- **MouseShare demo** — a working mock of a Windows PC and an Android phone. One mouse and keyboard move freely between the two screens, and typing lands on the screen you're on.
- **Projects** — stacking case-study cards.
  - *The Tangled Path*, a choice-based anti-drug game that placed 1st runner up at a hackathon.
  - *GIF Crop & Overlay*, a browser tool you can try inside its card, or open at [`/gif-tool/`](https://piyushchy.github.io/gif-tool/).
- **Activity** — a 3D skyline of my real GitHub contributions.
- **Toolbox** — a match board: tap a project and its skills light up, or tap a skill and the projects that used it light up.
- **Experience, contact** — timeline, and a closing section with my email and links.

Reduced-motion visitors get static versions of every scroll scene.

## Stack

React 19, TypeScript, Vite, Tailwind CSS, [Motion](https://motion.dev) (`motion/react`), lucide-react, and self-hosted fonts via Fontsource (Bricolage Grotesque, IBM Plex Sans and Mono). Package manager: pnpm.

## Repository layout

GitHub Pages serves a user site from the repository root, so this repo holds both the source and the built output.

| Path | What it is |
| --- | --- |
| `site/` | The source code. Everything is edited here. |
| `site/src/data.ts` | All personal content: profile, projects, skills, timeline. |
| `site/public/gif-tool/` | The GIF Crop & Overlay tool, a single self-contained HTML file. |
| `index.html`, `assets/`, `gif-tool/`, … (root) | Built output. Generated, do not edit by hand. |

## Run it locally

```bash
cd site
pnpm install
pnpm dev          # http://localhost:5173
```

## Change the content

Everything personal is in `site/src/data.ts`. To add a project, append an object to `projects`. The `repo`, `demo` and `embed` fields hide themselves when left empty, and the skills board builds its links from each project's `stack`.

## Publish

```bash
cd site
pnpm build            # type-check and build into site/dist
pnpm publish:pages    # copy dist/ into the repository root
cd ..
git add -A && git commit -m "Update site" && git push origin main
```

In the repo settings, Pages must deploy from branch `main`, folder `/ (root)`.

## Refresh the GitHub activity

```bash
cd site
GITHUB_TOKEN=<token> pnpm contributions   # writes src/contributions.json
pnpm build && pnpm publish:pages
```

The token is read from the environment only and is never written to disk. A token with no special scopes is enough for public contributions.

## Contact

[piyushchy@is-a.dev](mailto:mail@piyushchy.is-a.dev) · [github.com/Piyushchy](https://github.com/Piyushchy)
