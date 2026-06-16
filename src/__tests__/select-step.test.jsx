import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import SelectStep from '../select-step';
import { I18N } from '../i18n';

afterEach(cleanup);

function renderSelect(fetchState, lang = 'en') {
  return render(
    <SelectStep
      t={I18N[lang]}
      lang={lang}
      fetchState={fetchState}
      onRefetch={() => {}}
      albums={[]}
      selected={new Set()}
      setSelected={() => {}}
      sources={{}}
      setSources={() => {}}
      onSearch={() => {}}
      availableSources={[]}
    />
  );
}

const ALBUMS = [
  {
    id: 1,
    artist: 'Aphex Twin',
    album: 'Drukqs',
    year: 2001,
    tracks: 30,
    addedDaysAgo: 0,
  },
  {
    id: 2,
    artist: 'Boards of Canada',
    album: 'Geogaddi',
    year: 2002,
    tracks: 0,
    addedDaysAgo: 1,
  },
];

function renderReady(overrides = {}) {
  const props = {
    t: I18N.en,
    lang: 'en',
    fetchState: 'ready',
    onRefetch: () => {},
    albums: ALBUMS,
    selected: new Set(),
    setSelected: () => {},
    sources: {},
    setSources: () => {},
    onSearch: () => {},
    availableSources: [],
    ...overrides,
  };
  return render(<SelectStep {...props} />);
}

describe('SelectStep — i18n-resolved empty/error states', () => {
  it('renders the empty state via i18n keys (EN + RU)', () => {
    const en = renderSelect('empty', 'en');
    expect(en.getByText(I18N.en.empty_title)).toBeTruthy();
    expect(en.getByText(I18N.en.empty_body)).toBeTruthy();
    cleanup();
    const ru = renderSelect('empty', 'ru');
    expect(ru.getByText(I18N.ru.empty_title)).toBeTruthy();
    expect(ru.getByText(I18N.ru.empty_body)).toBeTruthy();
  });

  it('renders the connection-error state via i18n keys (EN + RU)', () => {
    const en = renderSelect('error', 'en');
    expect(en.getByText(I18N.en.conn_error_title)).toBeTruthy();
    expect(en.getByText(I18N.en.conn_error_body)).toBeTruthy();
    cleanup();
    const ru = renderSelect('error', 'ru');
    expect(ru.getByText(I18N.ru.conn_error_title)).toBeTruthy();
    expect(ru.getByText(I18N.ru.conn_error_body)).toBeTruthy();
  });
});

describe('SelectStep — responsive markup (table + cards)', () => {
  it('renders both the desktop table wrapper and the mobile card list', () => {
    const { container } = renderReady();
    expect(container.querySelector('.wt-table-wrap')).toBeTruthy();
    expect(container.querySelector('.wt-cards')).toBeTruthy();
    // one card per visible album
    expect(container.querySelectorAll('.wt-card').length).toBe(ALBUMS.length);
  });

  it('routes the cards "select all on page" label through i18n (EN + RU)', () => {
    const en = renderReady();
    expect(en.getByText(I18N.en.select_all_page)).toBeTruthy();
    cleanup();
    const ru = renderReady({ t: I18N.ru, lang: 'ru' });
    expect(ru.getByText(I18N.ru.select_all_page)).toBeTruthy();
  });

  it('cards "select all" checkbox toggles page selection', () => {
    const setSelected = vi.fn();
    const { container } = renderReady({ setSelected });
    const selAll = container.querySelector('.wt-cards-head .selall .cb');
    expect(selAll).toBeTruthy();
    fireEvent.click(selAll);
    expect(setSelected).toHaveBeenCalledTimes(1);
    // the updater adds every visible album id to the set
    const updater = setSelected.mock.calls[0][0];
    const next = updater(new Set());
    expect(next.has(1)).toBe(true);
    expect(next.has(2)).toBe(true);
  });

  it('shows the cards empty state when the filter matches nothing', () => {
    const { container, getByPlaceholderText } = renderReady();
    const search = getByPlaceholderText(I18N.en.search_placeholder);
    fireEvent.change(search, { target: { value: 'zzz-no-match' } });
    const empty = container.querySelector('.wt-cards-empty');
    expect(empty).toBeTruthy();
    expect(empty.textContent).toBe(I18N.en.no_results);
  });

  it('shows the track count in a card only when tracks > 0', () => {
    const { container } = renderReady();
    const subs = [...container.querySelectorAll('.wt-card-sub')].map((el) =>
      el.textContent.replace(/\s+/g, ' ').trim()
    );
    // Aphex Twin (tracks: 30) → "30 tracks" segment present
    expect(subs[0]).toContain(`30 ${I18N.en.track_count}`);
    // Boards of Canada (tracks: 0) → no track-count segment at all
    expect(subs[1]).not.toContain(I18N.en.track_count);
  });
});
