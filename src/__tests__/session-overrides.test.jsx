import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { ThisRunPanel } from '../session-overrides';
import { I18N } from '../i18n';

afterEach(cleanup);

const t = I18N.en;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeItem(key, value, extra = {}) {
  return {
    key,
    group: 'test',
    type: 'str',
    scope: 'session',
    secret: false,
    source: 'default',
    value,
    is_set: false,
    preview: null,
    ...extra,
  };
}

function makeCommitted(overrides = {}) {
  const base = {
    yandex_quality: makeItem('yandex_quality', '2', { type: 'enum' }),
    yandex_lyrics_format: makeItem('yandex_lyrics_format', 'none', {
      type: 'enum',
    }),
    yandex_cover_resolution: makeItem('yandex_cover_resolution', '600', {
      type: 'cover_resolution',
    }),
    yandex_embed_cover: makeItem('yandex_embed_cover', '1', { type: 'bool' }),
    yandex_skip_existing: makeItem('yandex_skip_existing', '0', {
      type: 'bool',
    }),
    yandex_only_music: makeItem('yandex_only_music', '0', { type: 'bool' }),
    yandex_stick_to_artist: makeItem('yandex_stick_to_artist', '1', {
      type: 'bool',
    }),
    yandex_clear_comments: makeItem('yandex_clear_comments', '0', {
      type: 'bool',
    }),
    ytdlp_format: makeItem('ytdlp_format', 'mp3', { type: 'enum' }),
    ytdlp_quality: makeItem('ytdlp_quality', '320', { type: 'int' }),
  };
  return { ...base, ...overrides };
}

// ── Stateful wrapper — owns the overrides state so interactions reflect in DOM ─

function Stateful({ committed, initialOverrides = {} }) {
  const [overrides, setOverrides] = useState(initialOverrides);
  return (
    <ThisRunPanel
      t={t}
      lang="en"
      committed={committed}
      overrides={overrides}
      setOverrides={setOverrides}
    />
  );
}

// Helper: render the panel with committed state, open it, and return utils.
function renderOpen(committed = makeCommitted(), initialOverrides = {}) {
  const result = render(
    <Stateful committed={committed} initialOverrides={initialOverrides} />
  );
  const { container } = result;
  fireEvent.click(container.querySelector('.this-run-head'));
  return { ...result, container };
}

// ── Panel open/close ──────────────────────────────────────────────────────────

describe('ThisRunPanel', () => {
  it('renders collapsed by default', () => {
    const { container } = render(
      <ThisRunPanel
        t={t}
        committed={makeCommitted()}
        overrides={{}}
        setOverrides={() => {}}
      />
    );
    expect(container.querySelector('.this-run-body')).toBeNull();
    expect(
      container.querySelector('.this-run').classList.contains('open')
    ).toBe(false);
  });

  it('opens when header is clicked', () => {
    const { container } = renderOpen();
    expect(container.querySelector('.this-run-body')).toBeTruthy();
    expect(
      container.querySelector('.this-run').classList.contains('open')
    ).toBe(true);
  });

  it('closes when header is clicked again', () => {
    const { container } = renderOpen();
    fireEvent.click(container.querySelector('.this-run-head'));
    expect(container.querySelector('.this-run-body')).toBeNull();
  });

  it('shows the banner text when open', () => {
    const { container } = renderOpen();
    expect(container.querySelector('.this-run-banner').textContent).toContain(
      t.this_run_banner
    );
  });

  it('does not show the override count when nothing is overridden', () => {
    const { container } = render(
      <ThisRunPanel
        t={t}
        committed={makeCommitted()}
        overrides={{}}
        setOverrides={() => {}}
      />
    );
    expect(container.querySelector('.tr-count')).toBeNull();
  });
});

// ── Pre-fill from committed ───────────────────────────────────────────────────

