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
    durationMs: 3600000,
    albumType: 'Album',
    coverUrl: '',
    library: 'Lossless',
  },
  {
    id: 2,
    artist: 'Boards of Canada',
    album: 'Geogaddi',
    year: 2002,
    tracks: 0,
    durationMs: 0,
    albumType: '',
    coverUrl: '',
    library: '',
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
    availableLibraries: [],
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

describe('SelectStep — new column layout (Stage-1 redesign)', () => {
  it('renders the new column headers (Type, Length, Library) and not Added', () => {
    const { container } = renderReady();
    const ths = [...container.querySelectorAll('thead th')];
    const thTexts = ths.map((th) => th.textContent.trim());
    expect(thTexts.some((t) => t.includes(I18N.en.th_type))).toBe(true);
    expect(thTexts.some((t) => t.includes(I18N.en.th_duration))).toBe(true);
    expect(thTexts.some((t) => t.includes(I18N.en.th_library))).toBe(true);
    // Old "Added" column must be gone
    expect(thTexts.some((t) => t === 'Added')).toBe(false);
  });

  it('renders Cover component for each album row', () => {
    const { container } = renderReady();
    // each visible row has a .cover element (from <Cover />)
    const covers = container.querySelectorAll('.wt-cover .cover');
    expect(covers.length).toBe(ALBUMS.length);
    // mobile cards also have a cover
    const cardCovers = container.querySelectorAll('.wt-card .cover');
    expect(cardCovers.length).toBe(ALBUMS.length);
  });

  it('renders album as primary and artist as secondary in desktop rows', () => {
    const { container } = renderReady();
    const cellAlbum = container.querySelector('.cell-album');
    const children = [...cellAlbum.children];
    expect(children[0].className).toBe('album');
    expect(children[1].className).toBe('artist');
  });

  it('renders tracks and duration in the table', () => {
    const { container } = renderReady();
    const rows = container.querySelectorAll('tbody tr');
    // first row is Aphex Twin — tracks=30, durationMs=3600000 → 1:00:00
    const cells = [...rows[0].querySelectorAll('td')];
    const cellTexts = cells.map((c) => c.textContent.trim());
    expect(cellTexts).toContain('30');
    expect(cellTexts).toContain('1:00:00');
  });

  it('renders — for year when year is null', () => {
    const nullYearAlbum = {
      id: 99,
      artist: 'Unknown',
      album: 'Untitled',
      year: null,
      tracks: 0,
      durationMs: 0,
      albumType: '',
      coverUrl: '',
      library: '',
    };
    const { container } = renderReady({ albums: [nullYearAlbum] });
    const sub = container.querySelector('.wt-card-sub');
    expect(sub.textContent).toContain('—');
    // also check the table cell
    const yearCell = [...container.querySelectorAll('tbody td')].find(
      (td) => td.textContent.trim() === '—'
    );
    expect(yearCell).toBeTruthy();
  });

  it('renders no .type-tag when albumType is empty', () => {
    const { container } = renderReady();
    // Boards of Canada card (id=2, albumType='') should have no type-tag
    const cards = [...container.querySelectorAll('.wt-card')];
    const bocCard = cards[1];
    expect(bocCard.querySelector('.type-tag')).toBeNull();
  });

  it('renders no .lib-tag when library is empty', () => {
    const { container } = renderReady();
    const cards = [...container.querySelectorAll('.wt-card')];
    const bocCard = cards[1];
    expect(bocCard.querySelector('.lib-tag')).toBeNull();
  });

  it('renders a .type-tag when albumType is non-empty', () => {
    const { container } = renderReady();
    // Aphex Twin (id=1, albumType='Album') should have a type-tag
    const cards = [...container.querySelectorAll('.wt-card')];
    const atCard = cards[0];
    expect(atCard.querySelector('.type-tag')).toBeTruthy();
  });

  it('renders a .lib-tag when library is non-empty', () => {
    const { container } = renderReady();
    const cards = [...container.querySelectorAll('.wt-card')];
    const atCard = cards[0];
    expect(atCard.querySelector('.lib-tag')).toBeTruthy();
  });
});

describe('SelectStep — library filter', () => {
  it('library filter dropdown shows lib_all option', () => {
    const { container } = renderReady({
      availableLibraries: ['Lossless', 'MP3'],
    });
    const libSelect = [...container.querySelectorAll('.filter-select')].find(
      (s) => [...s.options].some((o) => o.text === I18N.en.lib_all)
    );
    expect(libSelect).toBeTruthy();
    expect(libSelect.options.length).toBe(3); // lib_all + Lossless + MP3
  });

  it('library filter narrows the list to matching albums', () => {
    const { container } = renderReady({
      availableLibraries: ['Lossless'],
    });
    const libSelect = [...container.querySelectorAll('.filter-select')].find(
      (s) => [...s.options].some((o) => o.text === I18N.en.lib_all)
    );
    fireEvent.change(libSelect, { target: { value: 'Lossless' } });
    // Only Aphex Twin has library='Lossless'
    const cards = container.querySelectorAll('.wt-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Aphex Twin');
  });

  it('changing the library filter resets pagination to page 1', () => {
    const manyAlbums = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      artist: `Artist ${i + 1}`,
      album: `Album ${i + 1}`,
      year: 2000,
      tracks: 10,
      durationMs: 0,
      albumType: '',
      coverUrl: '',
      library: 'Lossless',
    }));
    const { container } = renderReady({
      albums: manyAlbums,
      availableLibraries: ['Lossless'],
    });

    // Navigate to page 2 using the "»" (last page) button
    const allBtns = [...container.querySelectorAll('.pg-btn')];
    const lastPageBtn = allBtns[allBtns.length - 1];
    fireEvent.click(lastPageBtn);

    // Confirm we're on page 2 — the "«" (first page) button is now enabled
    const btnsAfterNav = [...container.querySelectorAll('.pg-btn')];
    expect(btnsAfterNav[0].disabled).toBe(false);

    // Change library filter (filterKey changes → page must reset to 1)
    const libSelect = [...container.querySelectorAll('.filter-select')].find(
      (s) => [...s.options].some((o) => o.text === I18N.en.lib_all)
    );
    fireEvent.change(libSelect, { target: { value: 'Lossless' } });

    // After reset, we're on page 1 — "«" is disabled
    const btnsAfterFilter = [...container.querySelectorAll('.pg-btn')];
    expect(btnsAfterFilter[0].disabled).toBe(true);
  });

  it('drops a stale library filter when a refetch removes that library', () => {
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
      availableLibraries: ['Lossless'],
    };
    const { container, rerender } = render(<SelectStep {...props} />);

    const findLibSelect = () =>
      [...container.querySelectorAll('.filter-select')].find((s) =>
        [...s.options].some((o) => o.text === I18N.en.lib_all)
      );

    // Filter to Lossless — only Aphex Twin remains.
    fireEvent.change(findLibSelect(), { target: { value: 'Lossless' } });
    expect(findLibSelect().value).toBe('Lossless');
    expect(container.querySelectorAll('.wt-card').length).toBe(1);

    // Refetch returns albums without the 'Lossless' library.
    const refetched = [
      {
        id: 99,
        artist: 'Autechre',
        album: 'Tri Repetae',
        year: 1995,
        tracks: 11,
        durationMs: 0,
        albumType: 'Album',
        coverUrl: '',
        library: 'MP3',
      },
    ];
    rerender(
      <SelectStep {...props} albums={refetched} availableLibraries={['MP3']} />
    );

    // The stale filter is dropped (back to "all"), so the new albums are shown
    // instead of everything being filtered out against a dead option.
    expect(findLibSelect().value).toBe('');
    const cards = container.querySelectorAll('.wt-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('Autechre');
  });
});
