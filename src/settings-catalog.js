/* Settings presentation catalog — maps backend registry keys → UI controls.
 *
 * This is the only place that knows backend key → control type, label, group,
 * choices, hints. Components read from here; they never hard-code key names.
 *
 * Backend registry is the source of truth for keys, types, scope, and provider.
 * This catalog only adds UI metadata: control type, label/hint i18n keys, order.
 */

// ── Sections ────────────────────────────────────────────────────────────────

export const SETTINGS_SECTIONS = [
  { id: 'sources', labelKey: 'nav_sources' },
  { id: 'lidarr', labelKey: 'nav_lidarr' },
  { id: 'download', labelKey: 'nav_download' },
  { id: 'advanced', labelKey: 'nav_advanced' },
  { id: 'environment', labelKey: 'nav_environment' },
];

// ── Yandex quality choices ──────────────────────────────────────────────────

export const YANDEX_QUALITY_CHOICES = [
  { value: '0', label: 'AAC 64' },
  { value: '1', label: 'AAC 192' },
  { value: '2', labelKey: 'format_flac' },
];

// ── Lyrics format choices ───────────────────────────────────────────────────

export const LYRICS_CHOICES = [
  { value: 'none', labelKey: 'lyr_none' },
  { value: 'text', labelKey: 'lyr_text' },
  { value: 'lrc', labelKey: 'lyr_lrc' },
];

// ── yt-dlp format choices ───────────────────────────────────────────────────

export const YTDLP_FORMAT_CHOICES = [
  { value: 'best', labelKey: 'ytdlp_fmt_best' },
  { value: 'opus', label: 'OPUS' },
  { value: 'm4a', label: 'M4A' },
  { value: 'mp3', label: 'MP3' },
];

// ── Compat level choices ────────────────────────────────────────────────────

export const COMPAT_LEVEL_CHOICES = [
  { value: '0', label: '0' },
  { value: '1', label: '1' },
];

// ── Log level choices (Python logging levels) ────────────────────────────────

