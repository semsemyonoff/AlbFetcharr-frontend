import { describe, it, expect } from 'vitest';
import { I18N } from '../i18n';
import {
  SETTINGS_FIELDS,
  SESSION_FIELDS,
  SETTINGS_SECTIONS,
  KNOWN_CONTROLS,
  YANDEX_QUALITY_CHOICES,
  LYRICS_CHOICES,
  YTDLP_FORMAT_CHOICES,
  COMPAT_LEVEL_CHOICES,
  fieldsForSection,
  fieldsForGroup,
  fieldsForSourceCard,
  sessionFieldsForGroup,
} from '../settings-catalog';

// Backend registry keys fixture — mirrors registry.py _CATALOG exactly.
// UI keys must be a subset; default_lang/default_theme are intentionally omitted.
// yandex_path_pattern and ytdlp_path_pattern were removed in Task 1.
const BACKEND_REGISTRY_KEYS = new Set([
  // Tier 1 — secrets
  'yandex_token',
  'lidarr_api_key',
  'ytmusic_client_secret',
  // Tier 2 — global non-secret
  'lidarr_url',
  'lidarr_import_path',
  'library_map',
  'ytmusic_client_id',
  'ytmusic_oauth_file',
  'ytdlp_cookies_file',
  'enable_yandex',
  'enable_youtube_music',
  'enable_soundcloud',
  'soundcloud_include_playlists',
  'enable_bandcamp',
  'yandex_delay',
  'yandex_compat_level',
  'yandex_unsafe_path',
  'yandex_net_timeout',
  'yandex_net_tries',
  'yandex_net_retry_delay',
  'ytdlp_retries',
  // Tier 3 — session-overridable
  'yandex_quality',
  'yandex_lyrics_format',
  'yandex_cover_resolution',
  'yandex_embed_cover',
  'yandex_skip_existing',
  'yandex_only_music',
  'yandex_stick_to_artist',
  'yandex_clear_comments',
  'ytdlp_format',
  'ytdlp_quality',
  // Tier 4 — UI prefs (intentionally not surfaced in settings screen)
  'default_lang',
  'default_theme',
  // Server-wide
  'app_log_level',
]);

// Exactly the session-scoped keys from registry.py (scope == "session")
const BACKEND_SESSION_KEYS = new Set([
  'yandex_quality',
  'yandex_lyrics_format',
  'yandex_cover_resolution',
  'yandex_embed_cover',
  'yandex_skip_existing',
  'yandex_only_music',
  'yandex_stick_to_artist',
  'yandex_clear_comments',
  'ytdlp_format',
  'ytdlp_quality',
]);

// Keys that are provider="yandex" in the backend registry — must never appear
// in a cross-source/general group.
const YANDEX_ONLY_KEYS = new Set([
  'yandex_token',
  'yandex_delay',
  'yandex_compat_level',
  'yandex_unsafe_path',
  'yandex_net_timeout',
  'yandex_net_tries',
  'yandex_net_retry_delay',
  'yandex_quality',
  'yandex_lyrics_format',
  'yandex_cover_resolution',
  'yandex_embed_cover',
  'yandex_skip_existing',
  'yandex_only_music',
  'yandex_stick_to_artist',
  'yandex_clear_comments',
]);

// Collect all labelKeys and hintKeys from choices arrays.
function choiceKeys(choices) {
  return (choices || []).flatMap((c) => (c.labelKey ? [c.labelKey] : []));
}

describe('SETTINGS_SECTIONS', () => {
  it('has the five expected section ids including environment', () => {
    const ids = SETTINGS_SECTIONS.map((s) => s.id);
    expect(ids).toEqual([
      'sources',
      'lidarr',
      'download',
      'advanced',
      'environment',
    ]);
  });

  it('every section labelKey resolves in I18N.en and I18N.ru', () => {
    SETTINGS_SECTIONS.forEach(({ id, labelKey }) => {
      expect(
        I18N.en[labelKey],
        `en.${labelKey} for section ${id}`
      ).toBeTruthy();
      expect(
        I18N.ru[labelKey],
        `ru.${labelKey} for section ${id}`
      ).toBeTruthy();
    });
  });
});