describe('pre-fill', () => {
  it('pre-fills yandex_quality segmented from committed value', () => {
    const { container } = renderOpen(
      makeCommitted({ yandex_quality: makeItem('yandex_quality', '1') })
    );
    // The "AAC 192" button should be aria-checked=true
    const buttons = container.querySelectorAll('.seg button');
    const checked = Array.from(buttons).find(
      (b) =>
        b.getAttribute('aria-checked') === 'true' && b.textContent === 'AAC 192'
    );
    expect(checked).toBeTruthy();
  });

  it('pre-fills ytdlp_format select from committed value', () => {
    const { container } = renderOpen(
      makeCommitted({ ytdlp_format: makeItem('ytdlp_format', 'opus') })
    );
    const select = Array.from(container.querySelectorAll('select')).find(
      (s) => s.value === 'opus'
    );
    expect(select).toBeTruthy();
  });

  it('embed_cover toggle reflects committed "1" as checked', () => {
    const { container } = renderOpen();
    // yandex_embed_cover is '1' → at least one toggle should be aria-checked=true
    const toggles = container.querySelectorAll('.tgl');
    const embedToggle = Array.from(toggles).find(
      (b) => b.getAttribute('aria-checked') === 'true'
    );
    expect(embedToggle).toBeTruthy();
  });
});

// ── Toggling a Yandex bool stores "1" / "0" ───────────────────────────────────

describe('Yandex toggle interaction', () => {
  it('toggling yandex_skip_existing from off adds an ovr-badge', () => {
    // yandex_skip_existing is committed "0" — no overrides initially
    const { container } = renderOpen();

    // No ovr-badges before any interaction
    expect(container.querySelectorAll('.ovr-badge').length).toBe(0);

    // Find an off toggle (aria-checked=false) and click it
    const toggles = container.querySelectorAll('.tgl');
    const offToggle = Array.from(toggles).find(
      (b) => b.getAttribute('aria-checked') === 'false'
    );
    expect(offToggle).toBeTruthy();
    fireEvent.click(offToggle);

    // An ovr-badge should now appear for the overridden field
    expect(container.querySelectorAll('.ovr-badge').length).toBeGreaterThan(0);
    // The toggle should now be checked
    expect(offToggle.getAttribute('aria-checked')).toBe('true');
  });

  it('toggling an "on" toggle (committed "1") adds an ovr-badge', () => {
    const { container } = renderOpen();

    // yandex_embed_cover is committed '1' → aria-checked=true
    const toggles = container.querySelectorAll('.tgl');
    const onToggle = Array.from(toggles).find(
      (b) => b.getAttribute('aria-checked') === 'true'
    );
    expect(onToggle).toBeTruthy();
    fireEvent.click(onToggle);

    expect(container.querySelectorAll('.ovr-badge').length).toBeGreaterThan(0);
    expect(onToggle.getAttribute('aria-checked')).toBe('false');
  });
});

// ── Segmented / select changes ────────────────────────────────────────────────