export const LOG_LEVEL_CHOICES = [
  { value: 'DEBUG', label: 'DEBUG' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARNING', label: 'WARNING' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'CRITICAL', label: 'CRITICAL' },
];

// ── Main settings fields catalog ─────────────────────────────────────────────
//
// Each entry: { key, control, labelKey, section, group, sourceCard?,
//               choices?, hintKey?, unit? }
//
// control ∈ {toggle, segmented, select, text, number, coverResolution, secret}
// group: UI sub-group within a section (used for dl-group rendering)
// sourceCard: for the 'sources' section — which provider card (yandex/youtube/soundcloud/bandcamp)

export const SETTINGS_FIELDS = [
  // ── Sources — Yandex card ─────────────────────────────────────────────────
  {
    key: 'enable_yandex',
    control: 'toggle',
    labelKey: 'enabled',
    section: 'sources',
    group: 'sources',
    sourceCard: 'yandex',
  },
  {
    key: 'yandex_token',
    control: 'secret',
    labelKey: 'sec_token',
    section: 'sources',
    group: 'sources',
    sourceCard: 'yandex',
  },

  // ── Sources — YouTube Music card ──────────────────────────────────────────
  {
    key: 'enable_youtube_music',
    control: 'toggle',
    labelKey: 'enabled',
    section: 'sources',
    group: 'sources',
    sourceCard: 'youtube',
  },
  {
    key: 'ytmusic_client_id',
    control: 'text',
    labelKey: 'yt_client_id',
    section: 'sources',
    group: 'sources',
    sourceCard: 'youtube',
  },
  {
    key: 'ytmusic_client_secret',
    control: 'secret',
    labelKey: 'yt_client_secret',
    section: 'sources',
    group: 'sources',
    sourceCard: 'youtube',
  },

  // ── Sources — SoundCloud card ─────────────────────────────────────────────
  {
    key: 'enable_soundcloud',
    control: 'toggle',
    labelKey: 'enabled',
    section: 'sources',
    group: 'sources',
    sourceCard: 'soundcloud',
  },
  {
    key: 'soundcloud_include_playlists',
    control: 'toggle',
    labelKey: 'sc_include_playlists',
    hintKey: 'sc_include_playlists_hint',
    section: 'sources',
    group: 'sources',
    sourceCard: 'soundcloud',
  },

  // ── Sources — Bandcamp card ───────────────────────────────────────────────
  {
    key: 'enable_bandcamp',
    control: 'toggle',
    labelKey: 'enabled',
    section: 'sources',
    group: 'sources',
    sourceCard: 'bandcamp',
  },

  // ── Lidarr ────────────────────────────────────────────────────────────────
  {
    key: 'lidarr_url',
    control: 'text',
    labelKey: 'lidarr_url',
    section: 'lidarr',
    group: 'lidarr',
  },
  {
    key: 'lidarr_api_key',
    control: 'secret',
    labelKey: 'lidarr_apikey',
    section: 'lidarr',
    group: 'lidarr',
  },

  // ── Download — Yandex group ───────────────────────────────────────────────
  {
    key: 'yandex_quality',
    control: 'segmented',
    labelKey: 'dl_yandex_quality',
    choices: YANDEX_QUALITY_CHOICES,
    section: 'download',
    group: 'dl-yandex',
  },
  {
    key: 'yandex_lyrics_format',
    control: 'segmented',
    labelKey: 'dl_lyrics',
    choices: LYRICS_CHOICES,
    hintKey: 'dl_lyrics_yandex_note',
    section: 'download',
    group: 'dl-yandex',
  },
  {
    key: 'yandex_cover_resolution',
    control: 'coverResolution',
    labelKey: 'dl_cover_res',
    max: 10000,
    section: 'download',
    group: 'dl-yandex',
  },
  {
    key: 'yandex_embed_cover',
    control: 'toggle',
    labelKey: 'dl_embed',
    section: 'download',
    group: 'dl-yandex',
  },
  {
    key: 'yandex_skip_existing',
    control: 'toggle',
    labelKey: 'dl_skip',
    section: 'download',
    group: 'dl-yandex',
  },
  {
    key: 'yandex_clear_comments',
    control: 'toggle',
    labelKey: 'dl_clear_comments',
    hintKey: 'dl_clear_comments_hint',
    section: 'download',
    group: 'dl-yandex',
  },

  // ── Download — yt-dlp group ───────────────────────────────────────────────
  {
    key: 'ytdlp_format',
    control: 'select',
    labelKey: 'dl_ytdlp_format',
    choices: YTDLP_FORMAT_CHOICES,
    section: 'download',
    group: 'dl-ytdlp',
  },
  {
    key: 'ytdlp_quality',
    control: 'number',
    labelKey: 'dl_ytdlp_quality',
    unit: 'units_kbps',
    min: 0,
    max: 2000,
    section: 'download',
    group: 'dl-ytdlp',
  },

  // ── Advanced — Yandex low-level ──────────────────────────────────────────
  {
    key: 'yandex_delay',
    control: 'number',
    labelKey: 'adv_request_delay',
    unit: 'units_s',
    min: 0,
    max: 600,
    section: 'advanced',
    group: 'adv-yandex',
  },
  {
    key: 'yandex_compat_level',
    control: 'segmented',
    labelKey: 'adv_compat',
    hintKey: 'adv_compat_hint',
    choices: COMPAT_LEVEL_CHOICES,
    section: 'advanced',
    group: 'adv-yandex',
  },
  {
    key: 'yandex_unsafe_path',
    control: 'toggle',
    labelKey: 'adv_unsafe_path',
    hintKey: 'adv_unsafe_hint',
    section: 'advanced',
    group: 'adv-yandex',
  },

  // ── Advanced — yt-dlp ────────────────────────────────────────────────────
  {
    key: 'ytdlp_retries',
    control: 'number',
    labelKey: 'adv_ytdlp_retries',
    min: 1,
    max: 100,
    section: 'advanced',
    group: 'adv-ytdlp',
  },

  // ── Advanced — Network (Yandex) ───────────────────────────────────────────
  {
    key: 'yandex_net_timeout',
    control: 'number',
    labelKey: 'adv_timeout',
    unit: 'units_s',
    min: 1,
    max: 600,
    section: 'advanced',
    group: 'adv-network',
  },
  {
    key: 'yandex_net_tries',
    control: 'number',
    labelKey: 'adv_tries',
    min: 1,
    max: 100,
    section: 'advanced',
    group: 'adv-network',
  },
  {
    key: 'yandex_net_retry_delay',
    control: 'number',
    labelKey: 'adv_retry_delay',
    unit: 'units_s',
    min: 0,
    max: 600,
    section: 'advanced',
    group: 'adv-network',
  },

  // ── Advanced — Application (server-wide) ──────────────────────────────────
  {
    key: 'app_log_level',
    control: 'select',
    labelKey: 'adv_log_level',
    choices: LOG_LEVEL_CHOICES,
    hintKey: 'adv_log_level_hint',
    section: 'advanced',
    group: 'adv-app',
  },

  // ── Environment — container-setup keys (read-only, informational) ─────────
  {
    key: 'ytmusic_oauth_file',
    control: 'readonly',
    labelKey: 'yt_oauth_path',
    section: 'environment',
    group: 'environment',
  },
  {
    key: 'ytdlp_cookies_file',
    control: 'readonly',
    labelKey: 'adv_cookies',
    section: 'environment',
    group: 'environment',
  },
  {
    key: 'lidarr_import_path',
    control: 'readonly',
    labelKey: 'lidarr_import',
    section: 'environment',
    group: 'environment',
  },
  {
    key: 'library_map',
    control: 'readonly',
    labelKey: 'lidarr_map',
    section: 'environment',
    group: 'environment',
  },
];

// ── Session fields — all Tier-3 (scope=session) keys for "This run" panel ───
//
// Grouped: yandex / ytdlp (matches backend provider tagging).
// Each entry: { key, control, labelKey, choices?, unit? }

export const SESSION_FIELDS = [
  // Yandex group
  {
    key: 'yandex_quality',
    control: 'segmented',
    labelKey: 'dl_yandex_quality',
    choices: YANDEX_QUALITY_CHOICES,
    group: 'session-yandex',
  },
  {
    key: 'yandex_lyrics_format',
    control: 'segmented',
    labelKey: 'dl_lyrics',
    choices: LYRICS_CHOICES,
    group: 'session-yandex',
  },
  {
    key: 'yandex_cover_resolution',
    control: 'coverResolution',
    labelKey: 'dl_cover_res',
    max: 10000,
    group: 'session-yandex',
  },
  {
    key: 'yandex_embed_cover',
    control: 'toggle',
    labelKey: 'dl_embed',
    group: 'session-yandex',
  },
  {
    key: 'yandex_skip_existing',
    control: 'toggle',
    labelKey: 'dl_skip',
    group: 'session-yandex',
  },
  {
    key: 'yandex_clear_comments',
    control: 'toggle',
    labelKey: 'dl_clear_comments',
    group: 'session-yandex',
  },

  // yt-dlp group
  {
    key: 'ytdlp_format',
    control: 'select',
    labelKey: 'dl_ytdlp_format',
    choices: YTDLP_FORMAT_CHOICES,
    group: 'session-ytdlp',
  },
  {
    key: 'ytdlp_quality',
    control: 'number',
    labelKey: 'dl_ytdlp_quality',
    unit: 'units_kbps',
    min: 0,
    max: 2000,
    group: 'session-ytdlp',
  },
];

// ── Accessors ────────────────────────────────────────────────────────────────

export function fieldsForSection(sectionId) {
  return SETTINGS_FIELDS.filter((f) => f.section === sectionId);
}

export function fieldsForGroup(sectionId, groupId) {
  return SETTINGS_FIELDS.filter(
    (f) => f.section === sectionId && f.group === groupId
  );
}

export function fieldsForSourceCard(cardId) {
  return SETTINGS_FIELDS.filter((f) => f.sourceCard === cardId);
}

export function sessionFieldsForGroup(groupId) {
  return SESSION_FIELDS.filter((f) => f.group === groupId);
}

// All known control types — used by tests to verify no stray values.
export const KNOWN_CONTROLS = [
  'toggle',
  'segmented',
  'select',
  'text',
  'number',
  'coverResolution',
  'secret',
  'readonly',
];
