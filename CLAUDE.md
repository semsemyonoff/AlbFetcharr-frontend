# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AlbFetcharr's **frontend**: a React 18 + Vite single-page app that drives a
three-step flow — **Select → Results → Download** — for fetching Lidarr's
wanted/missing albums from music sources (Yandex Music, YouTube Music,
SoundCloud) and importing them.

This repository is the **frontend only**. It talks to the AlbFetcharr backend
purely over HTTP (`/api`, `/static`); there is no shared code or filesystem with
the backend, which lives in a **separate repository**. The production build is a
static bundle in `dist/` that any HTTP server can host — the backend happens to
serve it, but the SPA has no knowledge of how or where it is deployed.

## Tech stack

- **Framework**: React 19 — function components + hooks only (`useState` /
  `useReducer` / `useRef`; no state-management library).
- **Build tool**: Vite 8 with `@vitejs/plugin-react`.
- **Language**: plain JavaScript + JSX (no TypeScript).
- **Routing**: none — a single page with an in-component step state machine.
- **Lint/format**: ESLint (flat config) + Prettier.
- **Tests**: Vitest + jsdom (+ `@testing-library/jest-dom`).

## Requirements

- Node.js 20.19+ (Vite 8 / ESLint require `^20.19.0 || >=22.12.0`)

## Commands

```bash
npm install            # install dependencies

npm run dev            # Vite dev server on :5173 (HMR)
npm run build          # production build → dist/ (base = /static/dist/)
npm run preview        # serve the production build locally

npm test               # run the Vitest suite once
npm run test:watch     # Vitest in watch mode
npm run test:cov       # Vitest with a coverage report

npm run lint           # ESLint
npm run lint:fix       # ESLint with autofix
npm run format         # Prettier --write
npm run format:check   # Prettier --check (CI gate)
```

The dev server proxies `/api` and `/static` to the backend. The target defaults
to `http://localhost:5000`; override it with `BACKEND_URL`:

```bash
BACKEND_URL=http://localhost:5001 npm run dev
```

All API calls use **absolute paths** (`/api/...`) so the dev proxy and a
production host behave identically. See `vite.config.js` for the proxy, the
production `base`, and the Vitest block.

## Architecture

```
.
├── index.html              # Vite entry HTML; loads src/main.jsx into #root; favicon links
├── public/                 # copied verbatim to dist/ root (favicons: favicon.svg, favicon-32/128.png, apple-touch-icon.png — sourced from the backend logo set)
├── vite.config.js          # dev proxy, prod base (/static/dist/), Vitest config
├── eslint.config.js        # ESLint flat config (React + hooks + refresh + Vitest globals)
├── .prettierrc.json        # Prettier config
├── test/
│   └── setup.js            # @testing-library/jest-dom for Vitest
└── src/
    ├── main.jsx            # React entry; mounts <App>, imports styles.css
    ├── app.jsx             # Root component (see "Step flow" below)
    ├── select-step.jsx     # Step 1 — pick wanted albums
    ├── results-step.jsx    # Step 2 — per-album source candidates
    ├── download-step.jsx   # Step 3 — live download progress (SSE)
    ├── select-helpers.js   # sortAlbums / filterAlbums / paginate
    ├── results-helpers.js  # scoreCandidate (Levenshtein) / getBestCandidate
    ├── download-helpers.js # parseSSEEvent / applyProgressUpdate
    ├── accent-helpers.js   # ACCENT_PALETTES + accentVars/applyAccent/parseAccent (palette → CSS vars)
    ├── i18n.js             # I18N (en/ru) tables + AGO_FNS + I18N_FNS/pluralRu (interpolation + RU plurals)
    ├── icons.jsx           # <Icon name=… /> named SVG set
    ├── tweaks-panel.jsx    # Generic settings UI kit + useTweaks() hook
    ├── styles.css          # All styling via CSS variables; light/dark/system themes; responsive (1024/640/380)
    ├── assets/             # Static assets (logo)
    └── __tests__/          # Vitest specs for the pure helpers, i18n, theme resolution
```