describe('SETTINGS_FIELDS — key integrity', () => {
  it('every key exists in the backend registry', () => {
    SETTINGS_FIELDS.forEach(({ key }) => {
      expect(
        BACKEND_REGISTRY_KEYS.has(key),
        `${key} not found in backend registry`
      ).toBe(true);
    });
  });

  it('every control is a known type', () => {
    const controlSet = new Set(KNOWN_CONTROLS);
    SETTINGS_FIELDS.forEach(({ key, control }) => {
      expect(
        controlSet.has(control),
        `${key} has unknown control "${control}"`
      ).toBe(true);
    });
  });

  it('no duplicate keys', () => {
    const keys = SETTINGS_FIELDS.map((f) => f.key);
    const unique = new Set(keys);
    expect(keys.length).toBe(unique.size);
  });

  it('every labelKey resolves in I18N.en and I18N.ru', () => {
    SETTINGS_FIELDS.forEach(({ key, labelKey }) => {
      expect(I18N.en[labelKey], `en.${labelKey} for field ${key}`).toBeTruthy();
      expect(I18N.ru[labelKey], `ru.${labelKey} for field ${key}`).toBeTruthy();
    });
  });

  it('every hintKey (when present) resolves in I18N.en and I18N.ru', () => {
    SETTINGS_FIELDS.forEach(({ key, hintKey }) => {
      if (!hintKey) return;
      expect(I18N.en[hintKey], `en.${hintKey} for field ${key}`).toBeTruthy();
      expect(I18N.ru[hintKey], `ru.${hintKey} for field ${key}`).toBeTruthy();
    });
  });

  it('every unit (when present) resolves in I18N.en and I18N.ru', () => {
    SETTINGS_FIELDS.forEach(({ key, unit }) => {
      if (!unit) return;
      expect(I18N.en[unit], `en.${unit} for field ${key}`).toBeTruthy();
      expect(I18N.ru[unit], `ru.${unit} for field ${key}`).toBeTruthy();
    });
  });

  it('every choice labelKey (when present) resolves in I18N.en and I18N.ru', () => {
    SETTINGS_FIELDS.forEach(({ key, choices }) => {
      choiceKeys(choices).forEach((labelKey) => {
        expect(
          I18N.en[labelKey],
          `en.${labelKey} (choice of ${key})`
        ).toBeTruthy();
        expect(
          I18N.ru[labelKey],
          `ru.${labelKey} (choice of ${key})`
        ).toBeTruthy();
      });
    });
  });

  it('every field belongs to a valid section id', () => {
    const sectionIds = new Set(SETTINGS_SECTIONS.map((s) => s.id));
    SETTINGS_FIELDS.forEach(({ key, section }) => {
      expect(
        sectionIds.has(section),
        `${key} has unknown section "${section}"`
      ).toBe(true);
    });
  });
});

describe('SETTINGS_FIELDS — provider tagging (Yandex / yt-dlp split)', () => {
  it('no Yandex-only key appears in any cross-source or "general" group', () => {
    const forbidden = /general|every.source|all.source/i;
    SETTINGS_FIELDS.forEach(({ key, group, section }) => {
      if (!YANDEX_ONLY_KEYS.has(key)) return;
      expect(
        forbidden.test(group) || forbidden.test(section),
        `Yandex-only key "${key}" is in group "${group}" / section "${section}"`
      ).toBe(false);
    });
  });

  it('yandex_path_pattern and ytdlp_path_pattern are absent (removed in Task 1)', () => {
    const keys = new Set(SETTINGS_FIELDS.map((f) => f.key));
    expect(keys.has('yandex_path_pattern')).toBe(false);
    expect(keys.has('ytdlp_path_pattern')).toBe(false);
  });

  it('yandex_quality appears exactly once in SETTINGS_FIELDS', () => {
    const count = SETTINGS_FIELDS.filter(
      (f) => f.key === 'yandex_quality'
    ).length;
    expect(count).toBe(1);
  });

  it('yandex-provider surfaced session keys are grouped under dl-yandex (download section)', () => {
    // yandex_only_music and yandex_stick_to_artist are hidden from UI (kept in registry)
    const yandexSessionKeys = [
      'yandex_quality',
      'yandex_lyrics_format',
      'yandex_cover_resolution',
      'yandex_embed_cover',
      'yandex_skip_existing',
      'yandex_clear_comments',
    ];
    yandexSessionKeys.forEach((key) => {
      const field = SETTINGS_FIELDS.find((f) => f.key === key);
      expect(field, `${key} not in SETTINGS_FIELDS`).toBeTruthy();
      expect(field.group, `${key} not in dl-yandex group`).toBe('dl-yandex');
    });
  });

  it('yandex_only_music and yandex_stick_to_artist are absent from SETTINGS_FIELDS (UI hidden)', () => {
    const keys = new Set(SETTINGS_FIELDS.map((f) => f.key));
    expect(keys.has('yandex_only_music')).toBe(false);
    expect(keys.has('yandex_stick_to_artist')).toBe(false);
  });
});

