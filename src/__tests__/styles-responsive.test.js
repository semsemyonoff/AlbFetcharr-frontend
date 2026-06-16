import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

// Static guard for the responsive CSS contract (jsdom can't evaluate layout,
// so we assert the breakpoints and key selectors are present in styles.css).
// Resolved from the Vitest cwd (project root) since jsdom doesn't expose a
// file: URL via import.meta.url.
const css = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('responsive styles.css', () => {
  it('declares the three responsive breakpoints', () => {
    expect(css).toContain('@media (max-width: 1024px)');
    expect(css).toContain('@media (max-width: 640px)');
    expect(css).toContain('@media (max-width: 380px)');
  });

  it('does not keep the retired 720px breakpoint', () => {
    expect(css).not.toContain('max-width: 720px');
  });

  it('provides the table↔cards swap selectors', () => {
    expect(css).toContain('.wt-table-wrap');
    expect(css).toContain('.wt-cards');
  });

  it('reflows Step 2 candidate rows and Step 3 download rows on mobile', () => {
    expect(css).toMatch(/\.cand-radio\s*\{[^}]*18px 1fr auto/);
    expect(css).toMatch(/\.dl-row\s*\{[^}]*44px 1fr/);
  });

  it('uses the real youtube_music source-badge selector', () => {
    expect(css).toContain('.src-badge.youtube_music');
    expect(css).not.toMatch(/\.src-badge\.youtube\b(?!_)/);
  });

  it('styles every download status bucket emitted by the backend', () => {
    for (const status of [
      'starting',
      'downloading',
      'downloaded',
      'importing',
      'done',
      'failed',
    ]) {
      expect(css).toContain(`.dl-row.${status} .status-mini`);
    }
  });
});