`src/*-helpers.js` are **pure** (no React imports) and each has a co-located test
in `src/__tests__/`; keep new business logic there so it stays unit-testable.
`tweaks-panel.jsx` is a self-contained widget kit (`TweaksPanel`, `TweakSection`,
`TweakRow`, `TweakSlider`, `TweakToggle`, `TweakRadio`, `TweakSelect`,
`TweakText`, `TweakNumber`, `TweakColor`, `TweakButton`) plus the `useTweaks`
state hook.

Two helper patterns added in the design-audit pass are worth knowing:

- **i18n interpolation lives outside the `I18N` tables.** A parity test asserts
  every `I18N` value is a plain string, so any string needing a count or argument
  is built by an exported function instead: `pluralRu(n, [one, few, many])`
  applies real Russian plural rules, and `I18N_FNS` holds the per-message
  interpolation functions (e.g. `batchPosition(lang, i, total)`). Add new
  parametrized strings there, not as `I18N` entries, and never use the English
  `n !== 1 ? 's' : ''` shape for RU.
- **Accent palette → CSS vars is a pure helper.** `accent-helpers.js` maps a
  `[from, to]` palette to `{ '--accent-blue', '--accent-teal', '--accent-grad' }`;
  `applyAccent` writes them to `document.documentElement` and the chosen palette
  persists under the namespaced `albfetcharr.accent` key (alongside
  `albfetcharr.lang` / `albfetcharr.theme`), restored in the same `/api/config`
  startup block.

## Step flow

`app.jsx` is the whole application shell. It owns a `step` state machine:

`select` → `searching` → `results` → `download`

- **select** — `SelectStep` lists Lidarr's wanted albums (loaded from
  `/api/wanted`); the user filters/sorts/paginates and chooses what to fetch.
- **searching** — interim state while `/api/search` is queried per album.
- **results** — `ResultsStep` shows candidate matches per source, scored and
  grouped; the user picks the best per album.
- **download** — `DownloadStep` starts the download (`/api/download`) and streams
  progress over Server-Sent Events, claiming the stream first via
  `/api/download/stream/claim`.

On top of the steps, `App` also manages: language (`en`/`ru`) and theme
(`light`/`dark`/`system`, persisted to `localStorage`, with a live
`prefers-color-scheme` listener for `system`), and an initial `/api/config`
fetch for server-provided defaults.

## Backend API (consumed)

The SPA depends on these backend endpoints (paths only — the backend repo owns
their contracts):

- `GET /api/config` — default language / theme.
- `GET /api/wanted` — Lidarr wanted/missing albums.
- `GET /api/sources` — available source providers.
- `GET /api/search` — candidate matches for an album.
- `POST /api/download` — start a download; progress arrives as SSE on
  `/api/download/stream`, gated by `POST /api/download/stream/claim`.

## Conventions

- Plain JavaScript + JSX, function components + hooks only — no TypeScript, no
  router, no state-management library.
- Prettier: single quotes, semicolons, `printWidth: 80`. Run `npm run format`
  before committing; `npm run lint` and `npm run format:check` must pass.
- Absolute API paths (`/api/...`) so dev-proxy and production behave the same.
- The UI is bilingual (EN/RU) via `src/i18n.js` — every user-facing string goes
  through `I18N`, and `en`/`ru` must keep identical key sets (a test enforces
  this). Code, comments, and log output are in English; `README.md` is in Russian
  (the canonical user-facing doc).

## Responsive layout

`styles.css` is desktop-first with **three breakpoints**, applied in this order
(narrower tiers override wider ones):

- `@media (max-width: 1024px)` — **tablet**: tighter app padding/gaps, smaller
  step headers, denser action bar.
- `@media (max-width: 640px)` — **mobile**: the app bar wraps to two rows, the
  stepper scrolls horizontally, the action bar becomes sticky, and the Step-1
  **table reflows to cards** — `.wt-table-wrap { display:none }` /
  `.wt-cards { display:flex }`. Both markups live in `select-step.jsx` and render
  from the same selection/sort state.
- `@media (max-width: 380px)` — **small phone**: single-column download rows,
  shrunk brand, tighter toggles.

When adding layout, put the rule in the correct existing tier rather than
introducing a new breakpoint. A static test (`styles-responsive.test.js`) guards
that these widths and the `.wt-table-wrap` / `.wt-cards` selectors stay present.
