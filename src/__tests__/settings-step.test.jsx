import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { SettingsScreen } from '../settings-step';
import { I18N } from '../i18n';

afterEach(cleanup);

const t = I18N.en;

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeItem(key, overrides = {}) {
  return {
    key,
    group: 'test',
    type: 'str',
    scope: 'global',
    secret: false,
    source: 'default',
    value: null,
    is_set: false,
    preview: null,
    ...overrides,
  };
}

function makeCommitted(overrides = {}) {
  const base = {
    enable_yandex: makeItem('enable_yandex', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    yandex_token: makeItem('yandex_token', {
      secret: true,
      value: null,
      is_set: false,
    }),
    enable_youtube_music: makeItem('enable_youtube_music', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    ytmusic_oauth_file: makeItem('ytmusic_oauth_file'),
    ytmusic_client_id: makeItem('ytmusic_client_id'),
    ytmusic_client_secret: makeItem('ytmusic_client_secret', {
      secret: true,
      value: null,
      is_set: false,
    }),
    enable_soundcloud: makeItem('enable_soundcloud', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    ytdlp_cookies_file: makeItem('ytdlp_cookies_file'),
    lidarr_url: makeItem('lidarr_url', {
      value: 'http://lidarr:8686',
      source: 'default',
    }),
    lidarr_api_key: makeItem('lidarr_api_key', {
      secret: true,
      value: null,
      is_set: false,
    }),
    lidarr_import_path: makeItem('lidarr_import_path', {
      value: '/downloads',
      source: 'default',
    }),
    library_map: makeItem('library_map', { value: null, source: 'default' }),
    yandex_quality: makeItem('yandex_quality', {
      type: 'enum',
      value: '2',
      source: 'default',
    }),
    yandex_lyrics_format: makeItem('yandex_lyrics_format', {
      type: 'enum',
      value: 'none',
      source: 'default',
    }),
    yandex_cover_resolution: makeItem('yandex_cover_resolution', {
      type: 'cover_resolution',
      value: '600',
      source: 'default',
    }),
    yandex_embed_cover: makeItem('yandex_embed_cover', {
      type: 'bool',
      value: '1',
      source: 'default',
    }),
    yandex_skip_existing: makeItem('yandex_skip_existing', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    yandex_only_music: makeItem('yandex_only_music', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    yandex_stick_to_artist: makeItem('yandex_stick_to_artist', {
      type: 'bool',
      value: '1',
      source: 'default',
    }),
    yandex_clear_comments: makeItem('yandex_clear_comments', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    ytdlp_format: makeItem('ytdlp_format', {
      type: 'enum',
      value: 'opus',
      source: 'default',
    }),
    ytdlp_quality: makeItem('ytdlp_quality', {
      type: 'int',
      value: '320',
      source: 'default',
    }),
    yandex_path_pattern: makeItem('yandex_path_pattern'),
    yandex_delay: makeItem('yandex_delay', {
      type: 'int',
      value: '0',
      source: 'default',
    }),
    yandex_compat_level: makeItem('yandex_compat_level', {
      type: 'enum',
      value: '0',
      source: 'default',
    }),
    yandex_unsafe_path: makeItem('yandex_unsafe_path', {
      type: 'bool',
      value: '0',
      source: 'default',
    }),
    ytdlp_path_pattern: makeItem('ytdlp_path_pattern'),
    ytdlp_retries: makeItem('ytdlp_retries', {
      type: 'int',
      value: '3',
      source: 'default',
    }),
    yandex_net_timeout: makeItem('yandex_net_timeout', {
      type: 'int',
      value: '30',
      source: 'default',
    }),
    yandex_net_tries: makeItem('yandex_net_tries', {
      type: 'int',
      value: '3',
      source: 'default',
    }),
    yandex_net_retry_delay: makeItem('yandex_net_retry_delay', {
      type: 'int',
      value: '5',
      source: 'default',
    }),
    app_log_level: makeItem('app_log_level', {
      type: 'enum',
      value: 'INFO',
      source: 'env',
    }),
  };
  return { ...base, ...overrides };
}

function renderScreen(propsOverrides = {}) {
  const props = {
    t,
    lang: 'en',
    committed: makeCommitted(),
    encryptionReady: true,
    onSave: vi.fn().mockResolvedValue(undefined),
    onBack: vi.fn(),
    ...propsOverrides,
  };
  return render(<SettingsScreen {...props} />);
}

// ── Save bar visibility ───────────────────────────────────────────────────────

describe('SettingsScreen — save bar', () => {
  it('is hidden when no changes', () => {
    const { container } = renderScreen();
    expect(container.querySelector('.save-bar')).toBeNull();
  });

  it('appears after a field edit', () => {
    const { container } = renderScreen();
    // change the lidarr_url field
    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://newhost:8686' } });
    expect(container.querySelector('.save-bar')).toBeTruthy();
  });

  it('Discard hides the bar', () => {
    const { container } = renderScreen();
    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://newhost:8686' } });
    expect(container.querySelector('.save-bar')).toBeTruthy();

    const discard = container.querySelector('.btn.btn-ghost');
    fireEvent.click(discard);
    expect(container.querySelector('.save-bar')).toBeNull();
  });

  it('Discard reverts field value', () => {
    const { container } = renderScreen();
    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://newhost:8686' } });
    const discard = container.querySelector('.btn.btn-ghost');
    fireEvent.click(discard);
    // Recheck: input shows original committed value
    const inputAfter = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    expect(inputAfter.value).toBe('http://lidarr:8686');
  });
});

// ── Save with puts ────────────────────────────────────────────────────────────

describe('SettingsScreen — save puts', () => {
  it('edit a text field → onSave called with the edited value in puts', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = renderScreen({ onSave });

    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://newlidarr:9090' } });

    const saveBtn = container.querySelector('.btn.btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const [puts, deletes] = onSave.mock.calls[0];
    expect(puts.lidarr_url).toBe('http://newlidarr:9090');
    expect(deletes).toEqual([]);
  });

  it('editing back to the original value produces no puts', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = renderScreen({ onSave });

    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    // change then revert
    fireEvent.change(input, { target: { value: 'http://newlidarr:9090' } });
    fireEvent.change(input, { target: { value: 'http://lidarr:8686' } });

    // save bar should be gone (no changes)
    expect(container.querySelector('.save-bar')).toBeNull();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('multiple edits → all keys in puts', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { container } = renderScreen({ onSave });

    const urlInput = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(urlInput, { target: { value: 'http://newlidarr:9090' } });

    const importInput = container.querySelector(
      'input[placeholder="/downloads"]'
    );
    fireEvent.change(importInput, { target: { value: '/new/downloads' } });

    const saveBtn = container.querySelector('.btn.btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const [puts] = onSave.mock.calls[0];
    expect(puts.lidarr_url).toBe('http://newlidarr:9090');
    expect(puts.lidarr_import_path).toBe('/new/downloads');
  });
});

// ── Reset (deletes) ───────────────────────────────────────────────────────────

describe('SettingsScreen — reset → deletes', () => {
  it('resetting a db-sourced field adds it to deletes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const committed = makeCommitted({
      lidarr_url: makeItem('lidarr_url', {
        value: 'http://lidarr:8686',
        source: 'db',
      }),
    });
    const { container } = renderScreen({ onSave, committed });

    // The reset button should appear for a db-sourced field
    const resetBtn = container.querySelector('.reset-btn');
    expect(resetBtn).toBeTruthy();
    fireEvent.click(resetBtn);

    // Save bar should appear (key is now in resetKeys)
    expect(container.querySelector('.save-bar')).toBeTruthy();

    const saveBtn = container.querySelector('.btn.btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const [puts, deletes] = onSave.mock.calls[0];
    expect(deletes).toContain('lidarr_url');
    expect(puts.lidarr_url).toBeUndefined();
  });

  it('resetting a db-sourced source enable toggle adds it to deletes', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const committed = makeCommitted({
      enable_yandex: makeItem('enable_yandex', {
        type: 'bool',
        value: '0',
        source: 'db',
      }),
    });
    const { container } = renderScreen({ onSave, committed });

    // The reset button should appear in the Yandex source-card header
    const resetBtn = container.querySelector('.toggle-slot .reset-btn');
    expect(resetBtn).toBeTruthy();
    fireEvent.click(resetBtn);

    const saveBtn = container.querySelector('.btn.btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const [puts, deletes] = onSave.mock.calls[0];
    expect(deletes).toContain('enable_yandex');
    expect(puts.enable_yandex).toBeUndefined();
  });

  it('editing a db field and then resetting: reset wins, edit removed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const committed = makeCommitted({
      lidarr_url: makeItem('lidarr_url', {
        value: 'http://lidarr:8686',
        source: 'db',
      }),
    });
    const { container } = renderScreen({ onSave, committed });

    // Edit the field
    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://edited:9090' } });

    // Then click the reset button
    const resetBtn = container.querySelector('.reset-btn');
    fireEvent.click(resetBtn);

    const saveBtn = container.querySelector('.btn.btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const [puts, deletes] = onSave.mock.calls[0];
    expect(deletes).toContain('lidarr_url');
    expect(puts.lidarr_url).toBeUndefined();
  });
});

// ── Validation ────────────────────────────────────────────────────────────────

describe('SettingsScreen — validation', () => {
  it('invalid URL shows an error and disables Save', () => {
    const { container } = renderScreen();

    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'not-a-url' } });

    // Save bar appears
    const saveBtn = container.querySelector('.btn.btn-primary');
    expect(saveBtn).toBeTruthy();
    expect(saveBtn.disabled).toBe(true);

    // Error message shown
    const errEl = container.querySelector('.field-error');
    expect(errEl).toBeTruthy();
    expect(errEl.textContent).toContain(t.err_url);
  });

  it('invalid (non-numeric) input in a number field disables Save', () => {
    const { container } = renderScreen();

    // Open advanced section so number fields are rendered
    const advBtn = container.querySelector('.adv-toggle');
    fireEvent.click(advBtn);

    // Find any number field in the settings body (yandex_delay etc.).
    // These are text inputs (not type="number") so invalid text reaches
    // the validator instead of being silently coerced to "".
    const numInputs = container.querySelectorAll(
      '.set-section-body .num-unit input'
    );
    expect(numInputs.length).toBeGreaterThan(0);
    fireEvent.change(numInputs[0], { target: { value: 'abc' } });
    expect(container.querySelector('.save-bar')).toBeTruthy();
    expect(container.querySelector('.btn.btn-primary').disabled).toBe(true);
  });

  it('clearing an invalid field re-enables Save', () => {
    const { container } = renderScreen();

    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    // Enter invalid URL
    fireEvent.change(input, { target: { value: 'bad-url' } });
    const saveBtn = container.querySelector('.btn.btn-primary');
    expect(saveBtn.disabled).toBe(true);

    // Clear it (empty → returns to inherited default, no PUT, no error)
    fireEvent.change(input, { target: { value: '' } });
    // Empty is valid (optional field), but same as inherited default? No —
    // the committed value is 'http://lidarr:8686' so empty IS a change but valid.
    // urlError('') returns null (empty → no error)
    const saveBtnAfter = container.querySelector('.btn.btn-primary');
    if (saveBtnAfter) {
      // save bar might still be visible since '' !== 'http://lidarr:8686'
      expect(saveBtnAfter.disabled).toBe(false);
    }
  });
});

