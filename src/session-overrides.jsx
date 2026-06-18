/* "This run" per-run override panel.
 *
 * Collapsible panel shown above SelectStep. Pre-filled from the global resolved
 * defaults (committed); any change is marked "overridden for this run" and
 * never touches the saved global layer.
 *
 * Props:
 *   t            — I18N[lang] translations
 *   committed    — { [key]: SettingItem } index from GET /api/settings
 *   overrides    — { [key]: string } caller-owned state
 *   setOverrides — React state setter (accepts updater functions)
 */

import { useState } from 'react';
import { Icon } from './icons';
import { SESSION_FIELDS, sessionFieldsForGroup } from './settings-catalog';
import {
  strToBool,
  boolToStr,
  coverResToUi,
  uiToCoverRes,
  isLosslessYtdlp,
  typeError,
} from './settings-helpers';
import {
  Segmented,
  Select,
  NumberUnit,
  CoverResolution,
  Toggle,
} from './settings-fields';

export function ThisRunPanel({ t, committed, overrides, setOverrides }) {
  const [open, setOpen] = useState(false);

  const globalVal = (key) => committed[key]?.value ?? null;
  const runVal = (key) =>
    Object.prototype.hasOwnProperty.call(overrides, key)
      ? overrides[key]
      : globalVal(key);
  const isOverridden = (key) =>
    Object.prototype.hasOwnProperty.call(overrides, key) &&
    overrides[key] !== globalVal(key);
  const setRun = (key, v) => setOverrides((o) => ({ ...o, [key]: v }));
  const resetRun = (key) =>
    setOverrides((o) => {
      const n = { ...o };
      delete n[key];
      return n;
    });

  const overriddenCount = SESSION_FIELDS.filter((f) =>
    isOverridden(f.key)
  ).length;

  const effectiveFormat = runVal('ytdlp_format');
  const qualityDisabled = isLosslessYtdlp(effectiveFormat);

  // Plain render helpers — not React components — to avoid remounting on
  // re-render, which would make fireEvent DOM references stale.

  const ERR_MSG = {
    number: t.err_number,
    option: t.err_option,
    cover: t.err_cover,
  };

  const renderField = (field) => {
    const { key, control, choices, labelKey, unit } = field;
    const label = t[labelKey] ?? labelKey;
    const unitLabel = unit ? t[unit] : undefined;
    const ov = isOverridden(key);

    // Minimal type-derived validation (same rules as the global screen).
    // A disabled quality field (lossless format) is never flagged.
    const numericDisabled = key === 'ytdlp_quality' && qualityDisabled;
    const errCode =
      committed[key] && !numericDisabled
        ? typeError(committed[key].type, runVal(key), {
            min: field.min,
            max: field.max,
            choices: (choices || []).map((c) => c.value),
          })
        : null;
    const errText = errCode ? (ERR_MSG[errCode] ?? t.err_number) : null;

    if (control === 'toggle') {
      return (
        <div key={key} className={`toggle-row${ov ? ' overridden' : ''}`}>
          <div className="toggle-row-meta">
            <div className="toggle-row-top">
              <span className="field-label">{label}</span>
              {ov && <span className="ovr-badge">{t.overridden}</span>}
              {ov && (
                <button
                  type="button"
                  className="reset-btn"
                  title={t.reset_default}
                  onClick={() => resetRun(key)}
                >
                  ↺
                </button>
              )}
            </div>
          </div>
          <Toggle
            value={strToBool(runVal(key))}
            onChange={(v) => setRun(key, boolToStr(v))}
          />
        </div>
      );
    }

    const fieldJsx = (() => {
      if (control === 'segmented') {
        return (
          <Segmented
            value={runVal(key) ?? ''}
            options={choices}
            onChange={(v) => setRun(key, v)}
            t={t}
          />
        );
      }

      if (control === 'select') {
        return (
          <Select
            value={runVal(key) ?? ''}
            options={choices}
            onChange={(v) => setRun(key, v)}
            t={t}
          />
        );
      }

      if (control === 'number') {
        return (
          <NumberUnit
            value={runVal(key) ?? ''}
            unit={unitLabel}
            disabled={numericDisabled}
            error={!!errCode}
            onChange={(v) => setRun(key, v === '' ? '' : String(v))}
          />
        );
      }

      if (control === 'coverResolution') {
        return (
          <CoverResolution
            value={coverResToUi(runVal(key))}
            t={t}
            error={!!errCode}
            max={field.max}
            onChange={(uiVal) => setRun(key, uiToCoverRes(uiVal))}
          />
        );
      }

      return null;
    })();

    if (!fieldJsx) return null;

    return (
      <div key={key} className={`field${ov ? ' overridden' : ''}`}>
        <div className="field-top">
          <span className="field-label">{label}</span>
          {ov && <span className="ovr-badge">{t.overridden}</span>}
          {ov && (
            <button
              type="button"
              className="reset-btn"
              title={t.reset_default}
              onClick={() => resetRun(key)}
            >
              ↺
            </button>
          )}
        </div>
        <div className="field-control">{fieldJsx}</div>
        {errText && (
          <div className="field-error">
            <Icon name="alert" size={13} />
            <span>{errText}</span>
          </div>
        )}
      </div>
    );
  };

  const yandexFields = sessionFieldsForGroup('session-yandex');
  const ytdlpFields = sessionFieldsForGroup('session-ytdlp');

  return (
    <div className={`this-run${open ? ' open' : ''}`}>
      <button className="this-run-head" onClick={() => setOpen((o) => !o)}>
        <div className="tr-icon">
          <Icon name="cog" size={16} />
        </div>
        <div>
          <div className="tr-title">{t.this_run}</div>
          <div className="tr-sub">{t.this_run_open}</div>
        </div>
        {overriddenCount > 0 && (
          <span className="tr-count">{overriddenCount}</span>
        )}
        <Icon name="chevronDown" size={16} className="chev" />
      </button>

      {open && (
        <div className="this-run-body">
          <div className="this-run-banner">
            <Icon name="alert" size={14} />
            <span>{t.this_run_banner}</span>
          </div>

          <div
            className="dl-group"
            style={{ '--gh-accent': 'var(--src-yandex)' }}
          >
            <div className="dl-group-head">
              <span className="gh-dot"></span>
              <span className="gh-name">{t.dl_group_yandex}</span>
            </div>
            <div className="field-grid">
              {yandexFields
                .filter((f) => f.control !== 'toggle')
                .map(renderField)}
            </div>
            <div className="toggle-grid">
              {yandexFields
                .filter((f) => f.control === 'toggle')
                .map(renderField)}
            </div>
          </div>

          <div
            className="dl-group"
            style={{ '--gh-accent': 'var(--src-youtube)' }}
          >
            <div className="dl-group-head">
              <span className="gh-dot"></span>
              <span className="gh-name">{t.dl_group_ytdlp}</span>
            </div>
            <div className="field-grid">{ytdlpFields.map(renderField)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
