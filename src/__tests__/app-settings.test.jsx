import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  render,
  cleanup,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import App from '../app';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ── jsdom shims ───────────────────────────────────────────────────────────────

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

  // EventSource is not in jsdom; use a regular function (arrow fns can't be constructors)
  globalThis.EventSource = vi.fn(function MockEventSource() {
    this.addEventListener = vi.fn();
    this.close = vi.fn();
    this.onerror = null;
  });

  // Suppress console.error noise from failed fetches in tests
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// ── Fetch mock helpers ────────────────────────────────────────────────────────

const ok = (data) =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });

/** Default committed settings array (yandex_quality = '2' from default). */
function makeSettingsArray(overrides = []) {
  const base = [
    {
      key: 'enable_yandex',
      value: '0',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_token',
      value: null,
      source: 'default',
      scope: 'global',
      secret: true,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'enable_youtube_music',
      value: '0',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytmusic_oauth_file',
      value: null,
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytmusic_client_id',
      value: null,
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytmusic_client_secret',
      value: null,
      source: 'default',
      scope: 'global',
      secret: true,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'enable_soundcloud',
      value: '0',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytdlp_cookies_file',
      value: null,
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'lidarr_url',
      value: 'http://lidarr:8686',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'lidarr_api_key',
      value: null,
      source: 'default',
      scope: 'global',
      secret: true,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'lidarr_import_path',
      value: '/downloads',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'library_map',
      value: null,
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_quality',
      value: '2',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'enum',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_lyrics_format',
      value: 'none',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'enum',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_cover_resolution',
      value: '600',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'cover_resolution',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_embed_cover',
      value: '1',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_skip_existing',
      value: '0',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_only_music',
      value: '0',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_stick_to_artist',
      value: '1',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_clear_comments',
      value: '0',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytdlp_format',
      value: 'flac',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'enum',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytdlp_quality',
      value: '320',
      source: 'default',
      scope: 'session',
      secret: false,
      type: 'int',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_path_pattern',
      value: null,
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_delay',
      value: '0',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'int',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_compat_level',
      value: '0',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'enum',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_unsafe_path',
      value: '0',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'bool',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytdlp_path_pattern',
      value: null,
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'str',
      is_set: false,
      preview: null,
    },
    {
      key: 'ytdlp_retries',
      value: '3',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'int',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_net_timeout',
      value: '30',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'int',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_net_tries',
      value: '3',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'int',
      is_set: false,
      preview: null,
    },
    {
      key: 'yandex_net_retry_delay',
      value: '5',
      source: 'default',
      scope: 'global',
      secret: false,
      type: 'int',
      is_set: false,
      preview: null,
    },
  ];
  const overrideKeys = overrides.map((o) => o.key);
  return [...base.filter((s) => !overrideKeys.includes(s.key)), ...overrides];
}

function setupBasicFetch(overrides = {}) {
  const routes = {
    'GET /api/config': ok({
      default_lang: 'en',
      default_theme: 'system',
      encryption_enabled: false,
      import_enabled: true,
    }),
    'GET /api/settings': ok(makeSettingsArray()),
    'GET /api/wanted': ok([]),
    'GET /api/sources': ok([
      { id: 'yandex', name: 'Yandex Music' },
      { id: 'youtube_music', name: 'YouTube Music' },
    ]),
    ...overrides,
  };
  globalThis.fetch = vi.fn((url, opts = {}) => {
    const method = (opts.method || 'GET').toUpperCase();
    const path = url.split('?')[0];
    const key = `${method} ${path}`;
    if (routes[key]) return routes[key];
    // DELETE /api/settings/<key>
    if (method === 'DELETE' && path.startsWith('/api/settings/')) {
      return ok(makeSettingsArray());
    }
    return ok({});
  });
  return globalThis.fetch;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('App — header cog toggle', () => {
  it('cog button shows the settings screen and hides the stepper', async () => {
    setupBasicFetch();
    const { container } = render(<App />);

    // Wait for the initial load to complete (cog button must be in header)
    await waitFor(() => {
      expect(
        container.querySelector('button[aria-label="Settings"]')
      ).toBeTruthy();
    });

    // App flow (stepper) is visible by default
    expect(container.querySelector('.stepper')).toBeTruthy();
    expect(container.querySelector('.settings-layout')).toBeFalsy();

    // Click the cog → settings screen
    const cog = container.querySelector('button[aria-label="Settings"]');
    await act(async () => {
      fireEvent.click(cog);
    });

    expect(container.querySelector('.settings-layout')).toBeTruthy();
    expect(container.querySelector('.stepper')).toBeFalsy();
  });

  it('back-to-app button returns to the app flow', async () => {
    setupBasicFetch();
    const { container } = render(<App />);

    await waitFor(() => {
      expect(
        container.querySelector('button[aria-label="Settings"]')
      ).toBeTruthy();
    });

    // Navigate to settings
    await act(async () => {
      fireEvent.click(container.querySelector('button[aria-label="Settings"]'));
    });
    expect(container.querySelector('.settings-layout')).toBeTruthy();

    // Click back-to-app
    const backBtn = Array.from(container.querySelectorAll('.back-link')).find(
      (b) => b.textContent.includes('Back to library')
    );
    expect(backBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(backBtn);
    });

    expect(container.querySelector('.stepper')).toBeTruthy();
    expect(container.querySelector('.settings-layout')).toBeFalsy();
  });

  it('cog icon-btn has the "on" class while in settings view', async () => {
    setupBasicFetch();
    const { container } = render(<App />);

    await waitFor(() => {
      expect(
        container.querySelector('button[aria-label="Settings"]')
      ).toBeTruthy();
    });

    const cog = container.querySelector('button[aria-label="Settings"]');
    expect(cog.classList.contains('on')).toBe(false);

    await act(async () => {
      fireEvent.click(cog);
    });
    expect(cog.classList.contains('on')).toBe(true);
  });
});