// ── Yandex warning ────────────────────────────────────────────────────────────

describe('SettingsScreen — Yandex warning', () => {
  it('shows warning when Yandex enabled + encryptionReady + token unset', () => {
    const committed = makeCommitted({
      enable_yandex: makeItem('enable_yandex', {
        type: 'bool',
        value: '1',
        source: 'default',
      }),
      yandex_token: makeItem('yandex_token', {
        secret: true,
        value: null,
        is_set: false,
      }),
    });
    const { container } = renderScreen({ committed, encryptionReady: true });
    expect(container.querySelector('.card-warn')).toBeTruthy();
    expect(container.querySelector('.card-warn').textContent).toContain(
      t.yandex_warn
    );
  });

  it('does not show warning when Yandex disabled', () => {
    const committed = makeCommitted({
      enable_yandex: makeItem('enable_yandex', {
        type: 'bool',
        value: '0',
        source: 'default',
      }),
    });
    const { container } = renderScreen({ committed, encryptionReady: true });
    expect(container.querySelector('.card-warn')).toBeNull();
  });

  it('does not show warning when encryptionReady is false', () => {
    const committed = makeCommitted({
      enable_yandex: makeItem('enable_yandex', {
        type: 'bool',
        value: '1',
        source: 'default',
      }),
    });
    const { container } = renderScreen({ committed, encryptionReady: false });
    expect(container.querySelector('.card-warn')).toBeNull();
  });

  it('does not show warning when Yandex enabled + token is set', () => {
    const committed = makeCommitted({
      enable_yandex: makeItem('enable_yandex', {
        type: 'bool',
        value: '1',
        source: 'default',
      }),
      yandex_token: makeItem('yandex_token', {
        secret: true,
        value: null,
        is_set: true,
        source: 'db',
        preview: '••••3f9a',
      }),
    });
    const { container } = renderScreen({ committed, encryptionReady: true });
    expect(container.querySelector('.card-warn')).toBeNull();
  });
});

