/* Settings field controls — ESM, props-driven, no global state. */

import { useState } from 'react';
import { Icon } from './icons';
import { sourceToBadge } from './settings-helpers';

// ── Origin badge ─────────────────────────────────────────────────────────────

export function OriginBadge({ source, t }) {
  if (!source) return null;
  const badge = sourceToBadge(source);
  const label =
    badge === 'saved'
      ? t.origin_saved
      : badge === 'env'
        ? t.origin_env
        : t.origin_default;
  return <span className={`origin-badge ${badge}`}>{label}</span>;
}

// ── Reset button ─────────────────────────────────────────────────────────────

export function ResetBtn({ show, title, onClick }) {
  if (!show) return null;
  return (
    <button
      type="button"
      className="reset-btn"
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      ↺
    </button>
  );
}

// ── Stacked field: label + origin/reset on top, control below ────────────────

export function Field({
  label,
  source,
  t,
  canReset,
  onReset,
  hint,
  error,
  children,
  disabled,
}) {
  return (
    <div
      className={`field${disabled ? ' is-disabled' : ''}${error ? ' has-error' : ''}`}
    >
      <div className="field-top">
        <span className="field-label">{label}</span>
        <OriginBadge source={source} t={t} />
        <ResetBtn show={canReset} title={t.reset_inherited} onClick={onReset} />
      </div>
      <div className="field-control">{children}</div>
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && (
        <div className="field-error">
          <Icon name="alert" size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ── Inline toggle row: label left, switch right ───────────────────────────────

export function ToggleRow({
  label,
  source,
  t,
  canReset,
  onReset,
  value,
  onChange,
  hint,
  disabled,
}) {
  return (
    <div className={`toggle-row${disabled ? ' is-disabled' : ''}`}>
      <div className="toggle-row-meta">
        <div className="toggle-row-top">
          <span className="field-label">{label}</span>
          <OriginBadge source={source} t={t} />
          <ResetBtn
            show={canReset}
            title={t.reset_inherited}
            onClick={onReset}
          />
        </div>
        {hint && <div className="field-hint">{hint}</div>}
      </div>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

export function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      className="tgl"
      role="switch"
      aria-checked={!!value}
      data-on={value ? '1' : '0'}
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
    >
      <i></i>
    </button>
  );
}

// ── Segmented control ─────────────────────────────────────────────────────────
// options: [{value, label?, labelKey?}, ...] or plain string array.
// Pass t to resolve labelKey entries.

export function Segmented({ value, options, onChange, disabled, t }) {
  return (
    <div className={`seg${disabled ? ' is-disabled' : ''}`} role="radiogroup">
      {options.map((o) => {
        const val = typeof o === 'object' ? o.value : o;
        const lab =
          typeof o === 'object'
            ? o.label != null
              ? o.label
              : t && o.labelKey
                ? t[o.labelKey]
                : o.labelKey
            : o;
        return (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={val === value}
            className={val === value ? 'on' : ''}
            disabled={disabled}
            onClick={() => !disabled && onChange(val)}
          >
            {lab}
          </button>
        );
      })}
    </div>
  );
}

// ── Select (dropdown) ─────────────────────────────────────────────────────────
// options: [{value, label?, labelKey?}, ...].
// Pass t to resolve labelKey entries.

export function Select({ value, options, onChange, disabled, t }) {
  return (
    <select
      className="set-input"
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => {
        const val = typeof o === 'object' ? o.value : o;
        const lab =
          typeof o === 'object'
            ? o.label != null
              ? o.label
              : t && o.labelKey
                ? t[o.labelKey]
                : o.labelKey
            : o;
        return (
          <option key={val} value={val}>
            {lab}
          </option>
        );
      })}
    </select>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────

export function TextInput({
  value,
  onChange,
  placeholder,
  mono,
  greyed,
  error,
  disabled,
}) {
  return (
    <input
      type="text"
      className={`set-input${mono ? ' mono' : ''}${greyed ? ' greyed' : ''}${error ? ' invalid' : ''}`}
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Number + unit ─────────────────────────────────────────────────────────────

export function NumberUnit({
  value,
  unit,
  onChange,
  min,
  max,
  disabled,
  error,
  placeholder,
}) {
  return (
    <div
      className={`num-unit${disabled ? ' is-disabled' : ''}${error ? ' invalid' : ''}`}
    >
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value === '' ? '' : Number(e.target.value))
        }
      />
      {unit && <span className="unit">{unit}</span>}
    </div>
  );
}

// ── Cover resolution — number input + "Original" toggle ──────────────────────
// value: { number: number|'', original: bool } (use coverResToUi / uiToCoverRes)

export function CoverResolution({ value, onChange, disabled, t }) {
  const { number, original } = value || { number: '', original: false };
  return (
    <div className="cover-res">
      <input
        type="number"
        className="set-input"
        value={number ?? ''}
        min={1}
        disabled={disabled || original}
        onChange={(e) =>
          onChange({
            number: e.target.value === '' ? '' : Number(e.target.value),
            original: false,
          })
        }
      />
      {t && <span className="unit">{t.units_px}</span>}
      <label className="cover-res-original">
        <input
          type="checkbox"
          checked={!!original}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              number: e.target.checked ? '' : number,
              original: e.target.checked,
            })
          }
        />
        {t ? t.cover_original : 'Original'}
      </label>
    </div>
  );
}