describe('SESSION_FIELDS — Tier-3 subset', () => {
  it('every SESSION_FIELDS key is a backend session-scoped key', () => {
    // SESSION_FIELDS is a SUBSET of BACKEND_SESSION_KEYS — some session keys
    // (yandex_only_music, yandex_stick_to_artist) are kept in the registry as
    // env-only escape hatches but hidden from the UI.
    SESSION_FIELDS.forEach(({ key }) => {
      expect(
        BACKEND_SESSION_KEYS.has(key),
        `${key} is not a session-scoped key in the registry`
      ).toBe(true);
    });
  });

  it('yandex_only_music and yandex_stick_to_artist are absent from SESSION_FIELDS', () => {
    const sessionKeys = new Set(SESSION_FIELDS.map((f) => f.key));
    expect(sessionKeys.has('yandex_only_music')).toBe(false);
    expect(sessionKeys.has('yandex_stick_to_artist')).toBe(false);
  });

  it('every SESSION_FIELD control is a known type', () => {
    const controlSet = new Set(KNOWN_CONTROLS);
    SESSION_FIELDS.forEach(({ key, control }) => {
      expect(
        controlSet.has(control),
        `${key} has unknown control "${control}"`
      ).toBe(true);
    });
  });

  it('every SESSION_FIELD labelKey resolves in I18N.en and I18N.ru', () => {
    SESSION_FIELDS.forEach(({ key, labelKey }) => {
      expect(
        I18N.en[labelKey],
        `en.${labelKey} for SESSION_FIELD ${key}`
      ).toBeTruthy();
      expect(
        I18N.ru[labelKey],
        `ru.${labelKey} for SESSION_FIELD ${key}`
      ).toBeTruthy();
    });
  });

  it('SESSION_FIELDS includes yandex_clear_comments and yandex_cover_resolution', () => {
    const sessionKeys = new Set(SESSION_FIELDS.map((f) => f.key));
    expect(sessionKeys.has('yandex_clear_comments')).toBe(true);
    expect(sessionKeys.has('yandex_cover_resolution')).toBe(true);
  });

  it('no non-session key is included in SESSION_FIELDS', () => {
    const nonSessionRegistryKeys = [
      'enable_yandex',
      'enable_youtube_music',
      'enable_soundcloud',
      'enable_bandcamp',
      'yandex_token',
      'ytmusic_client_secret',
      'lidarr_api_key',
      'yandex_delay',
      'yandex_compat_level',
      'yandex_path_pattern',
      'yandex_unsafe_path',
      'yandex_net_timeout',
      'yandex_net_tries',
      'yandex_net_retry_delay',
      'ytdlp_path_pattern',
      'ytdlp_retries',
      'lidarr_url',
      'lidarr_import_path',
      'library_map',
      'ytmusic_client_id',
      'ytmusic_oauth_file',
      'ytdlp_cookies_file',
      'default_lang',
      'default_theme',
    ];
    const sessionKeys = new Set(SESSION_FIELDS.map((f) => f.key));
    nonSessionRegistryKeys.forEach((key) => {
      expect(
        sessionKeys.has(key),
        `non-session key "${key}" found in SESSION_FIELDS`
      ).toBe(false);
    });
  });

  it('SESSION_FIELDS Yandex group has the surfaced Yandex session fields', () => {
    // yandex_only_music and yandex_stick_to_artist are hidden from UI
    const yandexGroup = SESSION_FIELDS.filter(
      (f) => f.group === 'session-yandex'
    ).map((f) => f.key);
    const expected = [
      'yandex_quality',
      'yandex_lyrics_format',
      'yandex_cover_resolution',
      'yandex_embed_cover',
      'yandex_skip_existing',
      'yandex_clear_comments',
    ];
    expect(yandexGroup.sort()).toEqual(expected.slice().sort());
  });

  it('SESSION_FIELDS yt-dlp group has ytdlp_format and ytdlp_quality', () => {
    const ytdlpGroup = SESSION_FIELDS.filter(
      (f) => f.group === 'session-ytdlp'
    ).map((f) => f.key);
    expect(ytdlpGroup.sort()).toEqual(['ytdlp_format', 'ytdlp_quality'].sort());
  });
});

