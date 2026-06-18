import { describe, it, expect } from 'vitest';
import {
  indexSettings,
  effectiveValue,
  effectiveSource,
  sourceToBadge,
  dirtyKeys,
  diffDraft,
  boolToStr,
  strToBool,
  coverResToUi,
  uiToCoverRes,
  isLosslessYtdlp,
  displayValue,
  libraryMapToUi,
  uiToLibraryMap,
  numberError,
  urlError,
  libraryMapError,
  coverResError,
  buildOverridesPayload,
} from '../settings-helpers';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeItem(overrides = {}) {
  return {
    key: 'some_key',
    value: 'val',
    source: 'default',
    is_set: false,
    secret: false,
    preview: null,
    ...overrides,
  };
}

// ── indexSettings ─────────────────────────────────────────────────────────────

describe('indexSettings', () => {
  it('returns empty object for empty array', () => {
    expect(indexSettings([])).toEqual({});
  });

  it('indexes items by key', () => {
    const items = [
      makeItem({ key: 'a', value: '1' }),
      makeItem({ key: 'b', value: '2' }),
    ];
    const idx = indexSettings(items);
    expect(idx.a.value).toBe('1');
    expect(idx.b.value).toBe('2');
  });

  it('last item wins on duplicate key', () => {
    const items = [
      makeItem({ key: 'x', value: 'first' }),
      makeItem({ key: 'x', value: 'second' }),
    ];
    expect(indexSettings(items).x.value).toBe('second');
  });
});

// ── effectiveValue ────────────────────────────────────────────────────────────

describe('effectiveValue', () => {
  it('returns draft value when key is in draft', () => {
    const item = makeItem({ key: 'k', value: 'committed' });
    expect(effectiveValue(item, { k: 'edited' }, 'k')).toBe('edited');
  });

  it('returns committed value when key is not in draft', () => {
    const item = makeItem({ key: 'k', value: 'committed' });
    expect(effectiveValue(item, {}, 'k')).toBe('committed');
  });

  it('returns null for committed item with null value', () => {
    const item = makeItem({ key: 'k', value: null });
    expect(effectiveValue(item, {}, 'k')).toBeNull();
  });

  it('draft "" overrides null committed value', () => {
    const item = makeItem({ key: 'k', value: null });
    expect(effectiveValue(item, { k: '' }, 'k')).toBe('');
  });

  it('returns null when committedItem is null/undefined', () => {
    expect(effectiveValue(null, {}, 'k')).toBeNull();
    expect(effectiveValue(undefined, {}, 'k')).toBeNull();
  });
});

// ── effectiveSource ───────────────────────────────────────────────────────────

describe('effectiveSource', () => {
  it('returns "db" for a key with a draft edit', () => {
    const item = makeItem({ source: 'env' });
    expect(
      effectiveSource(item, { some_key: 'new' }, new Set(), 'some_key')
    ).toBe('db');
  });

  it('returns null for a key pending reset', () => {
    const item = makeItem({ source: 'db' });
    expect(
      effectiveSource(item, {}, new Set(['some_key']), 'some_key')
    ).toBeNull();
  });

  it('returns committed source when no draft or reset', () => {
    const item = makeItem({ source: 'env' });
    expect(effectiveSource(item, {}, new Set(), 'some_key')).toBe('env');
  });

  it('draft takes precedence over reset for same key (UI invariant: they are exclusive)', () => {
    const item = makeItem({ source: 'db' });
    // draft wins because it is checked first
    expect(
      effectiveSource(
        item,
        { some_key: 'v' },
        new Set(['some_key']),
        'some_key'
      )
    ).toBe('db');
  });
});

// ── sourceToBadge ─────────────────────────────────────────────────────────────

describe('sourceToBadge', () => {
  it('maps "db" → "saved"', () => expect(sourceToBadge('db')).toBe('saved'));
  it('maps "env" → "env"', () => expect(sourceToBadge('env')).toBe('env'));
  it('maps "default" → "default"', () =>
    expect(sourceToBadge('default')).toBe('default'));
  it('maps unknown → "default"', () =>
    expect(sourceToBadge('other')).toBe('default'));
  it('maps null → "default"', () =>
    expect(sourceToBadge(null)).toBe('default'));
});

// ── dirtyKeys ────────────────────────────────────────────────────────────────

