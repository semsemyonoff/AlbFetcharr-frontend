import React from 'react';
import { Icon } from './icons';
import { I18N_FNS } from './i18n.js';

const DEFAULT_SOURCES = ['yandex', 'youtube_music', 'soundcloud'];

function getFormatLabel(t, source, format) {
  if (source === 'yandex') {
    const formatMap = {
      0: t.format_lossy_low,
      1: t.format_lossy_high,
      2: t.format_flac,
    };
    return formatMap[format] || format;
  }
  return t.format_default_ytdlp;
}

function getFormatOptions(t, source) {
  if (source === 'yandex') {
    return [
      { value: '0', label: t.format_lossy_low },
      { value: '1', label: t.format_lossy_high },
      { value: '2', label: t.format_flac },
    ];
  }
  return [{ value: null, label: t.format_default_ytdlp }];
}

function AlbumCard({
  item,
  choices,
  t,
  setChosen,
  setSkip,
  setActive,
  sources,
  resolvedYandexQuality,
}) {
  const a = item.album;
  const choice = choices[a.id];
  const isSkipped = choice === 'skip';
  const chosenId = choice && choice !== 'skip' ? choice.candidateId : null;

  const [tab, setTab] = React.useState(() => {
    for (const s of sources) {
      const r = item.results[s];
      if (Array.isArray(r) && r.length > 0) return s;
    }
    return sources[0] ?? DEFAULT_SOURCES[0];
  });

  const tabs = sources.map((s) => {
    const r = item.results[s];
    return {
      key: s,
      label: t[s],
      count: Array.isArray(r) ? r.length : '!',
      err: !Array.isArray(r),
    };
  });

  const currentResult = item.results[tab];
  const isErr = !Array.isArray(currentResult);
  const candidates = isErr ? [] : currentResult;

  let pillNode;
  if (isSkipped) {
    pillNode = <span className="chosen-pill skip">{t.skipped}</span>;
  } else if (chosenId) {
    const allCands = sources.flatMap((s) =>
      Array.isArray(item.results[s]) ? item.results[s] : []
    );
    const chosen = allCands.find((c) => c.id === chosenId);
    if (chosen) {
      const matchPct = Math.round(chosen.match * 100);
      const cls = matchPct < 70 ? 'warn' : '';
      pillNode = (
        <span className={`chosen-pill ${cls}`}>
          <Icon name="check" size={11} /> {t[chosen.source]} · {matchPct}%
        </span>
      );
    }
  } else {
    const hasAny = sources.some(
      (s) => Array.isArray(item.results[s]) && item.results[s].length > 0
    );
    if (!hasAny) {
      pillNode = <span className="chosen-pill err">{t.no_matches}</span>;
    } else {
      pillNode = (
        <span
          className="chosen-pill warn"
          style={{
            background: 'var(--surface-hover)',
            color: 'var(--text-mute)',
          }}
        >
          {t.pick_one}
        </span>
      );
    }
  }

  return (
    <div className={`result-album ${isSkipped ? 'skipped' : ''}`}>
      <div className="ra-head">
        <div className="cover lg">
          <div className="vinyl-stripes"></div>
          <span style={{ position: 'relative' }}>{a.artist.slice(0, 2)}</span>
        </div>
        <div className="meta">
          <div className="artist">{a.artist}</div>
          <div className="album">{a.album}</div>
          <div className="yt">
            {a.year}
            {a.tracks > 0 && ` · ${a.tracks} ${t.track_count}`}
          </div>
        </div>
        <div className="right">
          {pillNode}
          <button
            className={`skip-btn ${isSkipped ? 'skipped' : ''}`}
            onClick={() => {
              if (isSkipped) setActive(a.id, 'skip');
              else setSkip(a.id);
            }}
          >
            {isSkipped ? t.restore : t.skip}
          </button>
        </div>
      </div>
      {!isSkipped && (
        <div className="ra-body">
          <div className="ra-tabs">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                className={`src-tab ${tab === tb.key ? 'on' : ''} ${tb.err ? 'err' : ''}`}
                data-src={tb.key}
                onClick={() => setTab(tb.key)}
              >
                <span className="src-dot"></span>
                <span>{tb.label}</span>
                <span className="badge-count">{tb.count}</span>
              </button>
            ))}
          </div>

          {isErr && (
            <div className="candidate-err">
              <Icon name="alert" size={16} />
              <span>
                <strong>{t[tab]}:</strong> {currentResult.message}
              </span>
            </div>
          )}

          {!isErr && candidates.length === 0 && (
            <div className="candidate-empty">{t.no_candidates}</div>
          )}

          {!isErr &&
            candidates.map((c) => {
              const isChosen = chosenId === c.id;
              const matchPct = Math.round(c.match * 100);
              // Display the resolved yandex_quality (from setting/override) when
              // no explicit per-album pick; never seed choice.format on selection.
              const fmt =
                isChosen && choice.format != null
                  ? choice.format
                  : c.source === 'yandex'
                    ? resolvedYandexQuality
                    : null;
              const formatOptions = getFormatOptions(t, c.source);
              const showFormatSelect = formatOptions.length > 1;

              return (
                <label
                  key={c.id}
                  className={`cand-radio ${isChosen ? 'chosen' : ''}`}
                >
                  <input
                    type="radio"
                    className="rd"
                    name={`cand-${a.id}`}
                    checked={isChosen}
                    onChange={() => setChosen(a.id, c, null)}
                  />
                  <div className="cover">
                    <div className="vinyl-stripes"></div>
                    <span style={{ position: 'relative' }}>
                      {c.match_artists && c.match_artists.length > 0
                        ? c.match_artists[0].slice(0, 2)
                        : '?'}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="title">
                      {(c.match_artists || []).join(', ')} — {c.match_title}
                    </div>
                    <div className="meta">
                      {c.year} · {c.track_count} {t.track_count} ·{' '}
                      <a
                        className="url"
                        href={c.match_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.match_url}
                      </a>
                    </div>
                  </div>
                  <div className={`match ${matchPct < 70 ? 'low' : ''}`}>
                    {matchPct}%
                  </div>
                  {showFormatSelect ? (
                    <select
                      className="fmt-select"
                      value={fmt || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        setChosen(a.id, c, e.target.value || null);
                      }}
                    >
                      {formatOptions.map((f) => (
                        <option
                          key={f.value || 'default'}
                          value={f.value || ''}
                        >
                          {f.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      className="fmt-select"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                    >
                      {getFormatLabel(t, c.source, fmt)}
                    </div>
                  )}
                </label>
              );
            })}
        </div>
      )}
    </div>
  );
}

