import React from 'react';
import { Icon } from './icons.jsx';
import { I18N, I18N_FNS } from './i18n.js';
import SelectStep from './select-step.jsx';
import { ResultsStep } from './results-step.jsx';
import { DownloadStep } from './download-step.jsx';
import {
  buildSourceCandidates,
  getBestCandidate,
  buildDownloadItems,
} from './results-helpers.js';
import { parseSSEEvent, applyProgressUpdate } from './download-helpers.js';
import {
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakColor,
} from './tweaks-panel.jsx';
import {
  ACCENT_PALETTES,
  DEFAULT_ACCENT,
  applyAccent,
  parseAccent,
} from './accent-helpers.js';
import { SettingsScreen } from './settings-step.jsx';
import { ThisRunPanel } from './session-overrides.jsx';
import {
  indexSettings,
  buildOverridesPayload,
  typeError,
  isPassthroughYtdlp,
} from './settings-helpers.js';
import { SESSION_FIELDS } from './settings-catalog.js';
import { mapWantedAlbum, deriveLibraries } from './wanted-helpers.js';

const VersionFooter = ({ versions }) => {
  if (!versions) return null;
  return (
    <footer className="app-versions">
      <span className="ver-item ver-app">
        <span className="ver-label">AlbFetcharr</span>
        <span className="ver-num">v{versions.service}</span>
      </span>
      <span className="ver-sep">·</span>
      <span className="ver-item ver-ytdlp">
        <span className="ver-label">yt-dlp</span>
        <span className="ver-num">{versions.ytdlp}</span>
      </span>
      <span className="ver-sep">·</span>
      <span className="ver-item ver-ymd">
        <span className="ver-label">ymd</span>
        <span className="ver-num">v{versions.ymd}</span>
      </span>
    </footer>
  );
};

function nowHHMMSS() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
const tstamp = (txt) => `[${nowHHMMSS()}] ${txt}`;

const Header = ({
  t,
  lang,
  setLang,
  theme,
  setTheme,
  lidarrStatus,
  lastSync,
  inSettings,
  onSettingsToggle,
  onHome,
}) => {
  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <header className="appbar">
      <div
        className="brand"
        role="button"
        tabIndex={0}
        aria-label={t.go_home}
        title={t.go_home}
        onClick={onHome}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onHome();
          }
        }}
      >
        <div className="brand-logo" aria-hidden="true"></div>
        <div>
          <h1 className="brand-name">
            <span className="lf-prefix">Alb</span>
            <span className="lf-suffix">Fetcharr</span>
          </h1>
          <span className="brand-sub">{t.tagline}</span>
        </div>
      </div>
      <div className="appbar-spacer"></div>
      <div className={`app-status ${lidarrStatus === 'err' ? 'err' : ''}`}>
        <span className="dot"></span>
        <span>
          {lidarrStatus === 'ok'
            ? t.lidarr_connected
            : lidarrStatus === 'syncing'
              ? t.lidarr_syncing
              : t.lidarr_error}
        </span>
        {lastSync && (
          <>
            <span className="sep">·</span>
            <span className="last-sync">{lastSync}</span>
          </>
        )}
      </div>
      <div className="lang-toggle" role="group" aria-label="Language">
        <button
          className={lang === 'en' ? 'on' : ''}
          onClick={() => setLang('en')}
        >
          EN
        </button>
        <button
          className={lang === 'ru' ? 'on' : ''}
          onClick={() => setLang('ru')}
        >
          RU
        </button>
      </div>
      <button
        className="icon-btn"
        onClick={cycleTheme}
        aria-label={t.theme}
        title={t.theme}
      >
        <Icon
          name={
            theme === 'system' ? 'monitor' : theme === 'dark' ? 'sun' : 'moon'
          }
          size={18}
        />
      </button>
      <button
        className={`icon-btn${inSettings ? ' on' : ''}`}
        onClick={onSettingsToggle}
        aria-label={t.settings}
        title={t.settings}
      >
        <Icon name="cog" size={18} />
      </button>
    </header>
  );
};