describe('dirtyKeys', () => {
  it('returns empty set when nothing changed', () => {
    const committed = { a: makeItem({ key: 'a', value: '1' }) };
    expect(dirtyKeys(committed, { a: '1' }, new Set())).toEqual(new Set());
  });

  it('counts a draft edit that changed the value', () => {
    const committed = { a: makeItem({ key: 'a', value: '1' }) };
    expect(dirtyKeys(committed, { a: '2' }, new Set())).toEqual(new Set(['a']));
  });

  it('counts a reset key', () => {
    const committed = { a: makeItem({ key: 'a', value: '1', source: 'db' }) };
    expect(dirtyKeys(committed, {}, new Set(['a']))).toEqual(new Set(['a']));
  });

  it('counts both edits and resets', () => {
    const committed = {
      a: makeItem({ key: 'a', value: '1' }),
      b: makeItem({ key: 'b', value: '2', source: 'db' }),
    };
    expect(dirtyKeys(committed, { a: 'new' }, new Set(['b']))).toEqual(
      new Set(['a', 'b'])
    );
  });

  it('does not count "" for a null committed value (inherited-null no-op)', () => {
    const committed = { lib: makeItem({ key: 'lib', value: null }) };
    expect(dirtyKeys(committed, { lib: '' }, new Set())).toEqual(new Set());
  });

  it('does count "" for a non-null committed value (explicit clear)', () => {
    const committed = { lib: makeItem({ key: 'lib', value: '/path' }) };
    expect(dirtyKeys(committed, { lib: '' }, new Set())).toEqual(
      new Set(['lib'])
    );
  });
});

// ── diffDraft ─────────────────────────────────────────────────────────────────

describe('diffDraft', () => {
  it('returns empty puts and deletes when nothing changed', () => {
    const committed = { a: makeItem({ key: 'a', value: '1' }) };
    expect(diffDraft(committed, { a: '1' }, new Set())).toEqual({
      puts: {},
      deletes: [],
    });
  });

  it('edit → PUT', () => {
    const committed = { a: makeItem({ key: 'a', value: '1' }) };
    const { puts, deletes } = diffDraft(committed, { a: '2' }, new Set());
    expect(puts).toEqual({ a: '2' });
    expect(deletes).toEqual([]);
  });

  it('reset → DELETE', () => {
    const committed = { b: makeItem({ key: 'b', value: 'old', source: 'db' }) };
    const { puts, deletes } = diffDraft(committed, {}, new Set(['b']));
    expect(puts).toEqual({});
    expect(deletes).toContain('b');
  });

  it('edit and reset are exclusive (reset key not in puts)', () => {
    const committed = { c: makeItem({ key: 'c', value: 'old', source: 'db' }) };
    const { puts, deletes } = diffDraft(
      committed,
      { c: 'new' },
      new Set(['c'])
    );
    // draft wins, reset is also listed (UI invariant says they should not coexist,
    // but diffDraft handles both independently)
    expect(Object.keys(puts)).toContain('c');
    expect(deletes).toContain('c');
  });

  it('inherited-null clear ("") → no PUT', () => {
    const committed = { lib: makeItem({ key: 'lib', value: null }) };
    const { puts } = diffDraft(committed, { lib: '' }, new Set());
    expect(Object.keys(puts)).not.toContain('lib');
  });

  it('explicit-clear ("") of a non-null value → PUT', () => {
    const committed = { lib: makeItem({ key: 'lib', value: '/some/path' }) };
    const { puts } = diffDraft(committed, { lib: '' }, new Set());
    expect(puts.lib).toBe('');
  });

  it('multiple keys', () => {
    const committed = {
      a: makeItem({ key: 'a', value: '1' }),
      b: makeItem({ key: 'b', value: '2', source: 'db' }),
      c: makeItem({ key: 'c', value: '3' }),
    };
    const { puts, deletes } = diffDraft(
      committed,
      { a: 'new-a', c: '3' },
      new Set(['b'])
    );
    expect(puts).toEqual({ a: 'new-a' });
    expect(deletes).toContain('b');
    expect(Object.keys(puts)).not.toContain('c');
  });
});

// ── Bool codecs ───────────────────────────────────────────────────────────────

describe('boolToStr / strToBool', () => {
  it('boolToStr(true) → "1"', () => expect(boolToStr(true)).toBe('1'));
  it('boolToStr(false) → "0"', () => expect(boolToStr(false)).toBe('0'));
  it('strToBool("1") → true', () => expect(strToBool('1')).toBe(true));
  it('strToBool("0") → false', () => expect(strToBool('0')).toBe(false));
  it('strToBool("") → false', () => expect(strToBool('')).toBe(false));
  it('round-trip true', () => expect(strToBool(boolToStr(true))).toBe(true));
  it('round-trip false', () => expect(strToBool(boolToStr(false))).toBe(false));
});

