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
      // settings strings
      'settings_sub',
      'back_to_app',
      'nav_sources',
      'nav_lidarr',
      'nav_download',
      'nav_advanced',
      'save_changes',
      'discard',
      'all_saved',
      'origin_saved',
      'origin_env',
      'origin_default',
      'reset_inherited',
      'secret_not_set',
      'secret_from_env',
      'secret_replace',
      'secret_clear',
      'secret_save',
      'secret_cancel',
      'secret_show',
      'secret_hide',
      'secret_new_ph',
      'secret_blocked',
      'enabled',
      'disabled',
      'sec_token',
      'sec_quality',
      'yandex_warn',
      'yt_oauth_path',
      'yt_client_id',
      'yt_client_secret',
      'yt_oauth_help',
      'sc_only',
      'sc_cookies_note',
      'lidarr_url',
      'lidarr_apikey',
      'lidarr_import',
      'lidarr_map',
      'lidarr_map_help',
      'conn_connected',
      'conn_unreachable',
      'conn_test',
      'dl_yandex_quality',
      'dl_group_yandex',
      'dl_group_ytdlp',
      'dl_group_general',
      'dl_lyrics_yandex_note',
      'dl_ytdlp_format',
      'dl_ytdlp_quality',
      'dl_lyrics',
      'lyr_none',
      'lyr_text',
      'lyr_lrc',
      'dl_cover_res',
      'cover_original',
      'dl_embed',
      'dl_skip',
      'dl_clear_comments',
      'dl_only_music',
      'dl_stick_artist',
      'adv_path_pattern',
      'adv_yandex_path_pattern',
      'adv_ytdlp_path_pattern',
      'adv_unsafe_path',
      'adv_unsafe_hint',
      'adv_request_delay',
      'adv_ytdlp_retries',
      'adv_network',
      'adv_timeout',
      'adv_tries',
      'adv_retry_delay',
      'adv_compat',
      'adv_cookies',
      'adv_cookies_note',
      'show_advanced',
      'hide_advanced',
      'err_number',
      'err_map',
      'err_url',
      'this_run',
      'this_run_open',
      'this_run_banner',
      'overridden',
      'reset_default',
      'from_default',
      'units_kbps',
      'units_px',
      'units_s',
      // Stage-1 redesign keys (Task 3)
      'sort_album',
      'sort_library',
      'th_type',
      'th_duration',
      'th_library',
      'lib_all',
      'type_Album',
      'type_EP',
      'type_Single',
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

  it('settingsUnsaved agrees the noun with the count in en + ru (1 / 2–4 / 5+)', () => {
    expect(I18N_FNS.settingsUnsaved('en', 1)).toBe('1 unsaved change');
    expect(I18N_FNS.settingsUnsaved('en', 2)).toBe('2 unsaved changes');
    expect(I18N_FNS.settingsUnsaved('en', 5)).toBe('5 unsaved changes');
    expect(I18N_FNS.settingsUnsaved('ru', 1)).toBe('1 несохранённое изменение');
    expect(I18N_FNS.settingsUnsaved('ru', 3)).toBe('3 несохранённых изменения');
    expect(I18N_FNS.settingsUnsaved('ru', 5)).toBe('5 несохранённых изменений');
    expect(I18N_FNS.settingsUnsaved('ru', 11)).toBe(
      '11 несохранённых изменений'
    );
    expect(I18N_FNS.settingsUnsaved('ru', 21)).toBe(
      '21 несохранённое изменение'
    );
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