// ── Secret field ──────────────────────────────────────────────────────────────
//
// State machine derived from { committedItem, draftValue, encryptionReady }:
//   blocked  — !encryptionReady
//   editing  — local, user clicked Set/Replace and the input is visible
//   set      — draftValue non-null (just-entered, show masked last-4 locally)
//              OR committedItem.is_set with source='db' (show API preview)
//   env      — committedItem.is_set && source='env' (is_set required)
//   unset    — default
//
// Callbacks: onSet(plaintext) when user saves a new value; onClear() to clear.

export function SecretField({
  committedItem,
  draftValue,
  encryptionReady,
  t,
  onSet,
  onClear,
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showInput, setShowInput] = useState(false);

  const enterEditing = () => {
    setInputValue('');
    setShowInput(false);
    setEditing(true);
  };

  const handleConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSet(trimmed);
    setEditing(false);
    setInputValue('');
    setShowInput(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setInputValue('');
    setShowInput(false);
  };

  // blocked — encryption is disabled, so secrets cannot be stored in the DB.
  // An env-provided secret is still effective (the backend reads it directly and
  // returns is_set/source='env'/preview regardless of the key), so surface it as
  // "from environment" — read-only (no Replace, since storing is unavailable).
  // Only fall back to the blocked hint when there is no env secret to show.
  if (!encryptionReady) {
    if (committedItem?.is_set && committedItem.source === 'env') {
      return (
        <div className="secret-field env">
          <div className="set-input greyed env-secret">
            <span>
              {committedItem.preview || '••••••••'} {t.secret_from_env}
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className="secret-field blocked">
        <div className="set-input disabled-look">
          <Icon name="alert" size={14} />
          <span className="secret-blocked-hint">{t.secret_blocked}</span>
        </div>
      </div>
    );
  }

  // editing
  if (editing) {
    return (
      <div className="secret-field editing">
        <div className="secret-input-wrap">
          <input
            type={showInput ? 'text' : 'password'}
            className="set-input mono"
            value={inputValue}
            autoFocus
            placeholder={t.secret_new_ph}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button
            type="button"
            className="eye"
            title={showInput ? t.secret_hide : t.secret_show}
            onClick={() => setShowInput((s) => !s)}
          >
            <Icon name={showInput ? 'eyeOff' : 'eye'} size={15} />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleConfirm}
          disabled={!inputValue.trim()}
        >
          {t.secret_save}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={handleCancel}
        >
          {t.secret_cancel}
        </button>
      </div>
    );
  }

  // just-entered draft value — show masked last-4 of typed value
  if (draftValue != null && draftValue !== '') {
    const last4 = draftValue.slice(-4);
    return (
      <div className="secret-field set">
        <div className="masked-value">
          <span className="dots">••••••••</span>
          <span className="tail">{last4}</span>
        </div>
        <button type="button" className="btn btn-sm" onClick={enterEditing}>
          {t.secret_replace}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost danger"
          onClick={onClear}
        >
          {t.secret_clear}
        </button>
      </div>
    );
  }

  // env — provided by environment variable (is_set required)
  if (committedItem?.is_set && committedItem.source === 'env') {
    return (
      <div className="secret-field env">
        <div className="set-input greyed env-secret">
          <span>
            {committedItem.preview || '••••••••'} {t.secret_from_env}
          </span>
        </div>
        <button type="button" className="btn btn-sm" onClick={enterEditing}>
          {t.secret_replace}
        </button>
      </div>
    );
  }

  // set — committed in db, show API preview
  if (committedItem?.is_set) {
    return (
      <div className="secret-field set">
        <div className="masked-value">
          <span className="preview">{committedItem.preview || '••••••••'}</span>
        </div>
        <button type="button" className="btn btn-sm" onClick={enterEditing}>
          {t.secret_replace}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost danger"
          onClick={onClear}
        >
          {t.secret_clear}
        </button>
      </div>
    );
  }

  // unset
  return (
    <div className="secret-field unset">
      <div className="set-input greyed placeholder-look" onClick={enterEditing}>
        <span>{t.secret_not_set}</span>
      </div>
      <button type="button" className="btn btn-sm" onClick={enterEditing}>
        {t.secret_save}
      </button>
    </div>
  );
}
