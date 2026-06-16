import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ResultsStep } from '../results-step';
import { I18N } from '../i18n';

afterEach(cleanup);

const SOURCES = ['yandex', 'youtube_music', 'soundcloud'];

function makeItem(albumOverrides = {}, results = {}) {
  return {
    album: {
      id: '1',
      artist: 'Pink Floyd',
      album: 'Animals',
      year: 1977,
      tracks: 0,
      ...albumOverrides,
    },
    results: {
      yandex: [],
      youtube_music: [],
      soundcloud: [],
      ...results,
    },
  };
}

function renderResults(items, lang = 'en') {
  return render(
    <ResultsStep
      t={I18N[lang]}
      lang={lang}
      items={items}
      choices={{}}
      setChoice={() => {}}
      onBack={() => {}}
      onDownload={() => {}}
      sources={SOURCES}
    />
  );
}

describe('ResultsStep — album track-count', () => {
  it('hides the track count for the real mapper shape (tracks: 0)', () => {
    const { container } = renderResults([makeItem({ tracks: 0 })]);
    const yt = container.querySelector('.yt');
    expect(yt).toBeTruthy();
    // year only — no "0 tracks", no dangling middot
    expect(yt.textContent).toBe('1977');
    expect(yt.textContent).not.toContain('tracks');
    expect(yt.textContent).not.toContain('·');
  });

  it('hides the track count for null/missing tracks', () => {
    const { container } = renderResults([makeItem({ tracks: null })]);
    const yt = container.querySelector('.yt');
    expect(yt.textContent).toBe('1977');
  });

  it('shows "· N tracks" when a real positive count is present (EN)', () => {
    const { container } = renderResults([makeItem({ tracks: 11 })], 'en');
    const yt = container.querySelector('.yt');
    expect(yt.textContent).toContain('1977');
    expect(yt.textContent).toContain('· 11 tracks');
  });

  it('shows the localized track-count label (RU)', () => {
    const { container } = renderResults([makeItem({ tracks: 11 })], 'ru');
    const yt = container.querySelector('.yt');
    expect(yt.textContent).toContain(`· 11 ${I18N.ru.track_count}`);
  });
});

describe('ResultsStep — i18n-resolved chrome', () => {
  it('renders the search sub-header via the interpolation helper (EN)', () => {
    const { container } = renderResults([makeItem(), makeItem({ id: '2' })]);
    const sub = container.querySelector('.step-header .sub');
    expect(sub.textContent).toBe('Searched 2 albums · 0 source errors');
  });

  it('renders the search sub-header via the interpolation helper (RU)', () => {
    const { container } = renderResults(
      [makeItem(), makeItem({ id: '2' })],
      'ru'
    );
    const sub = container.querySelector('.step-header .sub');
    expect(sub.textContent).toBe(
      'Поиск завершён по 2 альбомам · 0 ошибок источников'
    );
  });

  it('renders the localized Cancel button (EN + RU)', () => {
    const en = renderResults([makeItem()], 'en');
    expect(en.getByText(I18N.en.cancel)).toBeTruthy();
    cleanup();
    const ru = renderResults([makeItem()], 'ru');
    expect(ru.getByText(I18N.ru.cancel)).toBeTruthy();
  });
});

describe('ResultsStep — candidate cover fallback', () => {
  it("renders '?' when match_artists is empty, without crashing", () => {
    const candidate = {
      id: 'c1',
      source: 'yandex',
      match: 0.9,
      match_artists: [],
      match_title: 'Animals',
      match_url: 'https://example.com/a',
      year: 1977,
      track_count: 5,
    };
    const item = makeItem({ tracks: 0 }, { yandex: [candidate] });
    const { container } = renderResults([item]);
    const candCover = container.querySelector('.cand-radio .cover span');
    expect(candCover).toBeTruthy();
    expect(candCover.textContent).toBe('?');
  });
});