const Stepper = ({ step, lang }) => {
  const t = I18N[lang];
  const labels = [t.step_select, t.step_results, t.step_download];
  const order = ['select', 'results', 'download'];
  const idx = order.indexOf(
    step === 'searching' ? 'results' : step === 'done' ? 'download' : step
  );
  return (
    <div className="stepper">
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div
            className={`stepper-item ${i < idx ? 'done' : ''} ${i === idx ? 'current' : ''}`}
          >
            <span className="num">{i < idx ? '✓' : i + 1}</span>
            <span>{label}</span>
          </div>
          {i < labels.length - 1 && (
            <Icon name="chevronRight" size={12} className="stepper-arrow" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

function resolveTheme(theme) {
  if (theme === 'system') {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return darkMode ? 'dark' : 'light';
  }
  return theme;
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
}

export default function App() {
  const [defaultConfig, setDefaultConfig] = React.useState(null);
  const [lang, setLang] = React.useState('en');
  const [theme, setTheme] = React.useState('system');
  const [accent, setAccent] = React.useState(DEFAULT_ACCENT);
  const mqlCleanupRef = React.useRef(null);
  const searchAbortRef = React.useRef(null);

  // Settings state
  const [encryptionReady, setEncryptionReady] = React.useState(false);
  const [committedSettings, setCommittedSettings] = React.useState({});
  const [view, setView] = React.useState('app');
  const [runOverrides, setRunOverrides] = React.useState({});

  // Version footer state
  const [versions, setVersions] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/version')
      .then((res) => {
        if (!res.ok) return;
        return res.json();
      })
      .then((data) => {
        if (
          data &&
          typeof data.albfetcharr === 'string' &&
          data.albfetcharr &&
          typeof data.yt_dlp === 'string' &&
          data.yt_dlp &&
          typeof data.ymd === 'string' &&
          data.ymd
        ) {
          setVersions({
            service: data.albfetcharr,
            ytdlp: data.yt_dlp,
            ymd: data.ymd,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Lidarr fetch state
  const [fetchState, setFetchState] = React.useState('loading');
  const [albums, setAlbums] = React.useState([]);
  // Whether a wanted-list sync has completed. Kept as a flag (not a pre-built
  // string) so the "last sync" label re-translates when the language changes.
  const [hasSynced, setHasSynced] = React.useState(false);
  const [availableSources, setAvailableSources] = React.useState([]);

  const runFetch = React.useCallback(async () => {
    setFetchState('loading');
    try {
      const response = await fetch('/api/wanted');
      if (!response.ok) {
        setFetchState('error');
        return;
      }
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setFetchState('empty');
        setAlbums([]);
      } else {
        const mapped = data.map((album) => mapWantedAlbum(album));
        setAlbums(mapped);
        setFetchState('ready');
        setHasSynced(true);
      }
    } catch (err) {
      console.error('Failed to fetch wanted albums:', err);
      setFetchState('error');
    }
  }, []);

  const fetchSources = React.useCallback(async () => {
    try {
      const response = await fetch('/api/sources');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAvailableSources(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    }
  }, []);

  const reloadSettings = React.useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const items = await res.json();
        setCommittedSettings(indexSettings(items));
      }
    } catch (err) {
      console.error('Failed to reload settings:', err);
    }
  }, []);

  const handleSettingsSave = React.useCallback(
    async (puts, deletes) => {
      if (Object.keys(puts).length > 0) {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(puts),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.detail || `HTTP ${res.status}`);
        }
      }
      for (const key of deletes) {
        const res = await fetch(`/api/settings/${key}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.detail || `HTTP ${res.status}`);
        }
      }
      // Refresh committed settings and the provider list together: provider
      // enable/disable toggles live in settings, so the main page must reflect
      // them without a full page reload. Both calls swallow their own errors.
      await Promise.all([reloadSettings(), fetchSources()]);
    },
    [reloadSettings, fetchSources]
  );

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setDefaultConfig(config);
          setEncryptionReady(config.encryption_enabled ?? false);

          const storedLang = localStorage.getItem('albfetcharr.lang');
          const storedTheme = localStorage.getItem('albfetcharr.theme');
          const storedAccent = localStorage.getItem('albfetcharr.accent');

          setLang(storedLang || config.default_lang || 'en');
          setTheme(storedTheme || config.default_theme || 'system');

          const resolvedAccent = parseAccent(storedAccent);
          setAccent(resolvedAccent);
          applyAccent(resolvedAccent);
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
      }
    };

    fetchConfig();
    reloadSettings();
  }, [reloadSettings]);

  React.useEffect(() => {
    if (mqlCleanupRef.current) {
      mqlCleanupRef.current();
      mqlCleanupRef.current = null;
    }

    applyTheme(theme);

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');

      if (mql.addEventListener) {
        mql.addEventListener('change', handleChange);
        mqlCleanupRef.current = () =>
          mql.removeEventListener('change', handleChange);
      } else if (mql.addListener) {
        mql.addListener(handleChange);
        mqlCleanupRef.current = () => mql.removeListener(handleChange);
      }
    }

    return () => {
      if (mqlCleanupRef.current) {
        mqlCleanupRef.current();
        mqlCleanupRef.current = null;
      }
    };
  }, [theme]);

  const handleSetLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('albfetcharr.lang', newLang);
  };

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('albfetcharr.theme', newTheme);
  };

  const handleSetAccent = (newAccent) => {
    setAccent(newAccent);
    applyAccent(newAccent);
    localStorage.setItem('albfetcharr.accent', JSON.stringify(newAccent));
  };

  const t = I18N[lang];

  React.useEffect(() => {
    runFetch();
    fetchSources();
  }, [runFetch, fetchSources]);

  // Step state
  const [step, setStep] = React.useState('select');
  const [selected, setSelected] = React.useState(new Set());
  const [sources, setSources] = React.useState({});

  React.useEffect(() => {
    // One-time enable-all once the source list arrives from /api/sources. The
    // user's later toggles survive because availableSources is then stable.
    const initialSources = {};
    availableSources.forEach((source) => {
      initialSources[source.id] = true;
    });
    setSources(initialSources);
  }, [availableSources]);

  // Step 2 & 3 state (stubs for now)
  const [searchItems, setSearchItems] = React.useState([]);
  const [searchedSources, setSearchedSources] = React.useState([]);
  const [choices, setChoices] = React.useState({});
  const [downloads, setDownloads] = React.useState([]);
  const [logLines, setLogLines] = React.useState([]);

  const pushLog = (entries) => {
    const stamped = entries.map((e) => ({
      type: e.type || 'info',
      text: e.text.startsWith('[') ? e.text : tstamp(e.text),
    }));
    setLogLines((prev) => [...prev, ...stamped]);
  };

  const onSearch = React.useCallback(async () => {
    const selectedAlbums = albums.filter((a) => selected.has(a.id));
    if (selectedAlbums.length === 0) return;

    const enabledSourceIds = Object.entries(sources)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (enabledSourceIds.length === 0) return;

    setStep('searching');
    pushLog([
      {
        type: 'dim',
        text: tstamp(
          `Searching ${selectedAlbums.length} album(s) in ${enabledSourceIds
            .map((k) => availableSources.find((s) => s.id === k)?.name || k)
            .join(', ')}…`
        ),
      },
    ]);

    const albumPayloads = selectedAlbums.map((a) => ({
      artist: a.artist,
      title: a.album,
      album_id: parseInt(a.id, 10),
      root_folder: a.root_folder,
    }));

    // Initialize all sources in loading state
    const initialItems = selectedAlbums.map((album) => ({
      album,
      results: Object.fromEntries(
        enabledSourceIds.map((s) => [s, { loading: true }])
      ),
      errors: [],
    }));
    setSearchItems(initialItems);
    setChoices({});
    setSearchedSources(enabledSourceIds);

    // Cancel any prior in-flight search so its callbacks don't corrupt new state.
    searchAbortRef.current?.abort();
    const abortController = new AbortController();
    searchAbortRef.current = abortController;
    const { signal } = abortController;

    let firstResultReceived = false;

    const fetchForSource = async (srcId) => {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            albums: albumPayloads,
            sources: [srcId],
          }),
          signal,
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const results = await response.json();

        setSearchItems((prev) => {
          const updated = prev.map((item) => {
            const result = results.find(
              (r) => String(r.album_id) === item.album.id
            );
            if (!result) return item;

            const srcResults = result.results.filter((r) => r.source === srcId);
            const srcError = result.errors.find((e) => e.source === srcId);
            const albumRef = { artist: result.artist, album: result.title };

            let sourceValue;
            if (srcResults.length > 0) {
              sourceValue = buildSourceCandidates(
                srcResults,
                srcId,
                result.album_id,
                albumRef
              );
            } else if (srcError) {
              sourceValue = { message: srcError.message };
            } else {
              sourceValue = [];
            }

            return {
              ...item,
              results: { ...item.results, [srcId]: sourceValue },
            };
          });
          return updated;
        });

        // Auto-select best candidates as each source arrives.
        // Only set a choice if the album doesn't already have one.
        setChoices((prev) => {
          const next = { ...prev };
          results.forEach((result) => {
            const albumId = String(result.album_id);
            if (next[albumId]) return; // already chosen

            const srcResults = result.results.filter((r) => r.source === srcId);
            if (srcResults.length === 0) return;

            const cands = buildSourceCandidates(
              srcResults,
              srcId,
              result.album_id,
              { artist: result.artist, album: result.title }
            );
            const best = getBestCandidate(cands);
            if (best && best.match >= 0.5) {
              next[albumId] = {
                candidateId: best.id,
                format: null,
                source: best.source,
              };
            }
          });
          return next;
        });

        if (!firstResultReceived) {
          firstResultReceived = true;
          setStep('results');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error(`Search failed for source ${srcId}:`, err);
        setSearchItems((prev) =>
          prev.map((item) => ({
            ...item,
            results: {
              ...item.results,
              [srcId]: { message: err.message },
            },
          }))
        );
        pushLog([
          {
            type: 'error',
            text: tstamp(`Search failed (${srcId}): ${err.message}`),
          },
        ]);
      }
    };

    await Promise.allSettled(
      enabledSourceIds.map((srcId) => fetchForSource(srcId))
    );

    if (!firstResultReceived) {
      pushLog([
        {
          type: 'error',
          text: tstamp('Search failed: all sources returned errors'),
        },
      ]);
      // Stay on results so per-source error messages are visible.
      setStep('results');
    } else {
      pushLog([
        {
          type: 'info',
          text: tstamp(`Search complete. ${selectedAlbums.length} album(s).`),
        },
      ]);
    }
  }, [albums, selected, sources, availableSources]);

  const setChoice = React.useCallback((albumId, choice) => {
    setChoices((prev) => ({
      ...prev,
      [albumId]: choice,
    }));
  }, []);

  const [eventSourceRef, setEventSourceRef] = React.useState(null);
  const [toastMessage, setToastMessage] = React.useState('');

  const onDownload = React.useCallback(async () => {
    const toDownload = buildDownloadItems(
      searchItems,
      choices,
      availableSources.map((s) => s.id)
    );

    if (toDownload.length === 0) {
      setToastMessage(I18N[lang].select_to_download);
      return;
    }

    // Block the download if any "This run" override is invalid — otherwise the
    // bad value would be sent and rejected by the backend with a 422.
    // ytdlp_quality is inactive (and its field hidden in the panel) when the
    // effective format is passthrough ("best"), so skip it to match what the
    // user can see.
    const effectiveFormat =
      runOverrides.ytdlp_format ?? committedSettings.ytdlp_format?.value;
    const qualityInactive = isPassthroughYtdlp(effectiveFormat);
    const sessionInvalid = SESSION_FIELDS.some((f) => {
      if (f.key === 'ytdlp_quality' && qualityInactive) return false;
      const item = committedSettings[f.key];
      const val = runOverrides[f.key];
      if (!item || val === undefined) return false;
      return !!typeError(item.type, val, {
        min: f.min,
        max: f.max,
        choices: (f.choices || []).map((c) => c.value),
      });
    });
    if (sessionInvalid) {
      setToastMessage(I18N[lang].fix_session_settings);
      return;
    }

    // Step 1: POST /api/download/stream/claim first
    let eventSource = null;
    try {
      const claimRes = await fetch('/api/download/stream/claim', {
        method: 'POST',
      });

      if (!claimRes.ok && claimRes.status === 409) {
        setToastMessage(I18N[lang].download_other_tab);
        return;
      }

      if (!claimRes.ok) {
        throw new Error(`Claim failed: ${claimRes.status}`);
      }

      // Step 2: Open EventSource
      eventSource = new EventSource('/api/download/stream');
      setEventSourceRef(eventSource);

      // Find choice format for each item
      const initialDownloads = toDownload.map((item, idx) => {
        const choice = choices[item.album_id];
        return {
          album_id: item.album_id,
          artist: item.artist,
          album: item.title,
          source: item.source,
          format: choice?.format || 'Default',
          item_index: idx + 1,
          item_total: toDownload.length,
          status: 'starting',
          message: '',
          progress: 0,
        };
      });
      setDownloads(initialDownloads);
      pushLog([
        {
          type: 'dim',
          text: tstamp(`Starting download of ${toDownload.length} album(s)…`),
        },
      ]);

      // Attach SSE handlers with one-retry logic on connection error
      let retried = false;
      const attachSSEHandlers = (es) => {
        es.addEventListener('message', (event) => {
          const parsed = parseSSEEvent(event.data);
          if (!parsed) return;

          if (parsed.type === 'log') {
            pushLog([{ type: 'info', text: parsed.text }]);
          } else if (parsed.type === 'progress') {
            setDownloads((prev) => applyProgressUpdate(prev, parsed.payload));
          } else if (parsed.type === 'done') {
            es.close();
            setEventSourceRef(null);
            setDownloads((prev) =>
              prev.map((d) => {
                if (['done', 'failed'].includes(d.status)) return d;
                if (['downloaded', 'importing'].includes(d.status)) {
                  return { ...d, status: 'done', progress: 100 };
                }
                return {
                  ...d,
                  status: 'failed',
                  message: I18N[lang].no_progress_received,
                  progress: 100,
                };
              })
            );
          }
        });

        es.onerror = () => {
          console.error('SSE connection error');
          es.close();
          setEventSourceRef(null);

          if (!retried) {
            retried = true;
            setToastMessage(I18N[lang].connection_retrying);
            // Claim immediately (not after a delay) to minimise the window
            // where the old server-side generator can pop and discard events
            // before the generation counter is incremented by the takeover.
            (async () => {
              try {
                const claimRes = await fetch('/api/download/stream/claim', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reconnect: true }),
                });
                if (!claimRes.ok) {
                  setToastMessage(I18N[lang].connection_lost_backend);
                  return;
                }
                const newEs = new EventSource('/api/download/stream');
                setEventSourceRef(newEs);
                attachSSEHandlers(newEs);
                setToastMessage('');
              } catch {
                setToastMessage(I18N[lang].connection_lost_backend);
              }
            })();
          } else {
            setToastMessage(I18N[lang].connection_lost_backend);
            setDownloads((prev) =>
              prev.map((d) =>
                ['done', 'failed'].includes(d.status)
                  ? d
                  : {
                      ...d,
                      status: 'failed',
                      message: I18N[lang].connection_lost,
                    }
              )
            );
          }
        };
      };
      attachSSEHandlers(eventSource);

      // Step 3: POST /api/download with items (+ session overrides if set)
      const sessionOverrides = buildOverridesPayload(
        committedSettings,
        runOverrides
      );
      const downloadBody = { items: toDownload };
      if (Object.keys(sessionOverrides).length > 0) {
        downloadBody.overrides = sessionOverrides;
      }
      const downloadRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadBody),
      });

      if (downloadRes.status === 409) {
        eventSource.close();
        setEventSourceRef(null);
        setToastMessage(I18N[lang].download_running_server);
        setStep('results');
        return;
      }

      if (!downloadRes.ok) {
        eventSource.close();
        setEventSourceRef(null);
        throw new Error(`Download failed: ${downloadRes.status}`);
      }

      setStep('download');
    } catch (err) {
      console.error('Download error:', err);
      if (eventSource) {
        eventSource.close();
        setEventSourceRef(null);
      }
      setToastMessage(`${I18N[lang].error_prefix}: ${err.message}`);
      setStep('results');
    }
  }, [
    searchItems,
    choices,
    lang,
    availableSources,
    committedSettings,
    runOverrides,
  ]);

  React.useEffect(() => {
    return () => {
      if (eventSourceRef) {
        eventSourceRef.close();
      }
    };
  }, [eventSourceRef]);

  const onStartOver = () => {
    if (eventSourceRef) {
      eventSourceRef.close();
      setEventSourceRef(null);
    }
    setSelected(new Set());
    setSearchItems([]);
    setChoices({});
    setDownloads([]);
    setLogLines([]);
    setRunOverrides({});
    const initialSources = {};
    availableSources.forEach((s) => {
      initialSources[s.id] = true;
    });
    setSources(initialSources);
    setStep('select');
    runFetch();
  };

  return (
    <>
      <div className="app-v2">
        <Header
          t={t}
          lang={lang}
          setLang={handleSetLang}
          theme={theme}
          setTheme={handleSetTheme}
          lidarrStatus={
            fetchState === 'loading'
              ? 'syncing'
              : fetchState === 'error'
                ? 'err'
                : 'ok'
          }
          lastSync={
            fetchState === 'ready' && hasSynced
              ? `${t.last_sync}: ${t.just_now}`
              : ''
          }
          inSettings={view === 'settings'}
          onSettingsToggle={() =>
            setView((v) => (v === 'settings' ? 'app' : 'settings'))
          }
          onHome={() => setView('app')}
        />

        {view === 'settings' && (
          <SettingsScreen
            t={t}
            lang={lang}
            committed={committedSettings}
            encryptionReady={encryptionReady}
            onSave={handleSettingsSave}
            onBack={() => setView('app')}
          />
        )}

        {view === 'app' && (
          <>
            <Stepper step={step} lang={lang} />

            {step === 'select' && (
              <>
                <ThisRunPanel
                  t={t}
                  committed={committedSettings}
                  overrides={runOverrides}
                  setOverrides={setRunOverrides}
                />
                <SelectStep
                  t={t}
                  lang={lang}
                  fetchState={fetchState}
                  onRefetch={runFetch}
                  albums={albums}
                  selected={selected}
                  setSelected={setSelected}
                  sources={sources}
                  setSources={setSources}
                  availableSources={availableSources}
                  availableLibraries={deriveLibraries(albums)}
                  onSearch={onSearch}
                />
              </>
            )}

            {step === 'searching' && (
              <div
                className="empty-state"
                style={{ paddingTop: 80, paddingBottom: 80 }}
              >
                <div className="ico">
                  <div className="spinner lg"></div>
                </div>
                <h3>{t.searching_title}</h3>
                <p>
                  {I18N_FNS.searchingSubtitle(
                    lang,
                    Object.values(sources).filter(Boolean).length,
                    selected.size
                  )}
                </p>
              </div>
            )}

            {step === 'results' && (
              <ResultsStep
                t={t}
                lang={lang}
                items={searchItems}
                choices={choices}
                setChoice={setChoice}
                onBack={() => setStep('select')}
                onDownload={onDownload}
                sources={searchedSources}
              />
            )}

            {step === 'download' && (
              <DownloadStep
                t={t}
                lang={lang}
                downloads={downloads}
                logLines={logLines}
                allDone={
                  downloads.length > 0 &&
                  downloads.every(
                    (d) => d.status === 'done' || d.status === 'failed'
                  )
                }
                anyFailed={downloads.some((d) => d.status === 'failed')}
                importEnabled={defaultConfig?.import_enabled ?? true}
                onStartOver={onStartOver}
                onLogCopy={() =>
                  navigator.clipboard?.writeText(
                    logLines.map((l) => l.text).join('\n')
                  )
                }
                onLogClear={() => setLogLines([])}
              />
            )}
          </>
        )}
        <VersionFooter versions={versions} />
      </div>

      {toastMessage && (
        <div className="toast" role="alert" onClick={() => setToastMessage('')}>
          {toastMessage}
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label={t.theme} />
        <TweakRadio
          label={t.theme}
          value={theme}
          options={['system', 'light', 'dark']}
          onChange={handleSetTheme}
        />
        <TweakSection label={t.language} />
        <TweakRadio
          label={t.language}
          value={lang}
          options={['en', 'ru']}
          onChange={handleSetLang}
        />
        <TweakSection label={t.accent} />
        <TweakColor
          label={t.gradient}
          value={accent}
          options={ACCENT_PALETTES}
          onChange={handleSetAccent}
        />
      </TweaksPanel>
    </>
  );
}
