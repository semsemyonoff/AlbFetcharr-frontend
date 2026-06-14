import React from "react";
import { Icon } from "./icons.jsx";
import { I18N, AGO_FNS } from "./i18n.js";
import SelectStep from "./select-step.jsx";
import { ResultsStep } from "./results-step.jsx";
import { DownloadStep } from "./download-step.jsx";
import { scoreCandidate, getBestCandidate } from "./results-helpers.js";
import { parseSSEEvent, applyProgressUpdate } from "./download-helpers.js";
import { TweaksPanel, TweakSection, TweakRadio, useTweaks } from "./tweaks-panel.jsx";

function nowHHMMSS() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
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
}) => {
  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <header className="appbar">
      <div className="brand">
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
      <div className={`app-status ${lidarrStatus === "err" ? "err" : ""}`}>
        <span className="dot"></span>
        <span>
          {lidarrStatus === "ok"
            ? t.lidarr_connected
            : lidarrStatus === "syncing"
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
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>
          EN
        </button>
        <button className={lang === "ru" ? "on" : ""} onClick={() => setLang("ru")}>
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
          name={theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "sun" : "moon"}
          size={18}
        />
      </button>
    </header>
  );
};

const Stepper = ({ step, lang }) => {
  const labels =
    lang === "ru"
      ? ["Выбор", "Результаты", "Загрузка"]
      : ["Select", "Results", "Download"];
  const order = ["select", "results", "download"];
  const idx =
    order.indexOf(
      step === "searching"
        ? "results"
        : step === "done"
          ? "download"
          : step
    );
  return (
    <div className="stepper">
      {labels.map((label, i) => (
        <React.Fragment key={i}>
          <div
            className={`stepper-item ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}`}
          >
            <span className="num">{i < idx ? "✓" : i + 1}</span>
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

function mapBackendAlbum(album, index) {
  const year = album.release_date
    ? parseInt(album.release_date.split("-")[0])
    : new Date().getFullYear();
  return {
    id: String(album.album_id),
    artist: album.artist || "Unknown Artist",
    album: album.title || "Unknown Album",
    year,
    tracks: 0,
    addedDaysAgo: album.added
      ? Math.max(0, Math.floor((Date.now() - new Date(album.added).getTime()) / 86400000))
      : 0,
    status: album.status || "missing",
    root_folder: album.root_folder,
  };
}

function resolveTheme(theme) {
  if (theme === "system") {
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return darkMode ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  document.documentElement.dataset.theme = resolved;
}

export default function App() {
  const [defaultConfig, setDefaultConfig] = React.useState(null);
  const [lang, setLang] = React.useState("en");
  const [theme, setTheme] = React.useState("system");
  const mqlCleanupRef = React.useRef(null);

  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (response.ok) {
          const config = await response.json();
          setDefaultConfig(config);

          const storedLang = localStorage.getItem("albfetcharr.lang");
          const storedTheme = localStorage.getItem("albfetcharr.theme");

          setLang(storedLang || config.default_lang || "en");
          setTheme(storedTheme || config.default_theme || "system");
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
      }
    };

    fetchConfig();
  }, []);

  React.useEffect(() => {
    if (mqlCleanupRef.current) {
      mqlCleanupRef.current();
      mqlCleanupRef.current = null;
    }

    applyTheme(theme);

    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme("system");

      if (mql.addEventListener) {
        mql.addEventListener("change", handleChange);
        mqlCleanupRef.current = () => mql.removeEventListener("change", handleChange);
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
    localStorage.setItem("albfetcharr.lang", newLang);
  };

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("albfetcharr.theme", newTheme);
  };

  const t = I18N[lang];

  // Lidarr fetch state
  const [fetchState, setFetchState] = React.useState("loading");
  const [albums, setAlbums] = React.useState([]);
  const [lastSync, setLastSync] = React.useState("");
  const [availableSources, setAvailableSources] = React.useState([]);

  const runFetch = React.useCallback(async () => {
    setFetchState("loading");
    try {
      const response = await fetch("/api/wanted");
      if (!response.ok) {
        setFetchState("error");
        return;
      }
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setFetchState("empty");
        setAlbums([]);
      } else {
        const mapped = data.map((album, idx) =>
          mapBackendAlbum(album, idx)
        );
        setAlbums(mapped);
        setFetchState("ready");
        setLastSync(lang === "ru" ? "только что" : "just now");
      }
    } catch (err) {
      console.error("Failed to fetch wanted albums:", err);
      setFetchState("error");
    }
  }, [lang]);

  const fetchSources = React.useCallback(async () => {
    try {
      const response = await fetch("/api/sources");
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAvailableSources(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    }
  }, []);

  React.useEffect(() => {
    runFetch();
    fetchSources();
  }, []);

  // Step state
  const [step, setStep] = React.useState("select");
  const [selected, setSelected] = React.useState(new Set());
  const [sources, setSources] = React.useState({});

  React.useEffect(() => {
    const initialSources = {};
    availableSources.forEach((source) => {
      initialSources[source.id] = true;
    });
    setSources(initialSources);
  }, [availableSources]);

  // Step 2 & 3 state (stubs for now)
  const [searchItems, setSearchItems] = React.useState([]);
  const [choices, setChoices] = React.useState({});
  const [downloads, setDownloads] = React.useState([]);
  const [logLines, setLogLines] = React.useState([]);

  const pushLog = (entries) => {
    const stamped = entries.map((e) => ({
      type: e.type || "info",
      text: e.text.startsWith("[") ? e.text : tstamp(e.text),
    }));
    setLogLines((prev) => [...prev, ...stamped]);
  };

  const onSearch = React.useCallback(async () => {
    const selectedAlbums = albums.filter((a) => selected.has(a.id));
    if (selectedAlbums.length === 0) return;

    setStep("searching");
    pushLog([
      {
        type: "dim",
        text: tstamp(
          `Searching ${selectedAlbums.length} album(s) in ${Object.entries(sources)
            .filter(([, v]) => v)
            .map(([k]) => availableSources.find((s) => s.id === k)?.name || k)
            .join(", ")}…`
        ),
      },
    ]);

    try {
      const payload = {
        albums: selectedAlbums.map((a) => ({
          artist: a.artist,
          title: a.album,
          album_id: parseInt(a.id, 10),
          root_folder: a.root_folder,
        })),
        sources: Object.entries(sources)
          .filter(([, v]) => v)
          .map(([k]) => k),
      };

      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const results = await response.json();

      const items = results.map((result) => {
        const album = selectedAlbums.find((a) => a.id === String(result.album_id));
        const albumObj = album || {
          artist: result.artist,
          album: result.title,
          year: 0,
          tracks: 0,
          id: String(result.album_id),
        };

        const grouped = {};
        const SOURCES = availableSources.map((s) => s.id);

        SOURCES.forEach((src) => {
          const srcResults = result.results.filter((r) => r.source === src);
          if (srcResults.length === 0) {
            const error = result.errors.find((e) => e.source === src);
            grouped[src] = error ? { message: error.message } : [];
          } else {
            grouped[src] = srcResults.map((r, idx) => {
              const matchArtists = Array.isArray(r.match_artists)
                ? r.match_artists
                : (r.match_artists || "").split(", ").filter(Boolean);
              const cand = {
                id: `${result.album_id}-${src}-${idx}`,
                source: src,
                artist: matchArtists[0] || "Unknown",
                match_artists: matchArtists,
                title: r.match_title,
                match_title: r.match_title,
                url: r.match_url,
                match_url: r.match_url,
                year: r.year,
                track_count: r.track_count,
                cover_url: r.cover_url,
              };
              return { ...cand, match: scoreCandidate({ artist: result.artist, album: result.title }, cand) };
            });
          }
        });

        return {
          album: albumObj,
          results: grouped,
          errors: [],
        };
      });

      const SOURCES = availableSources.map((s) => s.id);
      const initialChoices = {};
      items.forEach((item) => {
        const allCands = SOURCES.flatMap((s) =>
          Array.isArray(item.results[s]) ? item.results[s] : []
        );
        const best = getBestCandidate(allCands);
        if (best && best.match >= 0.5) {
          const defaultFormat = best.source === "yandex" ? "2" : null;
          initialChoices[item.album.id] = {
            candidateId: best.id,
            format: defaultFormat,
            source: best.source,
          };
        }
      });
      setChoices(initialChoices);
      setSearchItems(items);
      setStep("results");
      pushLog([
        {
          type: "info",
          text: tstamp(
            `Search complete. ${selectedAlbums.length} album(s).`
          ),
        },
      ]);
    } catch (err) {
      console.error("Search failed:", err);
      pushLog([
        {
          type: "error",
          text: tstamp(`Search failed: ${err.message}`),
        },
      ]);
      setStep("select");
    }
  }, [albums, selected, sources, availableSources]);

  const setChoice = React.useCallback((albumId, choice) => {
    setChoices((prev) => ({
      ...prev,
      [albumId]: choice,
    }));
  }, []);

  const [eventSourceRef, setEventSourceRef] = React.useState(null);
  const [toastMessage, setToastMessage] = React.useState("");

  const onDownload = React.useCallback(async () => {
    const toDownload = [];
    for (const it of searchItems) {
      const c = choices[it.album.id];
      if (!c || c === "skip") continue;
      const allCands = availableSources.map((s) => s.id).flatMap(
        (s) => (Array.isArray(it.results[s]) ? it.results[s] : [])
      );
      const cand = allCands.find((x) => x.id === c.candidateId);
      if (!cand) continue;

      toDownload.push({
        album_id: parseInt(it.album.id, 10),
        artist: cand.artist || it.album.artist,
        title: cand.title || it.album.album,
        source: cand.source,
        match_url: cand.url || cand.match_url,
        match_title: cand.title || cand.match_title,
        match_artists: cand.match_artists || [cand.artist],
        quality: c.format || null,
        root_folder: it.album.root_folder,
      });
    }

    if (toDownload.length === 0) {
      setToastMessage(
        lang === "ru"
          ? "Выберите альбомы для загрузки"
          : "Select albums to download"
      );
      return;
    }

    // Step 1: POST /api/download/stream/claim first
    let eventSource = null;
    try {
      const claimRes = await fetch("/api/download/stream/claim", {
        method: "POST",
      });

      if (!claimRes.ok && claimRes.status === 409) {
        setToastMessage(
          lang === "ru"
            ? "Загрузка уже открыта в другой вкладке — закройте её чтобы продолжить"
            : "Download is already being watched in another tab — close it to take over"
        );
        return;
      }

      if (!claimRes.ok) {
        throw new Error(`Claim failed: ${claimRes.status}`);
      }

      // Step 2: Open EventSource
      eventSource = new EventSource("/api/download/stream");
      setEventSourceRef(eventSource);

      // Find choice format for each item
      const initialDownloads = toDownload.map((item, idx) => {
        const choice = choices[item.album_id];
        return {
          album_id: item.album_id,
          artist: item.artist,
          album: item.title,
          source: item.source,
          format: choice?.format || "Default",
          item_index: idx + 1,
          item_total: toDownload.length,
          status: "starting",
          message: "",
          progress: 0,
        };
      });
      setDownloads(initialDownloads);
      pushLog([
        {
          type: "dim",
          text: tstamp(`Starting download of ${toDownload.length} album(s)…`),
        },
      ]);

      // Attach SSE handlers with one-retry logic on connection error
      let retried = false;
      const attachSSEHandlers = (es) => {
        es.addEventListener("message", (event) => {
          const parsed = parseSSEEvent(event.data);
          if (!parsed) return;

          if (parsed.type === "log") {
            pushLog([{ type: "info", text: parsed.text }]);
          } else if (parsed.type === "progress") {
            setDownloads((prev) => applyProgressUpdate(prev, parsed.payload));
          } else if (parsed.type === "done") {
            es.close();
            setEventSourceRef(null);
            setDownloads((prev) =>
              prev.map((d) => {
                if (["done", "failed"].includes(d.status)) return d;
                if (["downloaded", "importing"].includes(d.status)) {
                  return { ...d, status: "done", progress: 100 };
                }
                return {
                  ...d,
                  status: "failed",
                  message: lang === "ru" ? "Нет ответа от сервера" : "No progress received",
                  progress: 100,
                };
              })
            );
          }
        });

        es.onerror = () => {
          console.error("SSE connection error");
          es.close();
          setEventSourceRef(null);

          if (!retried) {
            retried = true;
            setToastMessage(
              lang === "ru"
                ? "Соединение потеряно — переподключение…"
                : "Connection lost — retrying…"
            );
            // Claim immediately (not after a delay) to minimise the window
            // where the old server-side generator can pop and discard events
            // before the generation counter is incremented by the takeover.
            (async () => {
              try {
                const claimRes = await fetch("/api/download/stream/claim", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ reconnect: true }),
                });
                if (!claimRes.ok) {
                  setToastMessage(
                    lang === "ru"
                      ? "Соединение потеряно"
                      : "Lost connection to backend"
                  );
                  return;
                }
                const newEs = new EventSource("/api/download/stream");
                setEventSourceRef(newEs);
                attachSSEHandlers(newEs);
                setToastMessage("");
              } catch {
                setToastMessage(
                  lang === "ru"
                    ? "Соединение потеряно"
                    : "Lost connection to backend"
                );
              }
            })();
          } else {
            setToastMessage(
              lang === "ru"
                ? "Соединение потеряно"
                : "Lost connection to backend"
            );
            setDownloads((prev) =>
              prev.map((d) =>
                ["done", "failed"].includes(d.status)
                  ? d
                  : { ...d, status: "failed", message: lang === "ru" ? "Соединение потеряно" : "Connection lost" }
              )
            );
          }
        };
      };
      attachSSEHandlers(eventSource);

      // Step 3: POST /api/download with items
      const downloadRes = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toDownload }),
      });

      if (downloadRes.status === 409) {
        eventSource.close();
        setEventSourceRef(null);
        setToastMessage(
          lang === "ru"
            ? "Загрузка уже запущена на сервере"
            : "A download is already running on the server"
        );
        setStep("results");
        return;
      }

      if (!downloadRes.ok) {
        eventSource.close();
        setEventSourceRef(null);
        throw new Error(`Download failed: ${downloadRes.status}`);
      }

      setStep("download");
    } catch (err) {
      console.error("Download error:", err);
      if (eventSource) {
        eventSource.close();
        setEventSourceRef(null);
      }
      setToastMessage(
        lang === "ru"
          ? `Ошибка: ${err.message}`
          : `Error: ${err.message}`
      );
      setStep("results");
    }
  }, [searchItems, choices, lang, availableSources]);

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
    const initialSources = {};
    availableSources.forEach((s) => { initialSources[s.id] = true; });
    setSources(initialSources);
    setStep("select");
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
            fetchState === "loading"
              ? "syncing"
              : fetchState === "error"
                ? "err"
                : "ok"
          }
          lastSync={
            fetchState === "ready"
              ? `${t.last_sync}: ${lastSync}`
              : ""
          }
        />

        <Stepper step={step} lang={lang} />

        {step === "select" && (
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
            onSearch={onSearch}
          />
        )}

        {step === "searching" && (
          <div
            className="empty-state"
            style={{ paddingTop: 80, paddingBottom: 80 }}
          >
            <div className="ico">
              <div className="spinner lg"></div>
            </div>
            <h3>{lang === "ru" ? "Идёт поиск…" : "Searching…"}</h3>
            <p>
              {lang === "ru"
                ? `Опрашиваем ${Object.values(sources).filter(Boolean).length} источник(ов) по ${selected.size} альбому(ам).`
                : `Querying ${Object.values(sources).filter(Boolean).length} source(s) for ${selected.size} album(s).`}
            </p>
          </div>
        )}

        {step === "results" && (
          <ResultsStep
            t={t}
            lang={lang}
            items={searchItems}
            choices={choices}
            setChoice={setChoice}
            onBack={() => setStep("select")}
            onDownload={onDownload}
            sources={availableSources.map((s) => s.id)}
          />
        )}

        {step === "download" && (
          <DownloadStep
            t={t}
            lang={lang}
            downloads={downloads}
            logLines={logLines}
            allDone={downloads.length > 0 && downloads.every((d) => d.status === "done" || d.status === "failed")}
            anyFailed={downloads.some((d) => d.status === "failed")}
            importEnabled={defaultConfig?.import_enabled ?? true}
            onStartOver={onStartOver}
            onLogCopy={() => navigator.clipboard?.writeText(logLines.map((l) => l.text).join("\n"))}
            onLogClear={() => setLogLines([])}
          />
        )}
      </div>

      {toastMessage && (
        <div className="toast" role="alert" onClick={() => setToastMessage("")}>
          {toastMessage}
        </div>
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label={t.theme} />
        <TweakRadio
          label={t.theme}
          value={theme}
          options={["system", "light", "dark"]}
          onChange={handleSetTheme}
        />
        <TweakSection label={t.language} />
        <TweakRadio
          label={t.language}
          value={lang}
          options={["en", "ru"]}
          onChange={handleSetLang}
        />
      </TweaksPanel>
    </>
  );
}