// ── Cover resolution codecs ───────────────────────────────────────────────────

describe('coverResToUi / uiToCoverRes', () => {
  it('decodes "original"', () => {
    expect(coverResToUi('original')).toEqual({ number: '', original: true });
  });

  it('decodes a number string', () => {
    expect(coverResToUi('600')).toEqual({ number: 600, original: false });
  });

  it('decodes "400" (default)', () => {
    expect(coverResToUi('400')).toEqual({ number: 400, original: false });
  });

  it('decodes null → empty/not-original', () => {
    expect(coverResToUi(null)).toEqual({ number: '', original: false });
  });

  it('decodes "" → empty/not-original', () => {
    expect(coverResToUi('')).toEqual({ number: '', original: false });
  });

  it('encodes original UI object', () => {
    expect(uiToCoverRes({ number: '', original: true })).toBe('original');
  });

  it('encodes number UI object', () => {
    expect(uiToCoverRes({ number: 800, original: false })).toBe('800');
  });

  it('round-trip "original"', () => {
    expect(uiToCoverRes(coverResToUi('original'))).toBe('original');
  });

  it('round-trip "600"', () => {
    expect(uiToCoverRes(coverResToUi('600'))).toBe('600');
  });
});

// ── isLosslessYtdlp ───────────────────────────────────────────────────────────

describe('isLosslessYtdlp', () => {
  it('returns true for flac', () => expect(isLosslessYtdlp('flac')).toBe(true));
  it('returns true for wav', () => expect(isLosslessYtdlp('wav')).toBe(true));
  it('returns false for mp3', () => expect(isLosslessYtdlp('mp3')).toBe(false));
  it('returns false for opus', () =>
    expect(isLosslessYtdlp('opus')).toBe(false));
  it('returns false for m4a', () => expect(isLosslessYtdlp('m4a')).toBe(false));
  it('returns false for null', () => expect(isLosslessYtdlp(null)).toBe(false));
});

// ── displayValue ──────────────────────────────────────────────────────────────

describe('displayValue', () => {
  it('null → ""', () => expect(displayValue(null)).toBe(''));
  it('undefined → ""', () => expect(displayValue(undefined)).toBe(''));
  it('string passthrough', () => expect(displayValue('/path')).toBe('/path'));
  it('"" passthrough', () => expect(displayValue('')).toBe(''));
  it('number → string', () => expect(displayValue(42)).toBe('42'));
});

// ── libraryMapToUi / uiToLibraryMap ──────────────────────────────────────────

describe('libraryMapToUi', () => {
  it('null/empty → ""', () => {
    expect(libraryMapToUi(null)).toBe('');
    expect(libraryMapToUi('')).toBe('');
  });

  it('single mapping', () => {
    expect(libraryMapToUi('/music=/downloads')).toBe('/music = /downloads');
  });

  it('two mappings', () => {
    expect(libraryMapToUi('/a=/b,/c=/d')).toBe('/a = /b\n/c = /d');
  });

  it('trims whitespace from pairs', () => {
    expect(libraryMapToUi(' /a = /b ')).toBe('/a = /b');
  });
});

describe('uiToLibraryMap', () => {
  it('null/empty → ""', () => {
    expect(uiToLibraryMap(null)).toBe('');
    expect(uiToLibraryMap('')).toBe('');
  });

  it('single trimmed line', () => {
    expect(uiToLibraryMap('/music=/downloads')).toBe('/music=/downloads');
  });

  it('trims spaces around "="', () => {
    expect(uiToLibraryMap('/a = /b')).toBe('/a=/b');
  });

  it('multiple lines → comma-separated with no spaces', () => {
    expect(uiToLibraryMap('/a = /b\n/c = /d')).toBe('/a=/b,/c=/d');
  });

  it('skips blank lines', () => {
    expect(uiToLibraryMap('/a=/b\n\n/c=/d')).toBe('/a=/b,/c=/d');
  });

  it('skips lines without "="', () => {
    expect(uiToLibraryMap('/a=/b\nbad-line\n/c=/d')).toBe('/a=/b,/c=/d');
  });

  it('skips lines with empty left side', () => {
    expect(uiToLibraryMap('=/b\n/c=/d')).toBe('/c=/d');
  });

  it('skips lines with empty right side', () => {
    expect(uiToLibraryMap('/a=\n/c=/d')).toBe('/c=/d');
  });

  it('preserves "=" inside the right side (first-= split)', () => {
    // "/dest=/foo=bar" — right side is "/foo=bar"
    expect(uiToLibraryMap('/dest=/foo=bar')).toBe('/dest=/foo=bar');
  });

  it('round-trip with libraryMapToUi', () => {
    const wire = '/a=/b,/c=/d';
    expect(uiToLibraryMap(libraryMapToUi(wire))).toBe(wire);
  });

  it('round-trip: spaced UI input serializes to trimmed wire form', () => {
    // Backend only rstrips "/", not spaces; trimming is mandatory here.
    expect(uiToLibraryMap('/a = /b\n/c = /d')).toBe('/a=/b,/c=/d');
  });
});