describe('App — settings save wiring', () => {
  it('save issues PUT /api/settings with changed keys and reloads', async () => {
    const fetchMock = setupBasicFetch({
      'PUT /api/settings': ok(makeSettingsArray()),
    });
    const { container } = render(<App />);

    await waitFor(() => {
      expect(
        container.querySelector('button[aria-label="Settings"]')
      ).toBeTruthy();
    });

    // Navigate to settings
    await act(async () => {
      fireEvent.click(container.querySelector('button[aria-label="Settings"]'));
    });

    // Wait for settings screen to render (enable_yandex toggle is in sources section)
    await waitFor(() => {
      expect(container.querySelector('.settings-layout')).toBeTruthy();
    });

    // Find the Yandex enable toggle (first toggle in the source cards) and click it
    const toggles = container.querySelectorAll('.tgl');
    expect(toggles.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(toggles[0]);
    });

    // Save bar should appear; find and click Save
    await waitFor(() => {
      expect(container.querySelector('.save-bar')).toBeTruthy();
    });

    const saveBtn = Array.from(
      container.querySelectorAll('.save-bar .btn-primary')
    ).find((b) => !b.disabled);
    expect(saveBtn).toBeTruthy();
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Verify PUT was issued
    await waitFor(() => {
      const putCalls = fetchMock.mock.calls.filter(
        ([url, opts]) => url === '/api/settings' && opts?.method === 'PUT'
      );
      expect(putCalls.length).toBeGreaterThanOrEqual(1);
    });

    // Verify GET /api/settings was called again after save (reload)
    const getCalls = fetchMock.mock.calls.filter(
      ([url, opts]) =>
        url === '/api/settings' && (!opts || (opts.method || 'GET') === 'GET')
    );
    expect(getCalls.length).toBeGreaterThanOrEqual(2); // once on mount, once after save
  });

  it('reset issues DELETE /api/settings/<key> and reloads', async () => {
    // Use lidarr_url (rendered via Field component with canReset) with source 'db'.
    // enable_yandex is a toggle in the source card header — no reset button there.
    const settingsWithDb = makeSettingsArray([
      {
        key: 'lidarr_url',
        value: 'http://mylidarr:8686',
        source: 'db',
        scope: 'global',
        secret: false,
        type: 'str',
        is_set: true,
        preview: null,
      },
    ]);
    const fetchMock = setupBasicFetch({
      'GET /api/settings': ok(settingsWithDb),
    });
    const { container } = render(<App />);

    await waitFor(() => {
      expect(
        container.querySelector('button[aria-label="Settings"]')
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(container.querySelector('button[aria-label="Settings"]'));
    });

    await waitFor(() => {
      expect(container.querySelector('.settings-layout')).toBeTruthy();
    });

    // A db-sourced field has a reset button
    await waitFor(() => {
      const resetBtns = container.querySelectorAll('.reset-btn');
      expect(resetBtns.length).toBeGreaterThan(0);
    });

    const resetBtn = container.querySelector('.reset-btn');
    await act(async () => {
      fireEvent.click(resetBtn);
    });

    // Save bar should appear (one pending reset)
    await waitFor(() => {
      expect(container.querySelector('.save-bar')).toBeTruthy();
    });

    const saveBtn = Array.from(
      container.querySelectorAll('.save-bar .btn-primary')
    ).find((b) => !b.disabled);
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    // Verify DELETE was issued
    await waitFor(() => {
      const deleteCalls = fetchMock.mock.calls.filter(
        ([url, opts]) =>
          opts?.method === 'DELETE' && url.startsWith('/api/settings/')
      );
      expect(deleteCalls.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('App — download overrides wiring', () => {
  // Builds a full mock fetch that supports the search → results → download flow.
  function setupDownloadFetch({ extraRunSettings = [] } = {}) {
    const downloadBodies = [];

    const searchResult = [
      {
        album_id: 1,
        artist: 'Artist',
        title: 'Album',
        results: [
          {
            source: 'yandex',
            match_artists: ['Artist'],
            match_title: 'Album',
            match_url: 'https://music.yandex.ru/album/1',
            year: 2020,
            track_count: 10,
            match: 0.95,
          },
        ],
        errors: [],
      },
    ];

    const fetchMock = vi.fn((url, opts = {}) => {
      const method = (opts.method || 'GET').toUpperCase();
      const path = url.split('?')[0];

      if (path === '/api/config')
        return ok({
          default_lang: 'en',
          default_theme: 'system',
          encryption_enabled: false,
          import_enabled: true,
        });
      if (path === '/api/settings')
        return ok(makeSettingsArray(extraRunSettings));
      if (path === '/api/wanted')
        return ok([
          {
            album_id: 1,
            artist: 'Artist',
            title: 'Album',
            release_date: '2020-01-01',
            status: 'missing',
          },
        ]);
      if (path === '/api/sources')
        return ok([{ id: 'yandex', name: 'Yandex Music' }]);
      if (path === '/api/search' && method === 'POST') return ok(searchResult);
      if (path === '/api/download/stream/claim' && method === 'POST')
        return ok({});
      if (path === '/api/download' && method === 'POST') {
        downloadBodies.push(JSON.parse(opts.body));
        return ok({});
      }
      return ok({});
    });

    globalThis.fetch = fetchMock;
    return { fetchMock, downloadBodies };
  }

  it('empty runOverrides → download body has no overrides key', async () => {
    const { downloadBodies } = setupDownloadFetch();
    const { container } = render(<App />);

    // Wait for albums to load (table body row with style means fetchState=ready)
    await waitFor(
      () => {
        expect(container.querySelector('.wt tbody tr[style]')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Click the album row (regular onClick, avoids controlled-checkbox issues)
    await act(async () => {
      fireEvent.click(container.querySelector('.wt tbody tr[style]'));
    });

    // Wait for the search button to be enabled, then click it
    await waitFor(
      () => {
        const btn = Array.from(container.querySelectorAll('button')).find(
          (b) => b.textContent.includes('Search') && !b.disabled
        );
        expect(btn).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Search') && !b.disabled
      );
      fireEvent.click(btn);
    });

    // Wait for results step
    await waitFor(
      () => {
        expect(container.querySelector('.result-album')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Click Download button
    await waitFor(
      () => {
        const btn = Array.from(container.querySelectorAll('button')).find(
          (b) =>
            (b.textContent.includes('Download') ||
              b.textContent.includes('Скачать')) &&
            !b.disabled
        );
        expect(btn).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) =>
          (b.textContent.includes('Download') ||
            b.textContent.includes('Скачать')) &&
          !b.disabled
      );
      fireEvent.click(btn);
    });

    await waitFor(() => expect(downloadBodies.length).toBeGreaterThan(0), {
      timeout: 3000,
    });

    // With empty runOverrides, no overrides key in the body
    expect(downloadBodies[0]).not.toHaveProperty('overrides');
  });

  it('non-empty runOverrides → download body includes overrides', async () => {
    // yandex_quality starts at '2' (from default); we will override to '0' via ThisRunPanel
    const { downloadBodies } = setupDownloadFetch();
    const { container } = render(<App />);

    // Wait for album table to appear and ThisRunPanel to be available
    await waitFor(
      () => {
        expect(container.querySelector('.wt tbody tr[style]')).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await waitFor(() => {
      expect(container.querySelector('.this-run-head')).toBeTruthy();
    });

    // Open ThisRunPanel
    await act(async () => {
      fireEvent.click(container.querySelector('.this-run-head'));
    });

    // Click "AAC 64" (value '0') in the yandex_quality segmented control
    await waitFor(() => {
      const btn = Array.from(container.querySelectorAll('.seg button')).find(
        (b) => b.textContent.trim() === 'AAC 64'
      );
      expect(btn).toBeTruthy();
    });
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('.seg button')).find(
        (b) => b.textContent.trim() === 'AAC 64'
      );
      fireEvent.click(btn);
    });

    // Click the album row to select it
    await act(async () => {
      fireEvent.click(container.querySelector('.wt tbody tr[style]'));
    });

    // Wait for search button enabled, then click it
    await waitFor(
      () => {
        const btn = Array.from(container.querySelectorAll('button')).find(
          (b) => b.textContent.includes('Search') && !b.disabled
        );
        expect(btn).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Search') && !b.disabled
      );
      fireEvent.click(btn);
    });

    await waitFor(
      () => {
        expect(container.querySelector('.result-album')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Click Download
    await waitFor(
      () => {
        const btn = Array.from(container.querySelectorAll('button')).find(
          (b) =>
            (b.textContent.includes('Download') ||
              b.textContent.includes('Скачать')) &&
            !b.disabled
        );
        expect(btn).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) =>
          (b.textContent.includes('Download') ||
            b.textContent.includes('Скачать')) &&
          !b.disabled
      );
      fireEvent.click(btn);
    });

    await waitFor(() => expect(downloadBodies.length).toBeGreaterThan(0), {
      timeout: 3000,
    });

    // Override should be present: yandex_quality '0' differs from committed '2'
    expect(downloadBodies[0].overrides).toEqual({ yandex_quality: '0' });
  });

  it('yandex_quality This-run override reaches the payload without per-item shadowing', async () => {
    // The old bug: choice.format was seeded as '2', which always overrode the session setting.
    // With the fix: choice.format is null (no seed), so buildDownloadItems omits quality from
    // the item, and the override makes it into overrides instead.
    const { downloadBodies } = setupDownloadFetch();
    const { container } = render(<App />);

    await waitFor(
      () => {
        expect(container.querySelector('.wt tbody tr[style]')).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await waitFor(() => {
      expect(container.querySelector('.this-run-head')).toBeTruthy();
    });

    // Set yandex_quality override to '0' via ThisRunPanel
    await act(async () => {
      fireEvent.click(container.querySelector('.this-run-head'));
    });
    await waitFor(() => {
      const btn = Array.from(container.querySelectorAll('.seg button')).find(
        (b) => b.textContent.trim() === 'AAC 64'
      );
      expect(btn).toBeTruthy();
    });
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('.seg button')).find(
        (b) => b.textContent.trim() === 'AAC 64'
      );
      fireEvent.click(btn);
    });

    // Click album row to select it
    await act(async () => {
      fireEvent.click(container.querySelector('.wt tbody tr[style]'));
    });

    // Wait for search button enabled, click it
    await waitFor(
      () => {
        const btn = Array.from(container.querySelectorAll('button')).find(
          (b) => b.textContent.includes('Search') && !b.disabled
        );
        expect(btn).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent.includes('Search') && !b.disabled
      );
      fireEvent.click(btn);
    });

    await waitFor(
      () => {
        expect(container.querySelector('.result-album')).toBeTruthy();
      },
      { timeout: 3000 }
    );

    // Click Download
    await waitFor(
      () => {
        const btn = Array.from(container.querySelectorAll('button')).find(
          (b) =>
            (b.textContent.includes('Download') ||
              b.textContent.includes('Скачать')) &&
            !b.disabled
        );
        expect(btn).toBeTruthy();
      },
      { timeout: 3000 }
    );
    await act(async () => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) =>
          (b.textContent.includes('Download') ||
            b.textContent.includes('Скачать')) &&
          !b.disabled
      );
      fireEvent.click(btn);
    });

    await waitFor(() => expect(downloadBodies.length).toBeGreaterThan(0), {
      timeout: 3000,
    });

    const body = downloadBodies[0];

    // The download item must NOT carry per-item quality (choice.format was null)
    expect(body.items[0]).not.toHaveProperty('quality');

    // The session override must be present in overrides
    expect(body.overrides).toEqual({ yandex_quality: '0' });
  });
});