describe('choice arrays', () => {
  it('YANDEX_QUALITY_CHOICES has values 0, 1, 2', () => {
    expect(YANDEX_QUALITY_CHOICES.map((c) => c.value)).toEqual(['0', '1', '2']);
  });

  it('LYRICS_CHOICES has values none, text, lrc', () => {
    expect(LYRICS_CHOICES.map((c) => c.value)).toEqual(['none', 'text', 'lrc']);
  });

  it('YTDLP_FORMAT_CHOICES has the 4 supported formats: best, opus, m4a, mp3', () => {
    const expected = ['best', 'opus', 'm4a', 'mp3'];
    expect(YTDLP_FORMAT_CHOICES.map((c) => c.value)).toEqual(expected);
  });

  it('COMPAT_LEVEL_CHOICES has values 0 and 1', () => {
    expect(COMPAT_LEVEL_CHOICES.map((c) => c.value)).toEqual(['0', '1']);
  });
});

describe('accessor helpers', () => {
  it('fieldsForSection("sources") returns only sources fields', () => {
    const result = fieldsForSection('sources');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((f) => expect(f.section).toBe('sources'));
  });

  it('fieldsForSection("download") returns only download fields', () => {
    const result = fieldsForSection('download');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((f) => expect(f.section).toBe('download'));
  });

  it('fieldsForGroup("download", "dl-yandex") returns Yandex download fields', () => {
    const result = fieldsForGroup('download', 'dl-yandex');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((f) => {
      expect(f.section).toBe('download');
      expect(f.group).toBe('dl-yandex');
    });
    const keys = result.map((f) => f.key);
    expect(keys).toContain('yandex_quality');
    expect(keys).toContain('yandex_embed_cover');
  });

  it('fieldsForGroup("download", "dl-ytdlp") returns yt-dlp download fields', () => {
    const result = fieldsForGroup('download', 'dl-ytdlp');
    const keys = result.map((f) => f.key);
    expect(keys).toContain('ytdlp_format');
    expect(keys).toContain('ytdlp_quality');
  });

  it('fieldsForSourceCard("yandex") returns only yandex source card fields', () => {
    const result = fieldsForSourceCard('yandex');
    expect(result.length).toBeGreaterThan(0);
    result.forEach((f) => expect(f.sourceCard).toBe('yandex'));
    const keys = result.map((f) => f.key);
    expect(keys).toContain('enable_yandex');
    expect(keys).toContain('yandex_token');
  });

  it('fieldsForSourceCard("youtube") returns YouTube fields', () => {
    const keys = fieldsForSourceCard('youtube').map((f) => f.key);
    expect(keys).toContain('enable_youtube_music');
    // ytmusic_oauth_file moved to environment section (readonly, no sourceCard)
    expect(keys).not.toContain('ytmusic_oauth_file');
    expect(keys).toContain('ytmusic_client_id');
    expect(keys).toContain('ytmusic_client_secret');
  });

  it('fieldsForSourceCard("soundcloud") returns enable_soundcloud', () => {
    const keys = fieldsForSourceCard('soundcloud').map((f) => f.key);
    expect(keys).toContain('enable_soundcloud');
  });

  it('fieldsForSourceCard("bandcamp") returns enable_bandcamp', () => {
    const keys = fieldsForSourceCard('bandcamp').map((f) => f.key);
    expect(keys).toContain('enable_bandcamp');
    keys.forEach((k) => expect(k).toBe('enable_bandcamp'));
  });

  it('sessionFieldsForGroup("session-yandex") returns Yandex session fields', () => {
    const result = sessionFieldsForGroup('session-yandex');
    result.forEach((f) => expect(f.group).toBe('session-yandex'));
    expect(result.map((f) => f.key)).toContain('yandex_quality');
  });

  it('sessionFieldsForGroup("session-ytdlp") returns yt-dlp session fields', () => {
    const result = sessionFieldsForGroup('session-ytdlp');
    result.forEach((f) => expect(f.group).toBe('session-ytdlp'));
    expect(result.map((f) => f.key)).toContain('ytdlp_format');
  });

  it('fieldsForSection("environment") returns the four read-only container-setup keys', () => {
    const result = fieldsForSection('environment');
    const keys = result.map((f) => f.key);
    expect(keys).toContain('ytmusic_oauth_file');
    expect(keys).toContain('ytdlp_cookies_file');
    expect(keys).toContain('lidarr_import_path');
    expect(keys).toContain('library_map');
    expect(keys.length).toBe(4);
  });

  it('all environment fields have control "readonly"', () => {
    fieldsForSection('environment').forEach(({ key, control }) => {
      expect(control, `${key} should be readonly`).toBe('readonly');
    });
  });
});