// ── numberError ───────────────────────────────────────────────────────────────

describe('numberError', () => {
  it('returns null for valid integer', () => {
    expect(numberError('5')).toBeNull();
    expect(numberError('0')).toBeNull();
  });

  it('returns null for empty/null (optional)', () => {
    expect(numberError('')).toBeNull();
    expect(numberError(null)).toBeNull();
    expect(numberError(undefined)).toBeNull();
  });

  it('returns error for NaN', () => {
    expect(numberError('abc')).not.toBeNull();
  });

  it('returns error for float', () => {
    expect(numberError('1.5')).not.toBeNull();
  });

  it('returns error when below min', () => {
    expect(numberError('0', { min: 1 })).not.toBeNull();
    expect(numberError('-1', { min: 0 })).not.toBeNull();
  });

  it('returns null when exactly at min', () => {
    expect(numberError('1', { min: 1 })).toBeNull();
  });

  it('default min is 0', () => {
    expect(numberError('0')).toBeNull();
    expect(numberError('-1')).not.toBeNull();
  });
});

// ── urlError ──────────────────────────────────────────────────────────────────

describe('urlError', () => {
  it('returns null for valid http URL', () => {
    expect(urlError('http://localhost:7878')).toBeNull();
  });

  it('returns null for valid https URL', () => {
    expect(urlError('https://lidarr.example.com')).toBeNull();
  });

  it('returns null for empty/null (optional)', () => {
    expect(urlError('')).toBeNull();
    expect(urlError(null)).toBeNull();
  });

  it('returns error for non-URL string', () => {
    expect(urlError('not-a-url')).not.toBeNull();
  });

  it('returns error for non-http protocol', () => {
    expect(urlError('ftp://foo.com')).not.toBeNull();
  });
});

// ── libraryMapError ───────────────────────────────────────────────────────────

describe('libraryMapError', () => {
  it('returns null for empty/null input', () => {
    expect(libraryMapError('')).toBeNull();
    expect(libraryMapError(null)).toBeNull();
  });

  it('returns null for valid single mapping', () => {
    expect(libraryMapError('/a=/b')).toBeNull();
  });

  it('returns null for valid multi-line', () => {
    expect(libraryMapError('/a = /b\n/c = /d')).toBeNull();
  });

  it('returns null for blank lines (they are ignored)', () => {
    expect(libraryMapError('/a=/b\n\n/c=/d')).toBeNull();
  });

  it('returns error for a line without "="', () => {
    expect(libraryMapError('bad-line')).not.toBeNull();
  });

  it('returns error for a line with empty left side', () => {
    expect(libraryMapError('=/b')).not.toBeNull();
  });

  it('returns error for a line with empty right side', () => {
    expect(libraryMapError('/a=')).not.toBeNull();
  });
});

// ── coverResError ─────────────────────────────────────────────────────────────

describe('coverResError', () => {
  it('returns null for original: true', () => {
    expect(coverResError({ number: '', original: true })).toBeNull();
  });

  it('returns null for valid positive number', () => {
    expect(coverResError({ number: 600, original: false })).toBeNull();
    expect(coverResError({ number: 1, original: false })).toBeNull();
  });

  it('returns error for empty number and not original', () => {
    expect(coverResError({ number: '', original: false })).not.toBeNull();
  });

  it('returns error for zero', () => {
    expect(coverResError({ number: 0, original: false })).not.toBeNull();
  });

  it('returns error for negative', () => {
    expect(coverResError({ number: -1, original: false })).not.toBeNull();
  });

  it('returns error for non-integer', () => {
    expect(coverResError({ number: 1.5, original: false })).not.toBeNull();
  });

  it('returns error for NaN', () => {
    expect(coverResError({ number: NaN, original: false })).not.toBeNull();
  });
});

