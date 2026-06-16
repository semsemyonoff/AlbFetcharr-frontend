import React from 'react';
import { Icon } from './icons.jsx';

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
      starting: lang === 'ru' ? 'Начинается' : 'Starting',
      downloading: lang === 'ru' ? 'Скачивается' : 'Downloading',
      downloaded: lang === 'ru' ? 'Скачано' : 'Downloaded',
      importing: lang === 'ru' ? 'Импорт в Lidarr' : 'Importing',
      done: lang === 'ru' ? 'Готово' : 'Done',
      failed: lang === 'ru' ? 'Ошибка' : 'Failed',
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
                ? lang === 'ru'
                  ? 'Загрузка завершена с ошибками'
                  : 'Finished with errors'
                : lang === 'ru'
                  ? 'Загрузка завершена'
                  : 'All done'
              : lang === 'ru'
                ? 'Загрузка…'
                : 'Downloading…'}
          </h2>
          <div className="sub">
            {allDone
              ? lang === 'ru'
                ? `${successCount} из ${downloads.length} успешно`
                : `${successCount} of ${downloads.length} succeeded`
              : lang === 'ru'
                ? `${successCount}/${downloads.length} готово · не закрывайте страницу`
                : `${successCount}/${downloads.length} done · keep this tab open`}
          </div>
        </div>
        <div className="actions">
          {allDone && (
            <button className="btn btn-primary" onClick={onStartOver}>
              <Icon name="refresh" size={13} />
              {lang === 'ru' ? 'Начать заново' : 'Start over'}
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
          <h3>
            {anyFailed
              ? lang === 'ru'
                ? 'Часть загрузок не удалась'
                : 'Some downloads failed'
              : lang === 'ru'
                ? 'Готово!'
                : 'All set!'}
          </h3>
          <div className="sub">
            {lang === 'ru'
              ? importEnabled
                ? `${successCount} альбом(ов) импортирован${successCount === 1 ? '' : 'ы'} в Lidarr${failedCount > 0 ? `, ${failedCount} с ошибкой` : ''}.`
                : `${successCount} альбом(ов) сохранён${successCount === 1 ? '' : 'ы'} в папку загрузок${failedCount > 0 ? `, ${failedCount} с ошибкой` : ''}.`
              : importEnabled
                ? `${successCount} album${successCount !== 1 ? 's' : ''} imported into Lidarr${failedCount > 0 ? `, ${failedCount} failed` : ''}.`
                : `${successCount} album${successCount !== 1 ? 's' : ''} saved to downloads${failedCount > 0 ? `, ${failedCount} failed` : ''}.`}
          </div>
          <div className="row-actions-center">
            <button className="btn btn-primary" onClick={onStartOver}>
              <Icon name="refresh" size={13} />
              {lang === 'ru' ? 'Новая сессия' : 'New session'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
