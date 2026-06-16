import { describe, it, expect } from 'vitest';
import { I18N } from '../i18n';

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
});