// ── buildOverridesPayload ─────────────────────────────────────────────────────

describe('buildOverridesPayload', () => {
  const committed = {
    yandex_quality: makeItem({ key: 'yandex_quality', value: '2' }),
    ytdlp_format: makeItem({ key: 'ytdlp_format', value: 'mp3' }),
    yandex_embed_cover: makeItem({ key: 'yandex_embed_cover', value: '1' }),
  };

  it('returns empty object when no overrides differ', () => {
    const overrides = { yandex_quality: '2', ytdlp_format: 'mp3' };
    expect(buildOverridesPayload(committed, overrides)).toEqual({});
  });

  it('includes keys whose override differs from global default', () => {
    const overrides = { yandex_quality: '0', ytdlp_format: 'mp3' };
    const result = buildOverridesPayload(committed, overrides);
    expect(result).toEqual({ yandex_quality: '0' });
  });

  it('omits no-op overrides', () => {
    const overrides = { yandex_quality: '2' }; // same as committed
    expect(buildOverridesPayload(committed, overrides)).toEqual({});
  });

  it('string-encodes bool overrides', () => {
    const overrides = { yandex_embed_cover: '0' }; // changed from "1"
    const result = buildOverridesPayload(committed, overrides);
    expect(result).toEqual({ yandex_embed_cover: '0' });
  });

  it('handles empty runOverrides', () => {
    expect(buildOverridesPayload(committed, {})).toEqual({});
  });

  it('handles unknown keys (not in committed) gracefully', () => {
    // committedValue will be null; if override is not null → include it
    const overrides = { unknown_key: 'val' };
    const result = buildOverridesPayload({}, overrides);
    expect(result).toEqual({ unknown_key: 'val' });
  });
});

// ── Nullable non-secret key scenarios ────────────────────────────────────────

describe('nullable non-secret key handling', () => {
  const NULLABLE_KEYS = [
    'library_map',
    'ytmusic_client_id',
    'ytdlp_cookies_file',
    'yandex_path_pattern',
  ];

  NULLABLE_KEYS.forEach((key) => {
    it(`${key}: null value → displayValue returns ""`, () => {
      expect(displayValue(null)).toBe('');
    });

    it(`${key}: null value not dirty when untouched (not in draft)`, () => {
      const committed = { [key]: makeItem({ key, value: null }) };
      expect(dirtyKeys(committed, {}, new Set())).toEqual(new Set());
    });

    it(`${key}: "" draft for null committed → not dirty (no spurious PUT)`, () => {
      const committed = { [key]: makeItem({ key, value: null }) };
      const dirty = dirtyKeys(committed, { [key]: '' }, new Set());
      expect(dirty.has(key)).toBe(false);
    });

    it(`${key}: "" draft for null committed → no PUT in diffDraft`, () => {
      const committed = { [key]: makeItem({ key, value: null }) };
      const { puts } = diffDraft(committed, { [key]: '' }, new Set());
      expect(Object.keys(puts)).not.toContain(key);
    });

    it(`${key}: actual edit → dirty and included in PUT`, () => {
      const committed = { [key]: makeItem({ key, value: null }) };
      const val = key === 'library_map' ? '/a=/b' : '/some/path';
      const dirty = dirtyKeys(committed, { [key]: val }, new Set());
      expect(dirty.has(key)).toBe(true);
      const { puts } = diffDraft(committed, { [key]: val }, new Set());
      expect(puts[key]).toBe(val);
    });
  });

  it('uiToLibraryMap: spaced input → trimmed wire form /a=/b,/c=/d', () => {
    expect(uiToLibraryMap('/a = /b\n/c = /d')).toBe('/a=/b,/c=/d');
  });

  it('uiToLibraryMap: "=" inside right side preserved (first-= split)', () => {
    expect(uiToLibraryMap('/dest=/target=extra')).toBe('/dest=/target=extra');
  });

  it('libraryMapToUi + uiToLibraryMap round-trip', () => {
    const wire = '/music=/downloads,/data=/media';
    expect(uiToLibraryMap(libraryMapToUi(wire))).toBe(wire);
  });
});
