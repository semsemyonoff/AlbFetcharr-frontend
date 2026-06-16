import React from 'react';
import { Icon } from './icons.jsx';
import { AGO_FNS } from './i18n.js';
import { sortAlbums, filterAlbums, paginate } from './select-helpers.js';

const SelectStep = ({
  t,
  lang,
  fetchState,
  onRefetch,
  albums,
  selected,
  setSelected,
  sources,
  setSources,
  onSearch,
  availableSources,
}) => {
  const [query, setQuery] = React.useState('');
  const [sortKey, setSortKey] = React.useState('artist');
  const [sortDir, setSortDir] = React.useState('asc');
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(15);

  React.useEffect(() => {
    setPage(1);
  }, [query, sortKey, sortDir, rowsPerPage]);

  const filtered = React.useMemo(() => {
    return filterAlbums(albums, query);
  }, [albums, query]);

  const sorted = React.useMemo(() => {
    return sortAlbums(filtered, sortKey, sortDir);
  }, [filtered, sortKey, sortDir]);

  const paginationData = React.useMemo(() => {
    return paginate(sorted, page, rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  const { visible, safePage, pages, total, start } = paginationData;

  const selectedOnPage = visible.filter((a) => selected.has(a.id));
  const allOnPageSelected =
    visible.length > 0 && selectedOnPage.length === visible.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  const toggleAllPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allPageSelected =
        visible.length > 0 && visible.every((a) => next.has(a.id));
      if (allPageSelected) visible.forEach((a) => next.delete(a.id));
      else visible.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'added' ? 'desc' : 'asc');
    }
  };

  const SortIndicator = ({ k }) => (
    <span className="sort-arrow">
      {sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : '▾'}
    </span>
  );

  const ago = AGO_FNS[lang];
  const selCount = selected.size;
  const activeSourcesCount = Object.values(sources).filter(Boolean).length;
  const canSearch = selCount > 0 && activeSourcesCount > 0;

  if (fetchState === 'loading') {
    return (
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">
            {t.wanted}
            <span className="count">…</span>
          </h2>
        </div>
        <div className="skel-table">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skel-row" key={i}>
              <div
                className="skel-block"
                style={{ width: 16, height: 16 }}
              ></div>
              <div
                className="skel-block"
                style={{ width: 36, height: 36, borderRadius: 6 }}
              ></div>
              <div
                className="skel-block"
                style={{ width: 180 + Math.random() * 80, height: 12 }}
              ></div>
              <div style={{ flex: 1 }}></div>
              <div
                className="skel-block"
                style={{ width: 50, height: 12 }}
              ></div>
              <div
                className="skel-block"
                style={{ width: 80, height: 22, borderRadius: 999 }}
              ></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (fetchState === 'empty') {
    return (
      <div className="empty-state">
        <div className="ico">
          <Icon name="music" size={28} />
        </div>
        <h3>{lang === 'ru' ? 'Ничего не загружено' : 'Nothing loaded yet'}</h3>
        <p>
          {lang === 'ru'
            ? 'Подключитесь к Lidarr, чтобы получить список wanted-альбомов.'
            : 'Connect to Lidarr to load the list of wanted albums.'}
        </p>
        <button className="btn btn-primary" onClick={onRefetch}>
          <Icon name="refresh" size={14} />
          {t.fetch_lidarr}
        </button>
      </div>
    );
  }

  if (fetchState === 'error') {
    return (
      <div className="empty-state">
        <div className="ico">
          <Icon name="alert" size={28} />
        </div>
        <h3>{lang === 'ru' ? 'Ошибка подключения' : 'Connection error'}</h3>
        <p>
          {lang === 'ru'
            ? 'Не удалось подключиться к Lidarr. Проверьте конфигурацию.'
            : 'Failed to connect to Lidarr. Check your configuration.'}
        </p>
        <button className="btn btn-primary" onClick={onRefetch}>
          <Icon name="refresh" size={14} />
          {t.fetch_lidarr}
        </button>
      </div>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">
            {t.wanted}
            <span className="count">{total}</span>
          </h2>
          <div className="panel-actions">
            <button className="btn btn-ghost btn-sm" onClick={onRefetch}>
              <Icon name="refresh" size={13} />
              {t.fetch_lidarr}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-input">
            <Icon name="search" className="search-icon" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search_placeholder}
            />
            {query && (
              <button
                className="clear"
                onClick={() => setQuery('')}
                aria-label="clear"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
          <select
            className="filter-select"
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':');
              setSortKey(k);
              setSortDir(d);
            }}
          >
            <option value="artist:asc">{t.sort_artist}</option>
            <option value="added:desc">{t.sort_added}</option>
            <option value="year:desc">{t.sort_year_desc}</option>
            <option value="year:asc">{t.sort_year_asc}</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="wt">
            <thead>
              <tr>
                <th className="wt-checkbox">
                  <input
                    type="checkbox"
                    className="cb"
                    ref={(el) => el && (el.indeterminate = someOnPageSelected)}
                    checked={allOnPageSelected}
                    onChange={toggleAllPage}
                  />
                </th>
                <th className="wt-cover"></th>
                <th className="sortable" onClick={() => onSort('artist')}>
                  {t.th_album} <SortIndicator k="artist" />
                </th>
                <th
                  className="sortable cell-num"
                  onClick={() => onSort('year')}
                  style={{ width: 80 }}
                >
                  {t.th_year} <SortIndicator k="year" />
                </th>
                <th className="cell-num" style={{ width: 80 }}>
                  {t.th_tracks}
                </th>
                <th
                  className="sortable"
                  onClick={() => onSort('added')}
                  style={{ width: 130 }}
                >
                  {t.th_added} <SortIndicator k="added" />
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: 'center',
                      padding: 40,
                      color: 'var(--text-mute)',
                    }}
                  >
                    {t.no_results}
                  </td>
                </tr>
              )}
              {visible.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => toggleOne(a.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td
                    className="wt-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="cb"
                      checked={selected.has(a.id)}
                      onChange={() => toggleOne(a.id)}
                    />
                  </td>
                  <td className="wt-cover">
                    <div className="cover">
                      <div className="vinyl-stripes"></div>
                      <span style={{ position: 'relative' }}>
                        {a.artist.slice(0, 2)}
                      </span>
                    </div>
                  </td>
                  <td className="cell-album">
                    <div className="artist">{a.artist}</div>
                    <div className="album">{a.album}</div>
                  </td>
                  <td className="cell-num">{a.year}</td>
                  <td className="cell-num">{a.tracks}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-mute)' }}>
                    {ago(a.addedDaysAgo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>
            {t.rows_per_page}:{' '}
            <select
              className="filter-select"
              style={{
                padding: '3px 22px 3px 8px',
                fontSize: 12,
                marginLeft: 4,
              }}
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            {start + 1}–{Math.min(start + rowsPerPage, total)} {t.of} {total}
          </span>
          <div className="pages">
            <button
              className="pg-btn"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
            >
              «
            </button>
            <button
              className="pg-btn"
              onClick={() => setPage(safePage - 1)}
              disabled={safePage === 1}
            >
              <Icon name="chevronLeft" size={12} />
            </button>
            <PageNumbers page={safePage} total={pages} onPage={setPage} />
            <button
              className="pg-btn"
              onClick={() => setPage(safePage + 1)}
              disabled={safePage === pages}
            >
              <Icon name="chevronRight" size={12} />
            </button>
            <button
              className="pg-btn"
              onClick={() => setPage(pages)}
              disabled={safePage === pages}
            >
              »
            </button>
          </div>
        </div>
      </section>

      {/* Sticky action bar — source picker + search */}
      <div className="action-bar">
        <span className="label-min">{t.search_sources_in}</span>
        <div className="source-chips">
          {availableSources.map((s) => (
            <button
              key={s.id}
              className={`src-chip ${sources[s.id] ? 'on' : ''}`}
              data-src={s.id}
              onClick={() => setSources({ ...sources, [s.id]: !sources[s.id] })}
            >
              <span className="src-dot"></span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
        <div className="sep"></div>
        <span className="counter">
          <b>{selCount}</b> {t.selected}
        </span>
        <div className="grow"></div>
        <button
          className="btn btn-primary"
          disabled={!canSearch}
          onClick={onSearch}
        >
          <Icon name="search" size={14} />
          {t.search}
          {selCount > 0 && (
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
              {selCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};

const PageNumbers = ({ page, total, onPage }) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        className={`pg-btn ${n === page ? 'on' : ''}`}
        onClick={() => onPage(n)}
      >
        {n}
      </button>
    ));
  }
  const out = [];
  const push = (n) =>
    out.push(
      <button
        key={n}
        className={`pg-btn ${n === page ? 'on' : ''}`}
        onClick={() => onPage(n)}
      >
        {n}
      </button>
    );
  const ell = (k) =>
    out.push(
      <span key={k} className="pg-ellipsis">
        …
      </span>
    );
  push(1);
  if (page > 3) ell('e1');
  for (let n = Math.max(2, page - 1); n <= Math.min(total - 1, page + 1); n++)
    push(n);
  if (page < total - 2) ell('e2');
  push(total);
  return out;
};

export default SelectStep;
