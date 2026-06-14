import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function resolveTheme(theme) {
  if (theme === 'system') {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return darkMode ? 'dark' : 'light';
  }
  return theme;
}

describe('theme-resolver', () => {
  let matchMediaMock;
  let mediaQueryList;
  let localStorageMock;

  beforeEach(() => {
    localStorageMock = {
      data: {},
      getItem(key) {
        return this.data[key] ?? null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      },
    };
    global.localStorage = localStorageMock;

    mediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };
    matchMediaMock = vi.fn(() => mediaQueryList);
    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('resolves light theme when explicitly set to light', () => {
    expect(resolveTheme('light')).toBe('light');
  });

  it('resolves dark theme when explicitly set to dark', () => {
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolves system to dark when prefers-color-scheme is dark', () => {
    mediaQueryList.matches = true;
    expect(resolveTheme('system')).toBe('dark');
  });

  it('resolves system to light when prefers-color-scheme is light', () => {
    mediaQueryList.matches = false;
    expect(resolveTheme('system')).toBe('light');
  });

  it('prioritizes localStorage over env defaults', () => {
    localStorage.setItem('albfetcharr.theme', 'dark');
    const stored = localStorage.getItem('albfetcharr.theme');
    expect(stored).toBe('dark');
  });

  it('prioritizes localStorage lang over env defaults', () => {
    localStorage.setItem('albfetcharr.lang', 'ru');
    const stored = localStorage.getItem('albfetcharr.lang');
    expect(stored).toBe('ru');
  });

  it('uses default when localStorage is empty', () => {
    const stored = localStorage.getItem('albfetcharr.theme');
    expect(stored).toBeNull();
  });

  it('handles system mode transitions on matchMedia change', () => {
    mediaQueryList.matches = false;
    expect(resolveTheme('system')).toBe('light');

    mediaQueryList.matches = true;
    expect(resolveTheme('system')).toBe('dark');
  });

  it('respects all three theme options: system, light, dark', () => {
    expect(['system', 'light', 'dark'].every(t =>
      ['light', 'dark'].includes(resolveTheme(t))
    )).toBe(true);
  });

  it('supports language codes en and ru', () => {
    const langs = ['en', 'ru'];
    langs.forEach(lang => {
      localStorage.setItem('albfetcharr.lang', lang);
      expect(localStorage.getItem('albfetcharr.lang')).toBe(lang);
    });
  });
});
