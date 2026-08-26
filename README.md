# DO/IT — Execution Board

A brutalist productivity app for people who are done negotiating with themselves.
Queue the work, press the button, run the clock, ship the thing.

Built with **React + TypeScript + Vite + Tailwind CSS v4**.

## What it does

- **Work Order intake** — add the tasks you've been avoiding, tag them `NOW` / `SOON` / `LATER`, queue them up. Press `/` anywhere to grab the input, `Enter` to submit.
- **Now Dock** — one task at a time. Run a focus round (5 / 15 / 25 / 45 min), pause/resume, then **SHIP IT** (early is fine — focus time is logged) or **BAIL** back to the queue. Completing a round hits the full-screen *SHIPPED* stamp.
- **Queue** — sorted by urgency and age, with live wait times. A shipped log records every completed task with its timestamp.
- **Record** — shipped-today counter, verified focus minutes, shipping streak, and a 14-day momentum heatmap. All history lives in `localStorage` and never leaves the machine.
- **Excuse Shredder** — pick the excuse you were about to tell yourself and get typed-back, slightly judgmental comebacks from the comeback terminal.

## Design

Swiss-poster brutalism: paper and ink palette, vermilion / cobalt / sun accents, Anton display type, Archivo body, IBM Plex Mono labels — hard shadows, press physics, decode-on-load headline, scroll reveals, ambient drift, film grain. Honors `prefers-reduced-motion`.

## Develop

```bash
npm install
npm run dev        # start the dev server
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit
```

## Tech notes

- Zero runtime dependencies beyond React — all icons are hand-drawn inline SVG, timers are drift-free (`performance`-anchored end timestamps).
- State persistence via `localStorage` (`doit.tasks.v1`, `doit.stats.v1`, `doit.preset.v1`), seeded with starter data on first visit.
