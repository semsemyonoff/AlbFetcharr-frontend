import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { DownloadStep } from '../download-step';
import { I18N } from '../i18n';

afterEach(cleanup);

function makeDownload(overrides = {}) {
  return {
    album_id: 1,
    artist: 'Pink Floyd',
    album: 'Animals',
    source: 'yandex',
    format: 'FLAC',
    status: 'downloading',
    message: '',
    progress: 40,
    ...overrides,
  };
}

function renderDownload(props = {}) {
  const {
    lang = 'en',
    downloads = [makeDownload()],
    allDone = false,
    anyFailed = false,
    importEnabled = true,
    logLines = [],
  } = props;
  return render(
    <DownloadStep
      t={I18N[lang]}
      lang={lang}
      downloads={downloads}
      logLines={logLines}
      allDone={allDone}
      anyFailed={anyFailed}
      importEnabled={importEnabled}
      onStartOver={() => {}}
      onLogCopy={() => {}}
      onLogClear={() => {}}
    />
  );
}

describe('DownloadStep — i18n-resolved status labels', () => {
  const statuses = [
    ['starting', 'status_starting'],
    ['downloading', 'status_downloading'],
    ['downloaded', 'status_downloaded'],
    ['importing', 'status_importing'],
    ['done', 'status_done'],
    ['failed', 'status_failed'],
  ];

  statuses.forEach(([status, key]) => {
    it(`shows the localized "${status}" label (EN + RU)`, () => {
      const en = renderDownload({ downloads: [makeDownload({ status })] });
      expect(en.container.querySelector('.status-mini').textContent).toBe(
        I18N.en[key]
      );
      cleanup();
      const ru = renderDownload({
        lang: 'ru',
        downloads: [makeDownload({ status })],
      });
      expect(ru.container.querySelector('.status-mini').textContent).toBe(
        I18N.ru[key]
      );
    });
  });

  it('shows the "Partial" warning label for a completed album with failed tracks', () => {
    const en = renderDownload({
      downloads: [makeDownload({ status: 'done', partial: true, errors: 2 })],
    });
    expect(en.container.querySelector('.status-mini').textContent).toBe(
      I18N.en.status_partial
    );
    // The row + bar carry the partial (warning) class, not the success class.
    expect(en.container.querySelector('.dl-row.partial')).not.toBeNull();
    expect(en.container.querySelector('.progress-bar.partial')).not.toBeNull();
    expect(en.container.querySelector('.progress-bar.done')).toBeNull();
  });

  it('does not flag partial while still downloading', () => {
    const en = renderDownload({
      downloads: [makeDownload({ status: 'downloading', partial: true })],
    });
    // partial only applies to terminal-ish states; mid-download stays downloading.
    expect(en.container.querySelector('.status-mini').textContent).toBe(
      I18N.en.status_downloading
    );
    expect(en.container.querySelector('.dl-row.partial')).toBeNull();
  });
});

describe('DownloadStep — i18n-resolved headings + summaries', () => {
  it('renders the in-progress heading and progress summary', () => {
    const { container } = renderDownload({
      downloads: [
        makeDownload(),
        makeDownload({ album_id: 2, status: 'done' }),
      ],
    });
    expect(container.querySelector('h2').textContent).toBe(
      I18N.en.dl_downloading_title
    );
    expect(container.querySelector('.step-header .sub').textContent).toBe(
      '1/2 done · keep this tab open'
    );
  });

  it('renders the all-done heading and summary (RU)', () => {
    const { container } = renderDownload({
      lang: 'ru',
      allDone: true,
      downloads: [makeDownload({ status: 'done' })],
    });
    expect(container.querySelector('h2').textContent).toBe(
      I18N.ru.dl_all_done_title
    );
    expect(container.querySelector('.step-header .sub').textContent).toBe(
      '1 из 1 успешно'
    );
  });

  it('renders the finished-with-errors heading', () => {
    const { container } = renderDownload({
      allDone: true,
      anyFailed: true,
      downloads: [makeDownload({ status: 'failed' })],
    });
    expect(container.querySelector('h2').textContent).toBe(
      I18N.en.dl_finished_errors_title
    );
  });
});

describe('DownloadStep — batch position ("album N of M")', () => {
  it('renders the batch position when there is more than one album (EN)', () => {
    const { container } = renderDownload({
      downloads: [makeDownload({ item_index: 2, item_total: 5 })],
    });
    expect(container.querySelector('.batch-pos').textContent).toBe(
      'album 2 of 5'
    );
  });

  it('renders the batch position in RU', () => {
    const { container } = renderDownload({
      lang: 'ru',
      downloads: [makeDownload({ item_index: 1, item_total: 3 })],
    });
    expect(container.querySelector('.batch-pos').textContent).toBe(
      'альбом 1 из 3'
    );
  });

  it('hides the batch position for a single-album download', () => {
    const { container } = renderDownload({
      downloads: [makeDownload({ item_index: 1, item_total: 1 })],
    });
    expect(container.querySelector('.batch-pos')).toBeNull();
  });
});

describe('DownloadStep — i18n-resolved done card', () => {
  it('renders the success done-card body (EN import)', () => {
    const { container, getByText } = renderDownload({
      allDone: true,
      downloads: [makeDownload({ status: 'done' })],
    });
    expect(getByText(I18N.en.done_all_set)).toBeTruthy();
    expect(getByText(I18N.en.new_session)).toBeTruthy();
    expect(container.querySelector('.done-card .sub').textContent).toBe(
      '1 album imported into Lidarr.'
    );
  });

  it('renders the partial-failure done-card body (RU, no import)', () => {
    const { container, getByText } = renderDownload({
      lang: 'ru',
      allDone: true,
      anyFailed: true,
      importEnabled: false,
      downloads: [
        makeDownload({ album_id: 1, status: 'done' }),
        makeDownload({ album_id: 2, status: 'done' }),
        makeDownload({ album_id: 3, status: 'failed' }),
      ],
    });
    expect(getByText(I18N.ru.done_some_failed)).toBeTruthy();
    expect(container.querySelector('.done-card .sub').textContent).toBe(
      '2 альбома сохранены в папку загрузок, 1 с ошибкой.'
    );
  });
});
