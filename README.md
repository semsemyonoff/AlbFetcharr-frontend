# AlbFetcharr frontend

The React 19 + Vite single-page app for
[AlbFetcharr](https://github.com/semsemyonoff/AlbFetcharr-backend) — a three-step
UI (Select → Results → Download). It talks to the backend purely over HTTP
(`/api`, `/static`); there's no shared code or filesystem — the backend lives in
its own repo.

> **This repo is the UI, not its deployment.** The production image bundles the
> built SPA into the backend image; the Docker/compose wiring lives in the deploy
> repo: [`AlbFetcharr/deploy`](https://github.com/semsemyonoff/AlbFetcharr-deploy).

## Requirements

- Node.js 20.19+

## Development

```bash
npm install
npm run dev          # Vite dev server on :5173 with HMR
```

The dev server proxies `/api` and `/static` to the backend. The target defaults
to `http://localhost:5000`; override it with `BACKEND_URL`:

```bash
BACKEND_URL=http://localhost:5001 npm run dev
```

Open `http://localhost:5173` — edits hot-reload.

## Production build

```bash
npm run build        # output in dist/ (base = /static/dist/)
```

The backend serves the built SPA from `static/dist/`; the build artifact is
dropped there at deploy time (the Docker/compose wiring lives outside this repo).

## Tests & lint

```bash
npm test             # Vitest (vitest run)
npm run lint         # ESLint
npm run format       # Prettier (format:check to verify only)
```

Tests cover the pure helpers (sorting, filtering, pagination, SSE parsing,
settings logic) and the translations (`src/i18n.js`), plus component tests for
the steps and settings.

## Structure

- `index.html` — Vite entry point.
- `src/main.jsx` — React entry point; imports `styles.css`.
- `src/app.jsx` — root component with the step flow.
- `src/select-step.jsx`, `src/results-step.jsx`, `src/download-step.jsx` — the three steps.
- `src/settings-step.jsx`, `src/settings-fields.jsx`, `src/settings-catalog.js`,
  `src/settings-helpers.js` — the server-backed settings screen.
- `src/session-overrides.jsx` — the per-run override panel ("This run").
- `src/wanted-helpers.js` — maps the `/api/wanted` response to UI album objects,
  formats durations, album-type labels, and derives the library list.
- `src/cover.jsx` — `<Cover>`: real artwork from `cover_url` with a vinyl-stripe
  fallback when the URL is missing or fails.
- `src/*-helpers.js` — pure per-feature helpers (covered by tests).
- `src/accent-helpers.js` — accent palette → CSS variables (chosen in the Tweaks panel).
- `src/tweaks-panel.jsx` — the appearance/Tweaks panel.
- `src/icons.jsx` — inline SVG icons.
- `src/i18n.js` — EN/RU translations plus `I18N_FNS` / `pluralRu` (interpolation, plurals).
- `src/styles.css` — CSS-variable theming (light/dark/system); responsive layout
  with 1024/640/380 breakpoints (≤640 turns the step-1 table into cards).

## Settings vs per-run overrides

The UI has two places to control parameters:

- **Settings screen** (⚙ in the header) — global, server-stored settings: enable
  or disable sources, set tokens, default download quality, paths, etc. Each field
  shows the value's origin — **Saved** (set by you), **From env**, or **Default** —
  and a reset returns it to the inherited value. Changes are saved as a batch.
  Secret fields (tokens, API keys) require `ALBFETCHARR_SECRET_KEY` in the
  environment; without it, storing secrets in the DB is blocked.
- **"This run" panel** (on the select step) — temporary, single-session overrides
  for download parameters. They don't touch saved settings and are sent only with
  the current `/api/download` request. Yandex parameters (quality, lyrics format,
  cover, …) and yt-dlp parameters (format, quality) are grouped by provider.
  "Start over" clears the overrides.

## Conventions

- Plain JavaScript + JSX (no TypeScript).
- `useState` / `useReducer` only — no state-management library.
- Absolute API paths (`/api/...`) so the dev proxy and production behave identically.