describe('segmented and select changes', () => {
  it('clicking a quality option updates the segmented selection', () => {
    // Committed yandex_quality is '2' (FLAC)
    const { container } = renderOpen();

    // "AAC 64" button (value '0') should currently be aria-checked=false
    const aac64Btn = Array.from(container.querySelectorAll('.seg button')).find(
      (b) => b.textContent === 'AAC 64'
    );
    expect(aac64Btn).toBeTruthy();
    expect(aac64Btn.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(aac64Btn);

    // Now AAC 64 is selected and an ovr-badge appears
    expect(aac64Btn.getAttribute('aria-checked')).toBe('true');
    expect(container.querySelectorAll('.ovr-badge').length).toBeGreaterThan(0);
  });

  it('changing ytdlp_format select updates the displayed value', () => {
    const { container } = renderOpen();

    // Committed mp3, change to opus
    const select = container.querySelector('select');
    expect(select).toBeTruthy();
    expect(select.value).toBe('mp3');

    fireEvent.change(select, { target: { value: 'opus' } });

    expect(select.value).toBe('opus');
    // An ovr-badge appears in the yt-dlp group
    expect(container.querySelectorAll('.ovr-badge').length).toBeGreaterThan(0);
  });
});

// ── Reset removes the override ────────────────────────────────────────────────

describe('reset', () => {
  it('reset button removes the ovr-badge for that field', () => {
    // Start with yandex_quality already overridden to '0'
    const { container } = renderOpen(makeCommitted(), {
      yandex_quality: '0',
    });

    expect(container.querySelectorAll('.ovr-badge').length).toBe(1);

    const resetBtn = container.querySelector('.reset-btn');
    expect(resetBtn).toBeTruthy();
    fireEvent.click(resetBtn);

    // After reset, no more ovr-badges
    expect(container.querySelectorAll('.ovr-badge').length).toBe(0);
  });

  it('reset restores the segmented selection to the global default', () => {
    // Committed quality is '2' (FLAC), override to '0' (AAC 64)
    const { container } = renderOpen(makeCommitted(), {
      yandex_quality: '0',
    });

    // AAC 64 is selected
    const aac64Btn = Array.from(container.querySelectorAll('.seg button')).find(
      (b) => b.textContent === 'AAC 64'
    );
    expect(aac64Btn?.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(container.querySelector('.reset-btn'));

    // After reset, FLAC (value '2') should be selected again
    const flacBtn = Array.from(container.querySelectorAll('.seg button')).find(
      (b) => b.textContent === 'FLAC'
    );
    expect(flacBtn?.getAttribute('aria-checked')).toBe('true');
  });

  it('resetting the format override also drops the quality override', () => {
    // Global default mp3/320; override both format and quality, then reset the
    // format — the quality override must be dropped too, otherwise it stays at a
    // value (128) that is not a valid preset for the restored mp3 format.
    const { container } = renderOpen(makeCommitted(), {
      ytdlp_format: 'opus',
      ytdlp_quality: '128',
    });

    const formatSelect = Array.from(container.querySelectorAll('select')).find(
      (s) => s.value === 'opus'
    );
    const formatField = formatSelect.closest('.field');
    fireEvent.click(formatField.querySelector('.reset-btn'));

    // Format reverts to the global default (mp3) and quality falls back to the
    // consistent global 320 (a valid mp3 preset), not the stale 128.
    const selects = Array.from(container.querySelectorAll('select'));
    expect(selects.find((s) => s.value === 'mp3')).toBeTruthy();
    expect(selects.find((s) => s.value === '320')).toBeTruthy();
    expect(selects.find((s) => s.value === '128')).toBeFalsy();
  });
});

// ── Overridden count ──────────────────────────────────────────────────────────

describe('overridden count', () => {
  it('shows count badge when fields differ from global default', () => {
    const { container } = render(
      <ThisRunPanel
        t={t}
        committed={makeCommitted()}
        overrides={{ yandex_quality: '0' }} // differs from committed '2'
        setOverrides={() => {}}
      />
    );
    const badge = container.querySelector('.tr-count');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('1');
  });

  it('does not count an override equal to the global default', () => {
    const { container } = render(
      <ThisRunPanel
        t={t}
        committed={makeCommitted()}
        overrides={{ yandex_quality: '2' }} // same as committed '2'
        setOverrides={() => {}}
      />
    );
    expect(container.querySelector('.tr-count')).toBeNull();
  });

  it('counts multiple independent overrides', () => {
    const { container } = render(
      <ThisRunPanel
        t={t}
        committed={makeCommitted()}
        overrides={{ yandex_quality: '0', ytdlp_format: 'opus' }}
        setOverrides={() => {}}
      />
    );
    const badge = container.querySelector('.tr-count');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('2');
  });
});

// ── yandex_clear_comments is present and overridable ─────────────────────────

describe('yandex_clear_comments', () => {
  it('renders the clear_comments toggle in the yandex group', () => {
    const { container } = renderOpen();
    const labels = container.querySelectorAll('.field-label');
    const found = Array.from(labels).find((el) =>
      el.textContent.includes(t.dl_clear_comments)
    );
    expect(found).toBeTruthy();
  });

  it('shows ovr-badge when yandex_clear_comments is overridden', () => {
    const { container } = renderOpen(makeCommitted(), {
      yandex_clear_comments: '1', // differs from committed '0'
    });
    const badges = container.querySelectorAll('.ovr-badge');
    expect(badges.length).toBeGreaterThan(0);
  });
});

// ── yandex_cover_resolution is present and overridable ───────────────────────

describe('yandex_cover_resolution', () => {
  it('renders the cover_resolution control in the yandex group', () => {
    const { container } = renderOpen();
    expect(container.querySelector('.cover-res')).toBeTruthy();
  });

  it('shows ovr-badge when yandex_cover_resolution is overridden', () => {
    const { container } = renderOpen(makeCommitted(), {
      yandex_cover_resolution: '400', // differs from committed '600'
    });
    const overriddenFields = container.querySelectorAll('.field.overridden');
    expect(overriddenFields.length).toBeGreaterThan(0);
  });
});

// ── ytdlp_quality — preset select and passthrough hiding ─────────────────────

describe('ytdlp_quality preset select', () => {
  it('quality field is hidden when format is "best" (passthrough)', () => {
    const { container } = renderOpen(
      makeCommitted({ ytdlp_format: makeItem('ytdlp_format', 'best') })
    );
    // No num-unit should be rendered
    expect(container.querySelector('.num-unit')).toBeNull();
    // The yt-dlp quality label specifically should not be present
    const qualityLabelText = t.dl_ytdlp_quality;
    const labels = container.querySelectorAll('.field-label');
    const found = Array.from(labels).find(
      (el) => el.textContent === qualityLabelText
    );
    expect(found).toBeFalsy();
  });

  it('quality field is a select (not NumberUnit) when format is "opus"', () => {
    const { container } = renderOpen(
      makeCommitted({ ytdlp_format: makeItem('ytdlp_format', 'opus') })
    );
    expect(container.querySelector('.num-unit')).toBeNull();
    // There should be at least two selects: format and quality
    const selects = container.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  it('format change to "best" hides quality', () => {
    const { container } = renderOpen();
    // Committed format is 'mp3', change to 'best'
    const formatSelect = container.querySelector('select');
    expect(formatSelect).toBeTruthy();
    fireEvent.change(formatSelect, { target: { value: 'best' } });
    expect(container.querySelector('.num-unit')).toBeNull();
  });

  it('format change snaps quality to a valid preset', () => {
    // mp3 committed quality is 320; switching to opus snaps to 160 (opus default)
    const { container } = renderOpen(makeCommitted(), {
      ytdlp_format: 'mp3',
      ytdlp_quality: '320',
    });
    // Change format to opus
    const formatSelect = Array.from(container.querySelectorAll('select')).find(
      (s) => s.value === 'mp3'
    );
    expect(formatSelect).toBeTruthy();
    fireEvent.change(formatSelect, { target: { value: 'opus' } });
    // After snap, quality should be 160 (opus default, since 320 not in opus presets)
    const qualitySelect = Array.from(container.querySelectorAll('select')).find(
      (s) => s.value === '160'
    );
    expect(qualitySelect).toBeTruthy();
  });
});

// ── All SESSION_FIELDS labels are rendered ────────────────────────────────────

describe('all session fields rendered', () => {
  it('renders all yandex session field labels', () => {
    const { container } = renderOpen();
    // yandex_only_music and yandex_stick_to_artist removed from SESSION_FIELDS (UI hidden)
    for (const labelKey of [
      'dl_yandex_quality',
      'dl_lyrics',
      'dl_cover_res',
      'dl_embed',
      'dl_skip',
      'dl_clear_comments',
    ]) {
      const labels = container.querySelectorAll('.field-label');
      const found = Array.from(labels).find((el) =>
        el.textContent.includes(t[labelKey])
      );
      expect(found, `label for ${labelKey} not found`).toBeTruthy();
    }
  });

  it('renders yt-dlp session field labels', () => {
    const { container } = renderOpen();
    for (const labelKey of ['dl_ytdlp_format', 'dl_ytdlp_quality']) {
      const labels = container.querySelectorAll('.field-label');
      const found = Array.from(labels).find((el) =>
        el.textContent.includes(t[labelKey])
      );
      expect(found, `label for ${labelKey} not found`).toBeTruthy();
    }
  });
});

// ── Validation (type + bounds) ────────────────────────────────────────────────

describe('validation', () => {
  // ytdlp_quality is now a preset Select; no free-form number validation needed.

  it('flags a negative cover resolution', () => {
    const { container } = renderOpen();
    const coverInput = container.querySelector(
      '.cover-res input[type="number"]'
    );
    fireEvent.change(coverInput, { target: { value: '-5' } });
    expect(container.querySelector('.field-error')).toBeTruthy();
  });

  it('flags a cover resolution above the max bound', () => {
    const { container } = renderOpen();
    const coverInput = container.querySelector(
      '.cover-res input[type="number"]'
    );
    fireEvent.change(coverInput, { target: { value: '20000' } });
    expect(container.querySelector('.field-error')).toBeTruthy();
  });
});

// ── Group structure ───────────────────────────────────────────────────────────

describe('group structure', () => {
  it('renders two dl-group elements (yandex and ytdlp)', () => {
    const { container } = renderOpen();
    expect(container.querySelectorAll('.dl-group').length).toBe(2);
  });

  it('labels the groups with the correct provider names', () => {
    const { container } = renderOpen();
    const heads = container.querySelectorAll('.gh-name');
    const names = Array.from(heads).map((el) => el.textContent);
    expect(names).toContain(t.dl_group_yandex);
    expect(names).toContain(t.dl_group_ytdlp);
  });
});