// ── Backend error surfacing ───────────────────────────────────────────────────

describe('SettingsScreen — backend error in save bar', () => {
  it('surfaces a backend 400 error in the save bar', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValue(
        new Error('set ALBFETCHARR_SECRET_KEY to store secrets')
      );
    const { container } = renderScreen({ onSave });

    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://newlidarr:9090' } });

    const saveBtn = container.querySelector('.btn.btn-primary');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      const errEl = container.querySelector('.save-error');
      expect(errEl).toBeTruthy();
      expect(errEl.textContent).toContain(
        'set ALBFETCHARR_SECRET_KEY to store secrets'
      );
    });
  });

  it('draft remains intact after a failed save', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('API error'));
    const { container } = renderScreen({ onSave });

    const input = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    fireEvent.change(input, { target: { value: 'http://newlidarr:9090' } });
    fireEvent.click(container.querySelector('.btn.btn-primary'));

    await waitFor(() => {
      expect(container.querySelector('.save-error')).toBeTruthy();
    });

    // Save bar still present — changes preserved
    expect(container.querySelector('.save-bar')).toBeTruthy();
    const inputAfter = container.querySelector(
      'input[placeholder="http://lidarr:8686"]'
    );
    expect(inputAfter.value).toBe('http://newlidarr:9090');
  });
});

