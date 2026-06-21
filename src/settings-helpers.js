/* Settings helpers — pure logic, no React.
 *
 * All functions here are side-effect free and independently unit-testable.
 * The API stores all values as strings; booleans are "1"/"0", enums/ints as
 * their string form, and null for optional unset non-secret keys.
 */

// ── Index ────────────────────────────────────────────────────────────────────

/** Build a { [key]: SettingItem } index from the GET /api/settings array. */
export function indexSettings(items) {
  return Object.fromEntries(items.map((item) => [item.key, item]));
}

// ── Effective value + source ──────────────────────────────────────────────────

/**
 * Returns the value to render for a field.
 * Draft edit wins over the committed (server) value.
 */
export function effectiveValue(committedItem, draft, key) {
  if (Object.prototype.hasOwnProperty.call(draft, key)) return draft[key];
  return committedItem ? committedItem.value : null;
}

/**
 * Returns the source to show for a field's origin badge.
 * - Pending draft edit → 'db' (will become "saved" once committed)
 * - Pending reset → null (neutral; will inherit after save)
 * - Otherwise → committedItem.source
 */
export function effectiveSource(committedItem, draft, resetKeys, key) {
  if (Object.prototype.hasOwnProperty.call(draft, key)) return 'db';
  if (resetKeys instanceof Set ? resetKeys.has(key) : false) return null;
  return committedItem ? committedItem.source : 'default';
}

/**
 * Maps a backend source string to a display badge label.
 * "db" → "saved", "env" → "env", anything else → "default".
 */
export function sourceToBadge(source) {
  if (source === 'db') return 'saved';
  if (source === 'env') return 'env';
  return 'default';
}

// ── Draft diff ───────────────────────────────────────────────────────────────

/**
 * Compute which keys are dirty (need to be saved or reset).
 *
 * Draft keys that haven't actually changed (same as committed value, or
 * "" when the committed value is null) are excluded.
 */
export function dirtyKeys(committed, draft, resetKeys) {
  const keys = new Set();
  for (const [key, value] of Object.entries(draft)) {
    const item = committed[key];
    const committedValue = item ? item.value : null;
    if (_isDraftChanged(value, committedValue)) keys.add(key);
  }
  for (const key of resetKeys) {
    keys.add(key);
  }
  return keys;
}

/**
 * Produce the set of API calls needed to persist the current draft.
 *
 * Returns { puts: {key: value}, deletes: [key] }.
 * - Draft edits that actually changed from committed → PUT
 * - Reset keys → DELETE
 * - An edited key and a reset key are mutually exclusive (UI invariant)
 * - Clearing a text input to "" for an inherited-null optional key → no PUT
 */
export function diffDraft(committed, draft, resetKeys) {
  const puts = {};
  const deletes = [];

  for (const [key, value] of Object.entries(draft)) {
    const item = committed[key];
    const committedValue = item ? item.value : null;
    if (_isDraftChanged(value, committedValue)) {
      puts[key] = value;
    }
  }

  for (const key of resetKeys) {
    deletes.push(key);
  }

  return { puts, deletes };
}

/** Returns true when the draft value represents an actual change from committed. */
function _isDraftChanged(draftValue, committedValue) {
  if (draftValue === committedValue) return false;
  // Clearing a text input to "" for an optional key whose server value is null
  // is a no-op — the field hasn't changed from the inherited-null state.
  if (draftValue === '' && committedValue === null) return false;
  return true;
}

// ── Value codecs ─────────────────────────────────────────────────────────────

/** Boolean → API string ("1" / "0"). */
export function boolToStr(v) {
  return v ? '1' : '0';
}

/** API string → boolean. Anything other than "1" is false. */
export function strToBool(s) {
  return s === '1';
}

/**
 * Decode a cover_resolution API string to a UI object.
 * "original" → { number: '', original: true }
 * "600"      → { number: 600, original: false }
 * null/""/…  → { number: '', original: false }
 */
export function coverResToUi(str) {
  if (str === 'original') return { number: '', original: true };
  if (str == null || str === '') return { number: '', original: false };
  const n = Number(str);
  return { number: isNaN(n) ? '' : n, original: false };
}

/**
 * Encode a UI cover_resolution object back to an API string.
 * { original: true } → "original"
 * { number: 600 }    → "600"
 */
export function uiToCoverRes({ number, original }) {
  if (original) return 'original';
  return String(number);
}

/** @deprecated Use isPassthroughYtdlp instead. Left for callers being updated in Task 6. */
export function isLosslessYtdlp(fmt) {
  return fmt === 'flac' || fmt === 'wav';
}

/** Returns true when a yt-dlp format is passthrough (no re-encode → quality field hidden). */
export function isPassthroughYtdlp(fmt) {
  return fmt === 'best';
}

// ── Quality presets ───────────────────────────────────────────────────────────

export const YTDLP_QUALITY_PRESETS = {
  opus: { options: [192, 160, 128, 96], default: 160 },
  m4a: { options: [256, 192, 128], default: 256 },
  mp3: { options: [320, 256, 192, 128], default: 256 },
};

/**
 * Returns the preset options and default for the given yt-dlp format,
 * or null for passthrough formats (where quality is hidden).
 */
export function qualityPresetsFor(format) {
  return YTDLP_QUALITY_PRESETS[format] ?? null;
}

/**
 * Snap a quality kbps string to the nearest preset for a given format.
 * If the current value is already in the preset list, it's preserved.
 * Returns the default for the format when the value isn't in the preset list.
 * Returns null for passthrough formats.
 */
export function snapQuality(format, current) {
  const presets = qualityPresetsFor(format);
  if (!presets) return null;
  const currentNum = Number(current);
  if (presets.options.includes(currentNum)) return String(currentNum);
  return String(presets.default);
}

