/* Settings screen — global settings editor.
 *
 * Props:
 *   t               — I18N[lang] translations
 *   lang            — 'en' | 'ru'
 *   committed       — { [key]: SettingItem } index from GET /api/settings
 *   encryptionReady — boolean from config.encryption_enabled
 *   onSave(puts, deletes) — async; called with the diff; throws on API error
 *   onBack          — navigate back to the main app flow
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Icon } from './icons';
import { I18N_FNS } from './i18n';
import {
  SETTINGS_SECTIONS,
  SETTINGS_FIELDS,
  fieldsForSection,
  fieldsForGroup,
} from './settings-catalog';
import {
  effectiveValue,
  effectiveSource,
  diffDraft,
  dirtyKeys,
  boolToStr,
  strToBool,
  coverResToUi,
  uiToCoverRes,
  isLosslessYtdlp,
  displayValue,
  libraryMapToUi,
  uiToLibraryMap,
  libraryMapError,
  urlError,
  typeError,
} from './settings-helpers';
import {
  Field,
  ToggleRow,
  Toggle,
  Segmented,
  Select,
  TextInput,
  NumberUnit,
  CoverResolution,
  SecretField,
  OriginBadge,
  ResetBtn,
} from './settings-fields';

export function SettingsScreen({
  t,
  lang,
  committed,
  encryptionReady,
  onSave,
  onBack,
}) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState({});
  const [resetKeys, setResetKeys] = useState(new Set());
  const [active, setActive] = useState('sources');
  const [advOpen, setAdvOpen] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Display state for the library_map textarea while the user is actively editing.
  // draft.library_map stores the wire form (comma-separated); libMapInput is the UI form.
  const [libMapInput, setLibMapInput] = useState(() =>
    libraryMapToUi(committed.library_map?.value ?? '')
  );

  // Derive displayed text from committed when not being edited, from input state when edited.
  // This avoids setState-in-effect: committed changes (after save/reload) are reflected
  // automatically because this reads committed directly.
  const libMapText = Object.prototype.hasOwnProperty.call(draft, 'library_map')
    ? libMapInput
    : libraryMapToUi(committed.library_map?.value ?? '');

  // ── Field helpers ──────────────────────────────────────────────────────────

  const effVal = useCallback(
    (key) => effectiveValue(committed[key], draft, key),
    [committed, draft]
  );

  const effSrc = useCallback(
    (key) => effectiveSource(committed[key], draft, resetKeys, key),
    [committed, draft, resetKeys]
  );

  const canReset = useCallback(
    (key) => committed[key]?.source === 'db' && !resetKeys.has(key),
    [committed, resetKeys]
  );

  const setField = useCallback((key, stringValue) => {
    setResetKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setDraft((d) => ({ ...d, [key]: stringValue }));
    setSaveError(null);
  }, []);

  const resetField = useCallback((key) => {
    setDraft((d) => {
      if (!Object.prototype.hasOwnProperty.call(d, key)) return d;
      const next = { ...d };
      delete next[key];
      return next;
    });
    setResetKeys((prev) => new Set([...prev, key]));
    setSaveError(null);
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  // Localized messages for the type-derived error codes from typeError().
  const errMsg = useMemo(
    () => ({ number: t.err_number, option: t.err_option, cover: t.err_cover }),
    [t]
  );

  const errors = useMemo(() => {
    const errs = {};

    // Specialized string validators — stricter than the bare `str` type.
    if (urlError(effVal('lidarr_url'))) errs.lidarr_url = t.err_url;
    if (libraryMapError(libMapText)) errs.library_map = t.err_map;

    // Minimal validation derived from the backend-provided type for every
    // surfaced field (int bounds, enum membership, cover_resolution shape).
    for (const field of SETTINGS_FIELDS) {
      const item = committed[field.key];
      if (!item) continue;
      const code = typeError(item.type, effVal(field.key), {
        min: field.min,
        max: field.max,
        choices: (field.choices || []).map((c) => c.value),
      });
      if (code) errs[field.key] = errMsg[code] ?? t.err_number;
    }

    return errs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, libMapText, committed, t]);

  const hasErrors = Object.keys(errors).length > 0;

  // ── Dirty state ────────────────────────────────────────────────────────────

  const dirty = dirtyKeys(committed, draft, resetKeys);
  const isDirty = dirty.size > 0;

  // ── Yandex warning ─────────────────────────────────────────────────────────

  const yandexOn = strToBool(effVal('enable_yandex'));
  const yandexTokenItem = committed.yandex_token;
  const yandexTokenUnset =
    !yandexTokenItem?.is_set &&
    !Object.prototype.hasOwnProperty.call(draft, 'yandex_token');
  const yandexNeedsToken = yandexOn && encryptionReady && yandexTokenUnset;

  // ── Section refs + scroll-spy ──────────────────────────────────────────────

  const sourcesRef = useRef(null);
  const lidarrRef = useRef(null);
  const downloadRef = useRef(null);
  const advancedRef = useRef(null);

  // Stable map: id → ref object (built once; no render-time ref access)
  const sectionRefMap = useRef({
    sources: sourcesRef,
    lidarr: lidarrRef,
    download: downloadRef,
    advanced: advancedRef,
  });

  useEffect(() => {
    const ids = ['sources', 'lidarr', 'download', 'advanced'];
    const refs = sectionRefMap.current;
    const onScroll = () => {
      let current = 'sources';
      for (const id of ids) {
        const el = refs[id].current;
        if (el && el.getBoundingClientRect().top < 140) current = id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setActive(id);
    const el = sectionRefMap.current[id].current;
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 86,
        behavior: 'smooth',
      });
    }
  };

  // ── Save / Discard ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (hasErrors || !isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { puts, deletes } = diffDraft(committed, draft, resetKeys);
      await onSave(puts, deletes);
      setDraft({});
      setResetKeys(new Set());
      // libMapText syncs via useEffect when committed updates after reload
    } catch (err) {
      setSaveError(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft({});
    setResetKeys(new Set());
    setLibMapInput(libraryMapToUi(committed.library_map?.value ?? ''));
    setSaveError(null);
  };

  // ── Generic field renderer ─────────────────────────────────────────────────

  const renderField = (field) => {
    const { key, control, choices } = field;
    const committedItem = committed[key];
    const value = effVal(key);
    const source = effSrc(key);
    const can_reset = canReset(key);
    const error = errors[key];
    const label = t[field.labelKey] ?? field.labelKey;
    const hint = field.hintKey ? t[field.hintKey] : undefined;
    const unit = field.unit ? t[field.unit] : undefined;

    const onChange = (stringVal) => setField(key, stringVal);
    const onReset = () => resetField(key);

    if (control === 'toggle') {
      return (
        <ToggleRow
          key={key}
          label={label}
          source={source}
          t={t}
          canReset={can_reset}
          onReset={onReset}
          value={strToBool(value)}
          onChange={(v) => onChange(boolToStr(v))}
          hint={hint}
        />
      );
    }

    if (control === 'segmented') {
      return (
        <Field
          key={key}
          label={label}
          source={source}
          t={t}
          canReset={can_reset}
          onReset={onReset}
          hint={hint}
          error={error}
        >
          <Segmented
            value={value ?? ''}
            options={choices}
            onChange={onChange}
            t={t}
          />
        </Field>
      );
    }

    if (control === 'select') {
      return (
        <Field
          key={key}
          label={label}
          source={source}
          t={t}
          canReset={can_reset}
          onReset={onReset}
          hint={hint}
          error={error}
        >
          <Select
            value={value ?? ''}
            options={choices}
            onChange={onChange}
            t={t}
          />
        </Field>
      );
    }

    if (control === 'number') {
      // ytdlp_quality: disabled when format is lossless
      const lossless =
        key === 'ytdlp_quality' && isLosslessYtdlp(effVal('ytdlp_format'));
      return (
        <Field
          key={key}
          label={label}
          source={source}
          t={t}
          canReset={can_reset}
          onReset={onReset}
          hint={hint}
          error={lossless ? undefined : error}
          disabled={lossless}
        >
          <NumberUnit
            value={lossless ? '' : (value ?? '')}
            unit={unit}
            disabled={lossless}
            error={!lossless && !!error}
            onChange={(n) => onChange(n === '' ? '' : String(n))}
          />
        </Field>
      );
    }

    if (control === 'coverResolution') {
      const coverVal = coverResToUi(value);
      return (
        <Field
          key={key}
          label={label}
          source={source}
          t={t}
          canReset={can_reset}
          onReset={onReset}
          hint={hint}
          error={error}
        >
          <CoverResolution
            value={coverVal}
            t={t}
            error={!!error}
            max={field.max}
            onChange={(uiVal) => onChange(uiToCoverRes(uiVal))}
          />
        </Field>
      );
    }

    if (control === 'secret') {
      return (
        <Field key={key} label={label} source={null} t={t} canReset={false}>
          <SecretField
            committedItem={committedItem}
            draftValue={draft[key] ?? null}
            encryptionReady={encryptionReady}
            t={t}
            onSet={(v) => setField(key, v)}
            onClear={() => resetField(key)}
          />
        </Field>
      );
    }

    // text — with special handling for library_map
    if (key === 'library_map') {
      return (
        <Field
          key={key}
          label={label}
          source={source}
          t={t}
          canReset={can_reset}
          onReset={onReset}
          hint={hint}
          error={error}
        >
          <textarea
            className={`set-input mono${error ? ' invalid' : ''}`}
            value={libMapText}
            rows={3}
            placeholder="/lidarr/path = /albfetcharr/path"
            onChange={(e) => {
              const text = e.target.value;
              setLibMapInput(text);
              setField('library_map', uiToLibraryMap(text));
            }}
          />
        </Field>
      );
    }

    // generic text
    return (
      <Field
        key={key}
        label={label}
        source={source}
        t={t}
        canReset={can_reset}
        onReset={onReset}
        hint={hint}
        error={error}
      >
        <TextInput
          value={displayValue(value)}
          mono
          error={!!error}
          onChange={(v) => onChange(v)}
        />
      </Field>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const youtubeOn = strToBool(effVal('enable_youtube_music'));
  const soundcloudOn = strToBool(effVal('enable_soundcloud'));
  const ytdlpFormat = effVal('ytdlp_format');

  const dlYandexToggles = fieldsForGroup('download', 'dl-yandex').filter(
    (f) => f.control === 'toggle'
  );
  const dlYandexNonToggles = fieldsForGroup('download', 'dl-yandex').filter(
    (f) => f.control !== 'toggle'
  );

  const advYandexFields = fieldsForGroup('advanced', 'adv-yandex');
  const advYtdlpFields = fieldsForGroup('advanced', 'adv-ytdlp');
  const advNetworkFields = fieldsForGroup('advanced', 'adv-network');
  const advAppFields = fieldsForGroup('advanced', 'adv-app');

  return (
    <>
      <button className="back-link" onClick={onBack}>
        <Icon name="chevronLeft" size={14} />
        {t.back_to_app}
      </button>

      <div className="settings-head">
        <div>
          <h2>{t.settings}</h2>
          <div className="sub">{t.settings_sub}</div>
        </div>
      </div>

      <div className="settings-layout">
        {/* Section nav */}
        <nav className="settings-nav">
          {SETTINGS_SECTIONS.map((s, i) => (
            <button
              key={s.id}
              className={active === s.id ? 'on' : ''}
              onClick={() => scrollTo(s.id)}
            >
              <span className="nav-num">{i + 1}</span>
              {t[s.labelKey]}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {/* §1 Sources */}
          <section className="set-section" ref={sourcesRef}>
            <div className="set-section-head">
              <h3>{t.nav_sources}</h3>
            </div>
            <div className="set-section-body">
              {/* Yandex card */}
              <div
                className={`source-card${yandexOn ? '' : ' off'}`}
                style={{ '--src-accent': 'var(--src-yandex)' }}
              >
                <div className="source-card-head">
                  <div className="src-mark">
                    <Icon name="music" size={16} />
                  </div>
                  <div>
                    <div className="src-name">{t.yandex}</div>
                    <div className="src-sub">music.yandex.ru</div>
                  </div>
                  <div className="toggle-slot">
                    <OriginBadge source={effSrc('enable_yandex')} t={t} />
                    <ResetBtn
                      show={canReset('enable_yandex')}
                      title={t.reset_inherited}
                      onClick={() => resetField('enable_yandex')}
                    />
                    <Toggle
                      value={yandexOn}
                      onChange={(v) => setField('enable_yandex', boolToStr(v))}
                    />
                  </div>
                </div>
                {yandexOn && (
                  <div className="source-card-body">
                    {yandexNeedsToken && (
                      <div className="card-warn">
                        <Icon name="alert" size={15} />
                        <span>{t.yandex_warn}</span>
                      </div>
                    )}
                    <Field
                      label={t.sec_token}
                      source={null}
                      t={t}
                      canReset={false}
                    >
                      <SecretField
                        committedItem={committed.yandex_token}
                        draftValue={draft.yandex_token ?? null}
                        encryptionReady={encryptionReady}
                        t={t}
                        onSet={(v) => setField('yandex_token', v)}
                        onClear={() => resetField('yandex_token')}
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* YouTube Music card */}
              <div
                className={`source-card${youtubeOn ? '' : ' off'}`}
                style={{ '--src-accent': 'var(--src-youtube)' }}
              >
                <div className="source-card-head">
                  <div className="src-mark">
                    <Icon name="play" size={15} />
                  </div>
                  <div>
                    <div className="src-name">{t.youtube_music}</div>
                    <div className="src-sub">music.youtube.com</div>
                  </div>
                  <div className="toggle-slot">
                    <OriginBadge
                      source={effSrc('enable_youtube_music')}
                      t={t}
                    />
                    <ResetBtn
                      show={canReset('enable_youtube_music')}
                      title={t.reset_inherited}
                      onClick={() => resetField('enable_youtube_music')}
                    />
                    <Toggle
                      value={youtubeOn}
                      onChange={(v) =>
                        setField('enable_youtube_music', boolToStr(v))
                      }
                    />
                  </div>
                </div>
                {youtubeOn && (
                  <div className="source-card-body">
                    <Field
                      label={t.yt_oauth_path}
                      source={effSrc('ytmusic_oauth_file')}
                      t={t}
                      canReset={canReset('ytmusic_oauth_file')}
                      onReset={() => resetField('ytmusic_oauth_file')}
                      hint={t.yt_oauth_help}
                    >
                      <TextInput
                        value={displayValue(effVal('ytmusic_oauth_file'))}
                        mono
                        placeholder="/config/oauth.json"
                        onChange={(v) => setField('ytmusic_oauth_file', v)}
                      />
                    </Field>
                    <div className="field-grid">
                      <Field
                        label={t.yt_client_id}
                        source={effSrc('ytmusic_client_id')}
                        t={t}
                        canReset={canReset('ytmusic_client_id')}
                        onReset={() => resetField('ytmusic_client_id')}
                      >
                        <TextInput
                          value={displayValue(effVal('ytmusic_client_id'))}
                          mono
                          onChange={(v) => setField('ytmusic_client_id', v)}
                        />
                      </Field>
                      <Field
                        label={t.yt_client_secret}
                        source={null}
                        t={t}
                        canReset={false}
                      >
                        <SecretField
                          committedItem={committed.ytmusic_client_secret}
                          draftValue={draft.ytmusic_client_secret ?? null}
                          encryptionReady={encryptionReady}
                          t={t}
                          onSet={(v) => setField('ytmusic_client_secret', v)}
                          onClear={() => resetField('ytmusic_client_secret')}
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>

              {/* SoundCloud card */}
              <div
                className={`source-card${soundcloudOn ? '' : ' off'}`}
                style={{ '--src-accent': 'var(--src-soundcloud)' }}
              >
                <div className="source-card-head">
                  <div className="src-mark">
                    <Icon name="zap" size={15} />
                  </div>
                  <div>
                    <div className="src-name">{t.soundcloud}</div>
                    <div className="src-sub">{t.sc_only}</div>
                  </div>
                  <div className="toggle-slot">
                    <OriginBadge source={effSrc('enable_soundcloud')} t={t} />
                    <ResetBtn
                      show={canReset('enable_soundcloud')}
                      title={t.reset_inherited}
                      onClick={() => resetField('enable_soundcloud')}
                    />
                    <Toggle
                      value={soundcloudOn}
                      onChange={(v) =>
                        setField('enable_soundcloud', boolToStr(v))
                      }
                    />
                  </div>
                </div>
                {soundcloudOn && (
                  <div className="source-card-body">
                    <div className="field-hint">{t.sc_cookies_note}</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* §2 Lidarr */}
          <section className="set-section" ref={lidarrRef}>
            <div className="set-section-head">
              <h3>{t.nav_lidarr}</h3>
            </div>
            <div className="set-section-body">
              <div className="field-grid">
                <Field
                  label={t.lidarr_url}
                  source={effSrc('lidarr_url')}
                  t={t}
                  canReset={canReset('lidarr_url')}
                  onReset={() => resetField('lidarr_url')}
                  error={errors.lidarr_url}
                >
                  <TextInput
                    value={displayValue(effVal('lidarr_url'))}
                    mono
                    placeholder="http://lidarr:8686"
                    error={!!errors.lidarr_url}
                    onChange={(v) => setField('lidarr_url', v)}
                  />
                </Field>
                <Field
                  label={t.lidarr_apikey}
                  source={null}
                  t={t}
                  canReset={false}
                >
                  <SecretField
                    committedItem={committed.lidarr_api_key}
                    draftValue={draft.lidarr_api_key ?? null}
                    encryptionReady={encryptionReady}
                    t={t}
                    onSet={(v) => setField('lidarr_api_key', v)}
                    onClear={() => resetField('lidarr_api_key')}
                  />
                </Field>
                <Field
                  label={t.lidarr_import}
                  source={effSrc('lidarr_import_path')}
                  t={t}
                  canReset={canReset('lidarr_import_path')}
                  onReset={() => resetField('lidarr_import_path')}
                >
                  <TextInput
                    value={displayValue(effVal('lidarr_import_path'))}
                    mono
                    placeholder="/downloads"
                    onChange={(v) => setField('lidarr_import_path', v)}
                  />
                </Field>
              </div>
              {/* library_map rendered separately (textarea) */}
              {renderField(
                fieldsForSection('lidarr').find((f) => f.key === 'library_map')
              )}
            </div>
          </section>

          {/* §3 Download defaults */}
          <section className="set-section" ref={downloadRef}>
            <div className="set-section-head">
              <h3>{t.nav_download}</h3>
              <span className="sec-desc">{t.this_run_open}</span>
            </div>
            <div className="set-section-body">
              {/* Yandex Music group */}
              <div
                className="dl-group"
                style={{ '--gh-accent': 'var(--src-yandex)' }}
              >
                <div className="dl-group-head">
                  <span className="gh-dot"></span>
                  <span className="gh-name">{t.dl_group_yandex}</span>
                </div>
                <div className="field-grid">
                  {dlYandexNonToggles.map(renderField)}
                </div>
                <div className="toggle-grid">
                  {dlYandexToggles.map(renderField)}
                </div>
              </div>

              {/* yt-dlp group */}
              <div
                className="dl-group"
                style={{ '--gh-accent': 'var(--src-youtube)' }}
              >
                <div className="dl-group-head">
                  <span className="gh-dot"></span>
                  <span className="gh-name">{t.dl_group_ytdlp}</span>
                </div>
                <div className="field-grid">
                  {fieldsForGroup('download', 'dl-ytdlp').map((field) => {
                    const lossless =
                      field.key === 'ytdlp_quality' &&
                      isLosslessYtdlp(ytdlpFormat);
                    if (field.key === 'ytdlp_quality') {
                      const label = t[field.labelKey] ?? field.labelKey;
                      const unit = field.unit ? t[field.unit] : undefined;
                      const value = effVal(field.key);
                      return (
                        <Field
                          key={field.key}
                          label={label}
                          source={effSrc(field.key)}
                          t={t}
                          canReset={canReset(field.key)}
                          onReset={() => resetField(field.key)}
                          disabled={lossless}
                          error={lossless ? undefined : errors[field.key]}
                        >
                          <NumberUnit
                            value={lossless ? '' : (value ?? '')}
                            unit={unit}
                            disabled={lossless}
                            error={!lossless && !!errors[field.key]}
                            onChange={(n) =>
                              setField(field.key, n === '' ? '' : String(n))
                            }
                          />
                        </Field>
                      );
                    }
                    return renderField(field);
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* §4 Advanced (collapsible) */}
          <section className="set-section" ref={advancedRef}>
            <div className="set-section-head">
              <button
                className={`adv-toggle${advOpen ? ' open' : ''}`}
                onClick={() => setAdvOpen((o) => !o)}
              >
                <Icon name="chevronDown" size={15} />
                <h3 style={{ display: 'inline' }}>{t.nav_advanced}</h3>
              </button>
              {!advOpen && (
                <span className="sec-desc" style={{ marginLeft: 8 }}>
                  {t.show_advanced}
                </span>
              )}
            </div>
            {advOpen && (
              <div className="set-section-body">
                {/* Yandex low-level */}
                <div
                  className="dl-group"
                  style={{ '--gh-accent': 'var(--src-yandex)' }}
                >
                  <div className="dl-group-head">
                    <span className="gh-dot"></span>
                    <span className="gh-name">{t.dl_group_yandex}</span>
                  </div>
                  <div className="field-grid">
                    {advYandexFields
                      .filter((f) => f.control !== 'toggle')
                      .map(renderField)}
                  </div>
                  <div className="toggle-grid">
                    {advYandexFields
                      .filter((f) => f.control === 'toggle')
                      .map(renderField)}
                  </div>
                </div>

                {/* yt-dlp path + retries + cookies */}
                <div
                  className="dl-group"
                  style={{ '--gh-accent': 'var(--src-youtube)' }}
                >
                  <div className="dl-group-head">
                    <span className="gh-dot"></span>
                    <span className="gh-name">{t.dl_group_ytdlp}</span>
                  </div>
                  <div className="field-grid">
                    {advYtdlpFields.map(renderField)}
                  </div>
                </div>

                {/* Network */}
                <div className="dl-group">
                  <div className="dl-group-head">
                    <span className="gh-dot"></span>
                    <span className="gh-name">{t.adv_network}</span>
                  </div>
                  <div className="field-grid">
                    {advNetworkFields.map(renderField)}
                  </div>
                </div>

                {/* Application (server-wide) */}
                {advAppFields.length > 0 && (
                  <div className="dl-group">
                    <div className="dl-group-head">
                      <span className="gh-dot"></span>
                      <span className="gh-name">{t.dl_group_general}</span>
                    </div>
                    <div className="field-grid">
                      {advAppFields.map(renderField)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Sticky save/discard bar */}
      {(isDirty || hasErrors || saveError) && (
        <div className="save-bar">
          <div className={`save-status${isDirty ? '' : ' clean'}`}>
            <span className="dirty-dot"></span>
            <span>
              {isDirty && I18N_FNS.settingsUnsaved(lang, dirty.size)}
              {hasErrors && (
                <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                  · {Object.keys(errors).length} ⚠
                </span>
              )}
            </span>
          </div>
          {saveError && (
            <div className="save-error" role="alert">
              <Icon name="alert" size={13} />
              <span>{saveError}</span>
            </div>
          )}
          <div className="grow"></div>
          <button className="btn btn-ghost" onClick={handleDiscard}>
            {t.discard}
          </button>
          <button
            className="btn btn-primary"
            disabled={hasErrors || !isDirty || saving}
            onClick={handleSave}
          >
            <Icon name="check" size={14} />
            {saving ? '…' : t.save_changes}
          </button>
        </div>
      )}
    </>
  );
}
