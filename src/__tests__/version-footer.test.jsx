import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import App from '../app';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });

  globalThis.EventSource = vi.fn(function MockEventSource() {
    this.addEventListener = vi.fn();
    this.close = vi.fn();
    this.onerror = null;
  });

  vi.spyOn(console, 'error').mockImplementation(() => {});
});

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });

const err = () =>
  Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });

function setupFetch(versionResponse) {
  globalThis.fetch = vi.fn((url) => {
    const path = url.split('?')[0];
    if (path === '/api/config')
      return ok({
        default_lang: 'en',
        default_theme: 'system',
        encryption_enabled: false,
        import_enabled: true,
      });
    if (path === '/api/settings') return ok([]);
    if (path === '/api/wanted') return ok([]);
    if (path === '/api/sources') return ok([]);
    if (path === '/api/version') return versionResponse;
    return ok({});
  });
}

describe('VersionFooter', () => {
  it('renders version info after a successful /api/version fetch', async () => {
    setupFetch(
      ok({ albfetcharr: '1.2.3', yt_dlp: '2024.11.18', ymd: '0.9.5' })
    );
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector('.app-versions')).toBeTruthy();
    });

    const footer = container.querySelector('.app-versions');
    expect(footer.textContent).toContain('AlbFetcharr');
    expect(footer.textContent).toContain('v1.2.3');
    expect(footer.textContent).toContain('yt-dlp');
    expect(footer.textContent).toContain('2024.11.18');
    expect(footer.textContent).toContain('ymd');
    expect(footer.textContent).toContain('v0.9.5');
  });

  it('renders nothing when /api/version returns a non-ok response', async () => {
    setupFetch(err());
    const { container } = render(<App />);

    // Give async effects time to settle
    await waitFor(() => {
      expect(container.querySelector('.app-v2')).toBeTruthy();
    });

    // Footer should not appear
    expect(container.querySelector('.app-versions')).toBeFalsy();
  });

  it('renders nothing when /api/version fetch throws a network error', async () => {
    globalThis.fetch = vi.fn((url) => {
      const path = url.split('?')[0];
      if (path === '/api/version')
        return Promise.reject(new Error('network error'));
      if (path === '/api/config')
        return ok({
          default_lang: 'en',
          default_theme: 'system',
          encryption_enabled: false,
          import_enabled: true,
        });
      if (path === '/api/settings') return ok([]);
      if (path === '/api/wanted') return ok([]);
      if (path === '/api/sources') return ok([]);
      return ok({});
    });

    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector('.app-v2')).toBeTruthy();
    });

    expect(container.querySelector('.app-versions')).toBeFalsy();
  });

  it('renders nothing when /api/version returns an empty object', async () => {
    setupFetch(ok({}));
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector('.app-v2')).toBeTruthy();
    });

    expect(container.querySelector('.app-versions')).toBeFalsy();
  });

  it('renders nothing when /api/version returns partial fields', async () => {
    setupFetch(ok({ albfetcharr: '1.2.3', yt_dlp: '', ymd: '0.9.5' }));
    const { container } = render(<App />);

    await waitFor(() => {
      expect(container.querySelector('.app-v2')).toBeTruthy();
    });

    expect(container.querySelector('.app-versions')).toBeFalsy();
  });
});
