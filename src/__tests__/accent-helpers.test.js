import { describe, it, expect } from 'vitest';
import {
  ACCENT_PALETTES,
  DEFAULT_ACCENT,
  LIBRARY_SWATCHES,
  accentVars,
  applyAccent,
  libraryColor,
  parseAccent,
} from '../accent-helpers';
import { I18N } from '../i18n';

describe('accentVars', () => {
  it('maps each shipped palette to the three accent vars', () => {
    ACCENT_PALETTES.forEach(([from, to]) => {
      const vars = accentVars([from, to]);
      expect(vars['--accent-blue']).toBe(from);
      expect(vars['--accent-teal']).toBe(to);
      expect(vars['--accent-grad']).toBe(
        `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
      );
    });
  });

  it('defaults to the first palette for missing/malformed input', () => {
    const expected = accentVars(DEFAULT_ACCENT);
    expect(accentVars(undefined)).toEqual(expected);
    expect(accentVars(null)).toEqual(expected);
    expect(accentVars([])).toEqual(expected);
    expect(accentVars(['#fff'])).toEqual(expected);
    expect(accentVars('nonsense')).toEqual(expected);
  });

  it('default palette matches the styles.css default (blue→teal)', () => {
    expect(DEFAULT_ACCENT).toEqual(['#2d8eff', '#2ed3bf']);
  });
});

describe('parseAccent', () => {
  it('parses a JSON-encoded palette', () => {
    expect(parseAccent(JSON.stringify(['#7a5aff', '#2ed3bf']))).toEqual([
      '#7a5aff',
      '#2ed3bf',
    ]);
  });

  it('falls back to the default for null/invalid input', () => {
    expect(parseAccent(null)).toEqual(DEFAULT_ACCENT);
    expect(parseAccent('')).toEqual(DEFAULT_ACCENT);
    expect(parseAccent('not json')).toEqual(DEFAULT_ACCENT);
    expect(parseAccent(JSON.stringify('a string'))).toEqual(DEFAULT_ACCENT);
    expect(parseAccent(JSON.stringify(['#fff']))).toEqual(DEFAULT_ACCENT);
  });
});

describe('applyAccent', () => {
  it('writes the accent vars onto the given element', () => {
    const el = { style: {} };
    el.style.setProperty = (k, v) => {
      el.style[k] = v;
    };
    applyAccent(['#ff7a45', '#ffcc00'], el);
    expect(el.style['--accent-blue']).toBe('#ff7a45');
    expect(el.style['--accent-teal']).toBe('#ffcc00');
    expect(el.style['--accent-grad']).toBe(
      'linear-gradient(135deg, #ff7a45 0%, #ffcc00 100%)'
    );
  });
});

describe('libraryColor', () => {
  it('only ever returns colors from the logo palette', () => {
    ['Music', 'Lossless', 'FLAC', 'Soundtracks', ''].forEach((name) => {
      expect(LIBRARY_SWATCHES).toContain(libraryColor(name));
    });
  });

  it('is deterministic — the same name maps to the same color', () => {
    expect(libraryColor('Music')).toBe(libraryColor('Music'));
    expect(libraryColor('Lossless')).toBe(libraryColor('Lossless'));
  });

  it('spreads distinct names across the palette', () => {
    const names = ['Music', 'Lossless', 'FLAC', 'Soundtracks', 'Live', 'Vinyl'];
    const colors = new Set(names.map(libraryColor));
    // Not a strict guarantee, but these sample names should land on >1 swatch.
    expect(colors.size).toBeGreaterThan(1);
  });

  it('derives swatches from the accent palettes with no duplicates', () => {
    expect(LIBRARY_SWATCHES).toEqual([...new Set(ACCENT_PALETTES.flat())]);
    expect(LIBRARY_SWATCHES.length).toBe(new Set(LIBRARY_SWATCHES).size);
  });

  it('handles non-string input without throwing', () => {
    expect(LIBRARY_SWATCHES).toContain(libraryColor(undefined));
    expect(LIBRARY_SWATCHES).toContain(libraryColor(null));
  });
});

describe('accent i18n keys', () => {
  it('defines accent + gradient labels in both languages', () => {
    ['accent', 'gradient'].forEach((key) => {
      expect(typeof I18N.en[key]).toBe('string');
      expect(typeof I18N.ru[key]).toBe('string');
      expect(I18N.en[key].length).toBeGreaterThan(0);
      expect(I18N.ru[key].length).toBeGreaterThan(0);
    });
  });
});
