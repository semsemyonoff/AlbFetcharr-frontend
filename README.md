# AlbFetcharr frontend

React 18 + Vite SPA для [AlbFetcharr](https://github.com/semsemyonoff/albfetcharr) —
интерфейс из трёх шагов (Select → Results → Download). Общается с бэкендом
исключительно по HTTP (`/api`, `/static`); общего кода или файловой системы с
бэкендом нет — он живёт в отдельном репозитории.

## Требования

- Node.js 20+

## Разработка

```bash
npm install
npm run dev          # Vite dev server на :5173 с HMR
```

Dev-сервер проксирует `/api` и `/static` на бэкенд. По умолчанию цель —
`http://localhost:5000`; переопределяется переменной `BACKEND_URL`:

```bash
BACKEND_URL=http://localhost:5001 npm run dev
```

Откройте `http://localhost:5173` — правки подхватываются на лету.

## Продакшен-сборка

```bash
npm run build        # вывод в dist/ (base = /static/dist/)
```

Бэкенд отдаёт собранный SPA из `static/dist/`: артефакт сборки кладётся туда на
этапе деплоя (Docker/compose-обвязка живёт вне этого репозитория).

## Тесты

```bash
npm test             # Vitest (vitest --run)
```

Покрываются чистые помощники (сортировка, фильтрация, пагинация, разбор SSE) и
переводы (`src/i18n.js`).

## Структура

- `index.html` — точка входа Vite.
- `src/main.jsx` — точка входа React, импортирует `styles.css`.
- `src/app.jsx` — корневой компонент с пошаговым flow.
- `src/select-step.jsx`, `src/results-step.jsx`, `src/download-step.jsx` — три шага.
- `src/*-helpers.js` — чистые помощники для каждого шага (покрыты тестами).
- `src/accent-helpers.js` — палитра акцента → CSS-переменные (выбор в панели Tweaks).
- `src/i18n.js` — переводы (EN/RU) + `I18N_FNS`/`pluralRu` (интерполяция и склонения).
- `src/styles.css` — стили через CSS-переменные (light/dark/system); адаптивная
  вёрстка с брейк-поинтами 1024/640/380 (на ≤640 таблица шага 1 превращается в карточки).

## Конвенции

- Чистый JavaScript + JSX (без TypeScript).
- Только `useState` / `useReducer`, без стейт-менеджеров.
- Абсолютные пути API (`/api/...`), чтобы dev-прокси и прод работали одинаково.
