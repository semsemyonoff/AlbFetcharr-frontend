import React from 'react';
import { Icon } from './icons';
import { I18N_FNS } from './i18n.js';
import { Cover } from './cover.jsx';
import { formatDuration, albumTypeLabel } from './wanted-helpers.js';
import { isSourceLoading } from './results-helpers.js';

const DEFAULT_SOURCES = ['yandex', 'youtube_music', 'soundcloud'];

function AlbumCard({
  item,
  choices,
  t,
  lang,
  setChosen,
  setSkip,
  setActive,
  sources,
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

  // Auto-switch to first source that gets results during parallel loading
  React.useEffect(() => {
    const currentR = item.results[tab];
    if (!isSourceLoading(currentR)) return; // tab already resolved
    for (const s of sources) {
      const r = item.results[s];
      if (Array.isArray(r) && r.length > 0) {
        setTab(s);
        return;
      }
    }
  }, [item.results, tab, sources]);

  const tabs = sources.map((s) => {
    const r = item.results[s];
    const loading = isSourceLoading(r);
    return {
      key: s,
      label: t[s],
      count: loading ? null : Array.isArray(r) ? r.length : '!',
      err: !loading && !Array.isArray(r),
      loading,
    };
  });

  const currentResult = item.results[tab];
  const isLoading = isSourceLoading(currentResult);
  const isErr = !isLoading && !Array.isArray(currentResult);
  const candidates = isErr || isLoading ? [] : currentResult;

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
    const allResolved = sources.every(
      (s) => !isSourceLoading(item.results[s])
    );
    if (!hasAny && allResolved) {
      pillNode = <span className="chosen-pill err">{t.no_matches}</span>;
    } else if (!hasAny) {
      pillNode = null;
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

  const albumType = a.albumType ?? '';
  const library = a.library ?? '';

  const ytParts = [];
  if (albumType)
    ytParts.push(
      <span key="type" className={`type-tag t-${albumType.toLowerCase()}`}>
        {albumTypeLabel(albumType, lang)}
      </span>
    );
  ytParts.push(String(a.year ?? '—'));
  if (a.tracks > 0) ytParts.push(`${a.tracks} ${t.track_count}`);
  const dur = formatDuration(a.durationMs ?? 0);
  if (dur !== '—') ytParts.push(dur);
  if (library)
    ytParts.push(
      <span key="lib" className="lib-tag">
        {library}
      </span>
    );

  return (
    <div className={`result-album ${isSkipped ? 'skipped' : ''}`}>
      <div className="ra-head">
        <Cover coverUrl={a.coverUrl ?? ''} fallback={a.album} lg />
        <div className="meta">
          <div className="album">{a.album}</div>
          <div className="artist">{a.artist}</div>
          <div className="yt">
            {ytParts.flatMap((p, i) => (i === 0 ? [p] : [' · ', p]))}
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
                className={`src-tab ${tab === tb.key ? 'on' : ''} ${tb.err ? 'err' : ''} ${tb.loading ? 'loading' : ''}`}
                data-src={tb.key}
                onClick={() => setTab(tb.key)}
              >
                <span className="src-dot"></span>
                <span>{tb.label}</span>
                {tb.loading ? (
                  <span className="badge-count badge-loading">
                    <div className="spinner xs" />
                  </span>
                ) : (
                  <span className="badge-count">{tb.count}</span>
                )}
              </button>
            ))}
          </div>

          {isLoading && (
            <div
              className="candidate-empty"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <div className="spinner" />
              {t.searching_title}
            </div>
          )}

          {!isLoading && isErr && (
            <div className="candidate-err">
              <Icon name="alert" size={16} />
              <span>
                <strong>{t[tab]}:</strong> {currentResult.message}
              </span>
            </div>
          )}

          {!isLoading && !isErr && candidates.length === 0 && (
            <div className="candidate-empty">{t.no_candidates}</div>
          )}

          {!isLoading &&
            !isErr &&
            candidates.map((c) => {
              const isChosen = chosenId === c.id;
              const matchPct = Math.round(c.match * 100);

              const artistStr = (c.match_artists || []).join(', ');
              const metaParts = [
                artistStr || null,
                c.year != null ? String(c.year) : '—',
                c.track_count != null
                  ? `${c.track_count} ${t.track_count}`
                  : null,
              ].filter(Boolean);
              const metaText = metaParts.join(' · ');

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
                  <Cover
                    coverUrl={c.cover_url ?? ''}
                    fallback={c.match_title}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="title">{c.match_title}</div>
                    <div className="meta">
                      {metaText}
                      {' · '}
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
      const r = it.results[s];
      if (!isSourceLoading(r) && !Array.isArray(r)) e++;
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
            lang={lang}
            setChosen={setChosen}
            setSkip={setSkip}
            setActive={setActive}
            sources={sources}
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
