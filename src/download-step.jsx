import React from 'react';
import { Icon } from './icons.jsx';
import { I18N_FNS } from './i18n.js';

export function DownloadStep({
  t,
  lang,
  downloads,
  logLines,
  allDone,
  anyFailed,
  importEnabled,
  onStartOver,
  onLogCopy,
  onLogClear,
}) {
  const bodyRef = React.useRef(null);
  React.useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [logLines.length]);

  const statusLabel = (s) => {
    const map = {
      starting: t.status_starting,
      downloading: t.status_downloading,
      downloaded: t.status_downloaded,
      importing: t.status_importing,
      done: t.status_done,
      failed: t.status_failed,
    };
    return map[s] || s;
  };

  const successCount = downloads.filter((d) => d.status === 'done').length;
  const failedCount = downloads.filter((d) => d.status === 'failed').length;

  return (
    <>
      <div className="step-header">
        <div>
          <h2>
            {allDone
              ? anyFailed
                ? t.dl_finished_errors_title
                : t.dl_all_done_title
              : t.dl_downloading_title}
          </h2>
          <div className="sub">
            {allDone
              ? I18N_FNS.downloadDoneSubtitle(
                  lang,
                  successCount,
                  downloads.length
                )
              : I18N_FNS.downloadProgressSubtitle(
                  lang,
                  successCount,
                  downloads.length
                )}
          </div>
        </div>
        <div className="actions">
          {allDone && (
            <button className="btn btn-primary" onClick={onStartOver}>
              <Icon name="refresh" size={13} />
              {t.start_over}
            </button>
          )}
        </div>
      </div>

      <div className="dl-list">
        {downloads.map((d) => {
          const pctRounded = Math.floor(d.progress || 0);
          const statusCls = d.status || 'starting';
          return (
            <div className={`dl-row ${statusCls}`} key={d.album_id}>
              <div className="cover">
                <div className="vinyl-stripes"></div>
                <span style={{ position: 'relative' }}>
                  {(d.artist || '?').slice(0, 2)}
                </span>
              </div>
              <div className="meta">
                <div className="head">
                  <span className="artist">{d.artist || 'Unknown'}</span>
                  <span style={{ color: 'var(--text-mute)' }}>—</span>
                  <span className="album">{d.album || 'Unknown Album'}</span>
                  <span className={`src-badge ${d.source}`}>
                    {t[d.source] || d.source}
                  </span>
                  <span className="fmt">{d.format || 'Default'}</span>
                </div>
                <div className="progress-wrap">
                  <div
                    className={`progress-bar ${d.status === 'done' ? 'done' : ''} ${d.status === 'failed' ? 'err' : ''}`}
                  >
                    <div
                      className="fill"
                      style={{ width: `${pctRounded}%` }}
                    ></div>
                  </div>
                  <span className="pct">{pctRounded}%</span>
                </div>
                <div className="step-msg" style={{ marginTop: 4 }}>
                  {d.message || ''}
                </div>
              </div>
              <div className="right-stat">
                <span className="status-mini">{statusLabel(statusCls)}</span>
                {d.item_total > 1 && (
                  <span className="batch-pos">
                    {I18N_FNS.batchPosition(lang, d.item_index, d.item_total)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="log-inline">
        <div className="li-head">
          <Icon name="list" size={14} style={{ color: 'var(--text-mute)' }} />
          <span className="title">{t.log}</span>
          <span className="pill">{logLines.length}</span>
          <div className="actions">
            <button
              className="btn btn-xs btn-ghost"
              onClick={onLogCopy}
              title={t.log_copy}
            >
              <Icon name="copy" size={12} />
            </button>
            <button
              className="btn btn-xs btn-ghost"
              onClick={onLogClear}
              title={t.log_clear}
            >
              <Icon name="trash" size={12} />
            </button>
          </div>
        </div>
        <div className="li-body" ref={bodyRef}>
          {logLines.length === 0 ? (
            <div style={{ color: 'var(--text-mute)', fontStyle: 'italic' }}>
              {t.log_empty}
            </div>
          ) : (
            logLines.map((l, i) => (
              <div key={i} className={`log-line ${l.type || ''}`}>
                {l.text}
              </div>
            ))
          )}
        </div>
      </div>

      {allDone && (
        <div className="done-card">
          <div className="check-big">
            <Icon name={anyFailed ? 'alert' : 'check'} size={28} />
          </div>
          <h3>{anyFailed ? t.done_some_failed : t.done_all_set}</h3>
          <div className="sub">
            {I18N_FNS.downloadDoneCardBody(
              lang,
              importEnabled,
              successCount,
              failedCount
            )}
          </div>
          <div className="row-actions-center">
            <button className="btn btn-primary" onClick={onStartOver}>
              <Icon name="refresh" size={13} />
              {t.new_session}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