export const ResultsStep = ({
  t,
  lang,
  items,
  choices,
  setChoice,
  onBack,
  onDownload,
  sources = DEFAULT_SOURCES,
  resolvedYandexQuality = '2',
}) => {
  const setChosen = (albumId, candidate, format) => {
    setChoice(albumId, {
      candidateId: candidate.id,
      format,
      source: candidate.source,
    });
  };

  const setSkip = (albumId) => {
    setChoice(albumId, 'skip');
  };

  const setActive = (albumId, choice) => {
    if (choice !== 'skip') setChoice(albumId, choice);
    else setChoice(albumId, undefined);
  };

  const downloadable = items.filter((it) => {
    const c = choices[it.album.id];
    return c && c !== 'skip';
  });

  const totalSearched = items.length;
  const errorsCount = items.reduce((acc, it) => {
    let e = 0;
    for (const s of sources) {
      if (!Array.isArray(it.results[s])) e++;
    }
    return acc + e;
  }, 0);

  return (
    <>
      <button className="back-link" onClick={onBack}>
        <Icon name="chevronLeft" size={14} />
        {t.back_to_selection}
      </button>
      <div className="step-header">
        <div>
          <h2>{t.pick_best_matches}</h2>
          <div className="sub">
            {I18N_FNS.resultsSubtitle(lang, totalSearched, errorsCount)}
          </div>
        </div>
      </div>

      <div className="result-list">
        {items.map((item) => (
          <AlbumCard
            key={item.album.id}
            item={item}
            choices={choices}
            t={t}
            setChosen={setChosen}
            setSkip={setSkip}
            setActive={setActive}
            sources={sources}
            resolvedYandexQuality={resolvedYandexQuality}
          />
        ))}
      </div>

      <div className="action-bar">
        <span className="counter">
          <b>{downloadable.length}</b> {t.ready_to_download}
          {items.length - downloadable.length > 0 && (
            <span style={{ color: 'var(--text-mute)', marginLeft: 8 }}>
              · {items.length - downloadable.length} {t.skipped_or_unset}
            </span>
          )}
        </span>
        <div className="grow"></div>
        <button className="btn btn-ghost" onClick={onBack}>
          {t.cancel}
        </button>
        <button
          className="btn btn-primary"
          disabled={downloadable.length === 0}
          onClick={onDownload}
        >
          <Icon name="download" size={14} />
          {t.download_selected}
          {downloadable.length > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                background: 'rgba(7,16,30,.12)',
                padding: '1px 7px',
                borderRadius: 999,
                fontSize: 11,
                marginLeft: 2,
              }}
            >
              {downloadable.length}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
