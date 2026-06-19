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
      coverUrl: '',
      albumType: '',
      library: '',
      durationMs: 0,
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

describe('ResultsStep — album header layout', () => {
  it('renders album as the primary (first) element, artist as secondary', () => {
    const { container } = renderResults([makeItem()]);
    const meta = container.querySelector('.ra-head .meta');
    expect(meta).toBeTruthy();
    const children = Array.from(meta.children);
    expect(children[0].className).toContain('album');
    expect(children[0].textContent).toBe('Animals');
    expect(children[1].className).toContain('artist');
    expect(children[1].textContent).toBe('Pink Floyd');
  });

  it('renders Cover (not a raw vinyl placeholder) for the album header', () => {
    const { container } = renderResults([
      makeItem({ coverUrl: 'https://example.com/art.jpg' }),
    ]);
    const raHead = container.querySelector('.ra-head');
    // Cover with a URL renders an <img>
    const img = raHead.querySelector('.cover img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/art.jpg');
  });

  it('renders Cover placeholder when coverUrl is empty', () => {
    const { container } = renderResults([makeItem({ coverUrl: '' })]);
    const raHead = container.querySelector('.ra-head');
    const coverDiv = raHead.querySelector('.cover.lg');
    expect(coverDiv).toBeTruthy();
    // no img when no coverUrl
    expect(coverDiv.querySelector('img')).toBeFalsy();
    expect(coverDiv.querySelector('.vinyl-stripes')).toBeTruthy();
  });
});

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

describe('ResultsStep — album header .yt meta line', () => {
  it('renders year as "—" when year is null, no dangling separator', () => {
    const { container } = renderResults([makeItem({ year: null })]);
    const yt = container.querySelector('.yt');
    expect(yt.textContent).toBe('—');
    expect(yt.textContent).not.toMatch(/^·|·$/);
  });

  it('shows type-tag only when albumType is non-empty', () => {
    const { container } = renderResults([makeItem({ albumType: 'EP' })]);
    const yt = container.querySelector('.yt');
    expect(yt.querySelector('.type-tag')).toBeTruthy();
    expect(yt.querySelector('.type-tag').textContent).toBeTruthy();
  });

  it('does not render type-tag when albumType is empty', () => {
    const { container } = renderResults([makeItem({ albumType: '' })]);
    const yt = container.querySelector('.yt');
    expect(yt.querySelector('.type-tag')).toBeFalsy();
  });

  it('shows lib-tag only when library is non-empty', () => {
    const { container } = renderResults([makeItem({ library: 'Lossless' })]);
    const yt = container.querySelector('.yt');
    expect(yt.querySelector('.lib-tag')).toBeTruthy();
    expect(yt.querySelector('.lib-tag').textContent).toBe('Lossless');
  });

  it('does not render lib-tag when library is empty', () => {
    const { container } = renderResults([makeItem({ library: '' })]);
    const yt = container.querySelector('.yt');
    expect(yt.querySelector('.lib-tag')).toBeFalsy();
  });

  it('no dangling separator when only year is present (no type/duration/lib)', () => {
    const { container } = renderResults([
      makeItem({ albumType: '', library: '', durationMs: 0, tracks: 0 }),
    ]);
    const yt = container.querySelector('.yt');
    expect(yt.textContent).toBe('1977');
    expect(yt.textContent).not.toContain('·');
  });

  it('shows duration when durationMs is non-zero', () => {
    const { container } = renderResults([
      makeItem({ durationMs: 3661000 }), // 1h 1m 1s
    ]);
    const yt = container.querySelector('.yt');
    expect(yt.textContent).toContain('1:01:01');
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

describe('ResultsStep — candidate rows', () => {
  const makeCandidate = (overrides = {}) => ({
    id: 'c1',
    source: 'yandex',
    match: 0.9,
    match_artists: ['Pink Floyd'],
    match_title: 'Animals',
    match_url: 'https://example.com/a',
    year: 1977,
    track_count: 5,
    cover_url: '',
    ...overrides,
  });

  it('renders match_title as the primary title line', () => {
    const item = makeItem({ tracks: 0 }, { yandex: [makeCandidate()] });
    const { container } = renderResults([item]);
    const title = container.querySelector('.cand-radio .title');
    expect(title).toBeTruthy();
    expect(title.textContent).toBe('Animals');
  });

  it('puts match_artists in the meta line (not in the title)', () => {
    const item = makeItem(
      {},
      { yandex: [makeCandidate({ match_artists: ['Pink Floyd'] })] }
    );
    const { container } = renderResults([item]);
    const title = container.querySelector('.cand-radio .title');
    const meta = container.querySelector('.cand-radio .meta');
    expect(title.textContent).not.toContain('Pink Floyd');
    expect(meta.textContent).toContain('Pink Floyd');
  });

  it('renders Cover with cover_url for the candidate', () => {
    const item = makeItem(
      {},
      {
        yandex: [makeCandidate({ cover_url: 'https://example.com/cand.jpg' })],
      }
    );
    const { container } = renderResults([item]);
    const img = container.querySelector('.cand-radio .cover img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/cand.jpg');
  });

  it('renders Cover placeholder using match_title initials when cover_url absent', () => {
    const item = makeItem(
      {},
      { yandex: [makeCandidate({ cover_url: '', match_title: 'Animals' })] }
    );
    const { container } = renderResults([item]);
    const coverSpan = container.querySelector('.cand-radio .cover span');
    expect(coverSpan).toBeTruthy();
    // fallback = match_title.slice(0, 2)
    expect(coverSpan.textContent).toBe('An');
  });

  it('guards null year in candidate meta with "—"', () => {
    const item = makeItem({}, { yandex: [makeCandidate({ year: null })] });
    const { container } = renderResults([item]);
    const meta = container.querySelector('.cand-radio .meta');
    expect(meta.textContent).toContain('—');
  });

  it('drops empty match_artists from the meta line', () => {
    const item = makeItem(
      {},
      { yandex: [makeCandidate({ match_artists: [] })] }
    );
    const { container } = renderResults([item]);
    const meta = container.querySelector('.cand-radio .meta');
    // Should not start with ' · '
    expect(meta.textContent).not.toMatch(/^\s*·/);
  });
});