// ── Section nav ───────────────────────────────────────────────────────────────

describe('SettingsScreen — section nav', () => {
  it('renders all five nav items including Environment', () => {
    const { container } = renderScreen();
    const navBtns = container.querySelectorAll('.settings-nav button');
    expect(navBtns.length).toBe(5);
    const labels = Array.from(navBtns).map((b) => b.textContent);
    expect(labels.some((l) => l.includes(t.nav_sources))).toBe(true);
    expect(labels.some((l) => l.includes(t.nav_lidarr))).toBe(true);
    expect(labels.some((l) => l.includes(t.nav_download))).toBe(true);
    expect(labels.some((l) => l.includes(t.nav_advanced))).toBe(true);
    expect(labels.some((l) => l.includes(t.nav_environment))).toBe(true);
  });

  it('first section nav button has "on" class by default', () => {
    const { container } = renderScreen();
    const firstBtn = container.querySelector('.settings-nav button');
    expect(firstBtn.classList.contains('on')).toBe(true);
  });
});

// ── Advanced section ──────────────────────────────────────────────────────────

describe('SettingsScreen — advanced section', () => {
  it('is collapsed by default', () => {
    const { container } = renderScreen();
    // The set-section-body inside the advanced section should not be visible
    const advSection = Array.from(
      container.querySelectorAll('.set-section')
    ).at(-1);
    expect(advSection.querySelector('.set-section-body')).toBeNull();
  });

  it('expands when the toggle button is clicked', () => {
    const { container } = renderScreen();
    const advToggle = container.querySelector('.adv-toggle');
    fireEvent.click(advToggle);
    const advSection = Array.from(
      container.querySelectorAll('.set-section')
    ).at(-1);
    expect(advSection.querySelector('.set-section-body')).toBeTruthy();
  });
});

// ── Encryption-ready flag ─────────────────────────────────────────────────────

describe('SettingsScreen — encryptionReady', () => {
  it('secret fields show blocked message when encryptionReady=false', () => {
    const { container } = renderScreen({ encryptionReady: false });
    const blocked = container.querySelectorAll('.secret-field.blocked');
    expect(blocked.length).toBeGreaterThan(0);
  });

  it('secret fields are not blocked when encryptionReady=true', () => {
    const { container } = renderScreen({ encryptionReady: true });
    const blocked = container.querySelectorAll('.secret-field.blocked');
    expect(blocked.length).toBe(0);
  });
});

// library_map textarea tests removed: library_map moved to the read-only
// Environment section in Task 5. Task 6 will add read-only rendering tests.

// ── Source card visibility ────────────────────────────────────────────────────

describe('SettingsScreen — source card body', () => {
  it('Yandex card body hidden when enable_yandex=false', () => {
    const { container } = renderScreen();
    // By default enable_yandex = '0' (disabled), card-body not rendered
    expect(container.querySelector('.source-card-body')).toBeNull();
  });

  it('Yandex card body shown when enable_yandex=true', () => {
    const committed = makeCommitted({
      enable_yandex: makeItem('enable_yandex', {
        type: 'bool',
        value: '1',
        source: 'default',
      }),
    });
    const { container } = renderScreen({ committed });
    // At least one source card body should be visible
    expect(container.querySelector('.source-card-body')).toBeTruthy();
  });
});

// ── onBack ────────────────────────────────────────────────────────────────────

describe('SettingsScreen — back button', () => {
  it('calls onBack when the back link is clicked', () => {
    const onBack = vi.fn();
    const { container } = renderScreen({ onBack });
    const backBtn = container.querySelector('.back-link');
    expect(backBtn).toBeTruthy();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledOnce();
  });
});
