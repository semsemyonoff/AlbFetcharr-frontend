import { describe, it, expect } from 'vitest';
import { I18N, I18N_FNS, pluralRu } from '../i18n';

describe('i18n', () => {
  it('should have matching keys between en and ru translations', () => {
    const enKeys = Object.keys(I18N.en).sort();
    const ruKeys = Object.keys(I18N.ru).sort();

    expect(enKeys).toEqual(ruKeys);
  });

  it('should have all values as strings', () => {
    Object.entries(I18N.en).forEach(([, value]) => {
      expect(typeof value).toBe('string');
    });

    Object.entries(I18N.ru).forEach(([, value]) => {
      expect(typeof value).toBe('string');
    });
  });

  it('should have at least one key in each language', () => {
    expect(Object.keys(I18N.en).length).toBeGreaterThan(0);
    expect(Object.keys(I18N.ru).length).toBeGreaterThan(0);
  });

  it('should define the keys extracted in the i18n sweep in both languages', () => {
    const newKeys = [
      'step_select',
      'step_results',
      'step_download',
      'just_now',
      'searching_title',
      'select_to_download',
      'download_other_tab',
      'download_running_server',
      'error_prefix',
      'no_progress_received',
      'connection_retrying',
      'connection_lost_backend',
      'connection_lost',
      'empty_title',
      'empty_body',
      'conn_error_title',
      'conn_error_body',
      'cancel',
      'dl_downloading_title',
      'dl_all_done_title',
      'dl_finished_errors_title',
      'start_over',
      'done_all_set',
      'done_some_failed',
      'new_session',
      'status_starting',
      'status_downloaded',
      'status_importing',
      'status_partial',
    ];
    newKeys.forEach((key) => {
      expect(I18N.en[key], `en.${key}`).toBeTruthy();
      expect(I18N.ru[key], `ru.${key}`).toBeTruthy();
    });
  });
});

describe('pluralRu — real RU plural categories', () => {
  const forms = ['альбом', 'альбома', 'альбомов'];

  it('uses the "one" form for n ending in 1 (but not 11)', () => {
    expect(pluralRu(1, forms)).toBe('альбом');
    expect(pluralRu(21, forms)).toBe('альбом');
    expect(pluralRu(101, forms)).toBe('альбом');
  });

  it('uses the "few" form for n ending in 2–4 (but not 12–14)', () => {
    expect(pluralRu(2, forms)).toBe('альбома');
    expect(pluralRu(3, forms)).toBe('альбома');
    expect(pluralRu(4, forms)).toBe('альбома');
    expect(pluralRu(22, forms)).toBe('альбома');
  });

  it('uses the "many" form for n ending in 5–9, 0, and the 11–14 teens', () => {
    expect(pluralRu(5, forms)).toBe('альбомов');
    expect(pluralRu(0, forms)).toBe('альбомов');
    expect(pluralRu(11, forms)).toBe('альбомов');
    expect(pluralRu(12, forms)).toBe('альбомов');
    expect(pluralRu(14, forms)).toBe('альбомов');
    expect(pluralRu(100, forms)).toBe('альбомов');
  });
});

describe('I18N_FNS — count-dependent interpolation', () => {
  it('searchingSubtitle agrees the noun with the count (RU 1 / 2–4 / 5+)', () => {
    expect(I18N_FNS.searchingSubtitle('ru', 1, 1)).toBe(
      'Опрашиваем 1 источник по 1 альбому.'
    );
    expect(I18N_FNS.searchingSubtitle('ru', 3, 2)).toBe(
      'Опрашиваем 3 источника по 2 альбомам.'
    );
    expect(I18N_FNS.searchingSubtitle('ru', 5, 5)).toBe(
      'Опрашиваем 5 источников по 5 альбомам.'
    );
  });

  it('searchingSubtitle uses EN singular/plural split', () => {
    expect(I18N_FNS.searchingSubtitle('en', 1, 1)).toBe(
      'Querying 1 source for 1 album.'
    );
    expect(I18N_FNS.searchingSubtitle('en', 2, 3)).toBe(
      'Querying 2 sources for 3 albums.'
    );
  });

  it('resultsSubtitle handles the 0-errors case in both languages', () => {
    expect(I18N_FNS.resultsSubtitle('en', 1, 0)).toBe(
      'Searched 1 album · 0 source errors'
    );
    expect(I18N_FNS.resultsSubtitle('en', 5, 2)).toBe(
      'Searched 5 albums · 2 source errors'
    );
    expect(I18N_FNS.resultsSubtitle('ru', 1, 0)).toBe(
      'Поиск завершён по 1 альбому · 0 ошибок источников'
    );
    expect(I18N_FNS.resultsSubtitle('ru', 5, 1)).toBe(
      'Поиск завершён по 5 альбомам · 1 ошибка источников'
    );
  });

  it('downloadDoneSubtitle / downloadProgressSubtitle render numbers', () => {
    expect(I18N_FNS.downloadDoneSubtitle('en', 2, 3)).toBe('2 of 3 succeeded');
    expect(I18N_FNS.downloadDoneSubtitle('ru', 2, 3)).toBe('2 из 3 успешно');
    expect(I18N_FNS.downloadProgressSubtitle('en', 1, 4)).toBe(
      '1/4 done · keep this tab open'
    );
    expect(I18N_FNS.downloadProgressSubtitle('ru', 1, 4)).toBe(
      '1/4 готово · не закрывайте страницу'
    );
  });

  it('batchPosition renders "album N of M" honestly in both languages', () => {
    expect(I18N_FNS.batchPosition('en', 2, 5)).toBe('album 2 of 5');
    expect(I18N_FNS.batchPosition('ru', 1, 3)).toBe('альбом 1 из 3');
  });

  it('downloadDoneCardBody agrees verb/noun and appends failures', () => {
    expect(I18N_FNS.downloadDoneCardBody('en', true, 1, 0)).toBe(
      '1 album imported into Lidarr.'
    );
    expect(I18N_FNS.downloadDoneCardBody('en', false, 3, 2)).toBe(
      '3 albums saved to downloads, 2 failed.'
    );
    expect(I18N_FNS.downloadDoneCardBody('ru', true, 1, 0)).toBe(
      '1 альбом импортирован в Lidarr.'
    );
    expect(I18N_FNS.downloadDoneCardBody('ru', false, 2, 1)).toBe(
      '2 альбома сохранены в папку загрузок, 1 с ошибкой.'
    );
    expect(I18N_FNS.downloadDoneCardBody('ru', true, 5, 0)).toBe(
      '5 альбомов импортированы в Lidarr.'
    );
  });
});