/**
 * Coerce a value to a string safe for a text input.
 * null → ""; everything else → String(v).
 * Never stores "" back to committed-null unless the user actually typed it.
 */
export function displayValue(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

// ── Library map adapters ──────────────────────────────────────────────────────

/**
 * Convert the backend's comma-separated wire format to a display string
 * (one "left = right" mapping per line).
 */
export function libraryMapToUi(str) {
  if (!str) return '';
  return str
    .split(',')
    .map((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return pair.trim();
      const left = pair.slice(0, idx).trim();
      const right = pair.slice(idx + 1).trim();
      return `${left} = ${right}`;
    })
    .join('\n');
}

/**
 * Serialize a multi-line UI text to the backend's comma-separated wire form.
 *
 * For each non-blank line:
 *   - split on the FIRST "=" (right side may contain "=")
 *   - trim both sides
 *   - drop lines with empty left or right
 *   - join as "left=right" with no spaces
 * Result: "left1=right1,left2=right2"
 */
export function uiToLibraryMap(text) {
  if (!text) return '';
  const parts = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const left = line.slice(0, idx).trim();
    const right = line.slice(idx + 1).trim();
    if (!left || !right) continue;
    parts.push(`${left}=${right}`);
  }
  return parts.join(',');
}

// ── Client-side validators ────────────────────────────────────────────────────
//
// These mirror the backend's validate_value bounds/types and are advisory only.
// The backend is the final gate; a null/undefined/empty value is considered
// "no override" and returns null (no error) for optional fields.

/**
 * Validate an integer field.
 * Returns an error message string or null.
 * opts.min defaults to 0; opts.max is optional (no upper bound when omitted).
 */
export function numberError(v, { min = 0, max } = {}) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || isNaN(n)) return 'invalid number';
  if (!Number.isInteger(n)) return 'must be a whole number';
  if (n < min) return `must be at least ${min}`;
  if (max != null && n > max) return `must be at most ${max}`;
  return null;
}

/**
 * Validate a URL field (must be http or https).
 * Empty/null → no error (field is optional or will inherit).
 */
export function urlError(v) {
  if (!v) return null;
  try {
    const url = new URL(v);
    if (url.protocol !== 'http:' && url.protocol !== 'https:')
      return 'must be an http or https URL';
    return null;
  } catch {
    return 'invalid URL';
  }
}

/**
 * Validate the library_map textarea text.
 * Each non-blank line must contain "=" with non-empty trimmed sides.
 */
export function libraryMapError(text) {
  if (!text) return null;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const idx = line.indexOf('=');
    if (idx === -1) return 'each line must contain "="';
    const left = line.slice(0, idx).trim();
    const right = line.slice(idx + 1).trim();
    if (!left || !right)
      return 'each mapping needs non-empty paths on both sides of "="';
  }
  return null;
}

/**
 * Validate a cover_resolution UI value { number, original }.
 * "original" is always valid; otherwise number must be a positive integer.
 * opts.max is optional (no upper bound when omitted).
 */
export function coverResError({ number, original }, { max } = {}) {
  if (original) return null;
  if (number === '' || number === null || number === undefined)
    return 'enter a size or select Original';
  const n = Number(number);
  if (!Number.isFinite(n) || isNaN(n)) return 'must be a number or Original';
  if (!Number.isInteger(n)) return 'must be a whole number';
  if (n <= 0) return 'size must be a positive number';
  if (max != null && n > max) return `size must be at most ${max}`;
  return null;
}

/**
 * Minimal validation derived from the backend-provided setting `type`.
 *
 * The API tags every setting with a type (str / bool / int / enum /
 * cover_resolution); this turns that tag into the least-restrictive client
 * check that can't be wrong:
 *   - int             → whole number in [opts.min (default 0), opts.max]
 *   - enum            → must be one of opts.choices (when the catalog knows them)
 *   - cover_resolution→ positive size ≤ opts.max, or "original"
 *   - str / bool      → no generic constraint (handled by toggles / specialized
 *                       validators like urlError / libraryMapError)
 *
 * Returns a stable error code ('number' | 'option' | 'cover') the UI maps to a
 * localized message, or null when valid. Empty/null/undefined is treated as
 * "no value" (optional / inherits) and never errors.
 */
export function typeError(type, value, { min = 0, max, choices } = {}) {
  if (value === '' || value === null || value === undefined) return null;
  if (type === 'int') {
    return numberError(value, { min, max }) ? 'number' : null;
  }
  if (type === 'enum') {
    if (Array.isArray(choices) && choices.length > 0) {
      return choices.includes(value) ? null : 'option';
    }
    return null;
  }
  if (type === 'cover_resolution') {
    return coverResError(coverResToUi(value), { max }) ? 'cover' : null;
  }
  return null;
}

// ── Overrides payload ─────────────────────────────────────────────────────────

/**
 * Build the overrides dict for POST /api/download.
 *
 * Includes only Tier-3 (session-scoped) keys whose run override differs from
 * the resolved global default in committedIndex. Non-session keys must not be
 * included here (the API returns 422 for them).
 *
 * All session-scoped keys are non-secret, so committedItem.value is a non-null
 * string — no masking/preview handling needed.
 *
 * Empty-string overrides are dropped: every session key is enum/bool/int/
 * cover_resolution, so "" is never a valid value (the backend rejects it with
 * 422). A cleared number/cover-resolution field therefore falls back to the
 * global default instead of failing the download.
 */
export function buildOverridesPayload(committedIndex, runOverrides) {
  const result = {};
  for (const [key, value] of Object.entries(runOverrides)) {
    if (value === '') continue;
    const item = committedIndex[key];
    const committedValue = item ? item.value : null;
    if (value !== committedValue) {
      result[key] = value;
    }
  }
  return result;
}
