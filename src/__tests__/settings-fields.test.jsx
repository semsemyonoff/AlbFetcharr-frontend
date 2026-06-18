import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import {
  OriginBadge,
  ResetBtn,
  Field,
  Toggle,
  ToggleRow,
  Segmented,
  Select,
  TextInput,
  NumberUnit,
  CoverResolution,
  SecretField,
} from '../settings-fields';
import { I18N } from '../i18n';

afterEach(cleanup);

const t = I18N.en;

// ── OriginBadge ──────────────────────────────────────────────────────────────

describe('OriginBadge', () => {
  it('renders "saved" badge for source="db"', () => {
    const { container } = render(<OriginBadge source="db" t={t} />);
    const badge = container.querySelector('.origin-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe(t.origin_saved);
    expect(badge.classList.contains('saved')).toBe(true);
  });

  it('renders "env" badge for source="env"', () => {
    const { container } = render(<OriginBadge source="env" t={t} />);
    const badge = container.querySelector('.origin-badge');
    expect(badge.textContent).toBe(t.origin_env);
    expect(badge.classList.contains('env')).toBe(true);
  });

  it('renders "default" badge for source="default"', () => {
    const { container } = render(<OriginBadge source="default" t={t} />);
    const badge = container.querySelector('.origin-badge');
    expect(badge.textContent).toBe(t.origin_default);
    expect(badge.classList.contains('default')).toBe(true);
  });

  it('renders nothing when source is null', () => {
    const { container } = render(<OriginBadge source={null} t={t} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when source is undefined', () => {
    const { container } = render(<OriginBadge t={t} />);
    expect(container.firstChild).toBeNull();
  });
});

// ── ResetBtn ─────────────────────────────────────────────────────────────────

describe('ResetBtn', () => {
  it('renders when show=true', () => {
    const { container } = render(
      <ResetBtn show={true} title="Reset" onClick={() => {}} />
    );
    expect(container.querySelector('.reset-btn')).toBeTruthy();
  });

  it('renders nothing when show=false', () => {
    const { container } = render(
      <ResetBtn show={false} title="Reset" onClick={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when show is undefined', () => {
    const { container } = render(<ResetBtn title="Reset" onClick={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(
      <ResetBtn show={true} title="Reset" onClick={onClick} />
    );
    fireEvent.click(container.querySelector('.reset-btn'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ── Field ────────────────────────────────────────────────────────────────────

describe('Field', () => {
  it('renders label and children', () => {
    const { container } = render(
      <Field label="My label" source="default" t={t} canReset={false}>
        <input type="text" defaultValue="val" />
      </Field>
    );
    expect(container.querySelector('.field-label').textContent).toBe(
      'My label'
    );
    expect(container.querySelector('input')).toBeTruthy();
  });

  it('adds has-error class when error is truthy', () => {
    const { container } = render(
      <Field label="l" source="default" t={t} canReset={false} error="bad">
        <input />
      </Field>
    );
    expect(container.querySelector('.field.has-error')).toBeTruthy();
  });

  it('shows error message with alert icon', () => {
    const { container } = render(
      <Field
        label="l"
        source="default"
        t={t}
        canReset={false}
        error="invalid url"
      >
        <input />
      </Field>
    );
    const err = container.querySelector('.field-error');
    expect(err).toBeTruthy();
    expect(err.textContent).toContain('invalid url');
  });

  it('shows hint when no error', () => {
    const { container } = render(
      <Field label="l" source="default" t={t} canReset={false} hint="some hint">
        <input />
      </Field>
    );
    expect(container.querySelector('.field-hint').textContent).toBe(
      'some hint'
    );
  });

  it('hides hint when error is shown', () => {
    const { container } = render(
      <Field
        label="l"
        source="default"
        t={t}
        canReset={false}
        hint="some hint"
        error="bad"
      >
        <input />
      </Field>
    );
    expect(container.querySelector('.field-hint')).toBeNull();
  });

  it('adds is-disabled class when disabled', () => {
    const { container } = render(
      <Field label="l" source="default" t={t} canReset={false} disabled>
        <input />
      </Field>
    );
    expect(container.querySelector('.field.is-disabled')).toBeTruthy();
  });
});

// ── Toggle ───────────────────────────────────────────────────────────────────

describe('Toggle', () => {
  it('fires onChange(true) when toggled off→on', () => {
    const onChange = vi.fn();
    const { container } = render(<Toggle value={false} onChange={onChange} />);
    fireEvent.click(container.querySelector('.tgl'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('fires onChange(false) when toggled on→off', () => {
    const onChange = vi.fn();
    const { container } = render(<Toggle value={true} onChange={onChange} />);
    fireEvent.click(container.querySelector('.tgl'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Toggle value={false} onChange={onChange} disabled={true} />
    );
    fireEvent.click(container.querySelector('.tgl'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('sets aria-checked="true" when value is true', () => {
    const { container } = render(<Toggle value={true} onChange={() => {}} />);
    expect(container.querySelector('.tgl').getAttribute('aria-checked')).toBe(
      'true'
    );
  });

  it('sets aria-checked="false" when value is false', () => {
    const { container } = render(<Toggle value={false} onChange={() => {}} />);
    expect(container.querySelector('.tgl').getAttribute('aria-checked')).toBe(
      'false'
    );
  });
});

// ── Segmented ────────────────────────────────────────────────────────────────

describe('Segmented', () => {
  const options = [
    { value: '0', label: 'AAC 64' },
    { value: '1', label: 'AAC 192' },
    { value: '2', label: 'FLAC' },
  ];

  it('fires onChange with the backend value string when an option is clicked', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <Segmented value="0" options={options} onChange={onChange} />
    );
    fireEvent.click(getByText('AAC 192'));
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('marks the current value as "on"', () => {
    const { getByText } = render(
      <Segmented value="1" options={options} onChange={() => {}} />
    );
    expect(getByText('AAC 192').classList.contains('on')).toBe(true);
    expect(getByText('AAC 64').classList.contains('on')).toBe(false);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <Segmented
        value="0"
        options={options}
        onChange={onChange}
        disabled={true}
      />
    );
    fireEvent.click(getByText('AAC 192'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('resolves labelKey options when t is provided', () => {
    const opts = [
      { value: 'none', labelKey: 'lyr_none' },
      { value: 'lrc', labelKey: 'lyr_lrc' },
    ];
    const { getByText } = render(
      <Segmented value="none" options={opts} onChange={() => {}} t={t} />
    );
    expect(getByText(t.lyr_none)).toBeTruthy();
    expect(getByText(t.lyr_lrc)).toBeTruthy();
  });

  it('fires onChange with the backend string value for string-only options', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <Segmented value="a" options={['a', 'b', 'c']} onChange={onChange} />
    );
    fireEvent.click(getByText('b'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

// ── Select ───────────────────────────────────────────────────────────────────

describe('Select', () => {
  const options = [
    { value: 'flac', label: 'FLAC' },
    { value: 'mp3', label: 'MP3' },
    { value: 'opus', label: 'OPUS' },
  ];

  it('fires onChange with the selected backend value', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Select value="flac" options={options} onChange={onChange} />
    );
    fireEvent.change(container.querySelector('select'), {
      target: { value: 'mp3' },
    });
    expect(onChange).toHaveBeenCalledWith('mp3');
  });

  it('reflects the current value', () => {
    const { container } = render(
      <Select value="opus" options={options} onChange={() => {}} />
    );
    expect(container.querySelector('select').value).toBe('opus');
  });

  it('is disabled when disabled=true', () => {
    const { container } = render(
      <Select
        value="flac"
        options={options}
        onChange={() => {}}
        disabled={true}
      />
    );
    expect(container.querySelector('select').disabled).toBe(true);
  });

  it('resolves labelKey when t is provided', () => {
    const opts = [{ value: 'lrc', labelKey: 'lyr_lrc' }];
    const { container } = render(
      <Select value="lrc" options={opts} onChange={() => {}} t={t} />
    );
    expect(container.querySelector('option').textContent).toBe(t.lyr_lrc);
  });
});

// ── TextInput ─────────────────────────────────────────────────────────────────

describe('TextInput', () => {
  it('fires onChange with the new string value', () => {
    const onChange = vi.fn();
    const { container } = render(<TextInput value="" onChange={onChange} />);
    fireEvent.change(container.querySelector('input'), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('adds mono class when mono=true', () => {
    const { container } = render(
      <TextInput value="" onChange={() => {}} mono />
    );
    expect(container.querySelector('input').classList.contains('mono')).toBe(
      true
    );
  });

  it('adds invalid class when error is truthy', () => {
    const { container } = render(
      <TextInput value="" onChange={() => {}} error="bad" />
    );
    expect(container.querySelector('input').classList.contains('invalid')).toBe(
      true
    );
  });

  it('is disabled when disabled=true', () => {
    const { container } = render(
      <TextInput value="" onChange={() => {}} disabled />
    );
    expect(container.querySelector('input').disabled).toBe(true);
  });
});

// ── NumberUnit ───────────────────────────────────────────────────────────────

describe('NumberUnit', () => {
  it('fires onChange with a number when a valid value is typed', () => {
    const onChange = vi.fn();
    const { container } = render(
      <NumberUnit value={5} unit="s" onChange={onChange} min={0} />
    );
    fireEvent.change(container.querySelector('input'), {
      target: { value: '10' },
    });
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('fires onChange with empty string when the input is cleared', () => {
    const onChange = vi.fn();
    const { container } = render(
      <NumberUnit value={5} unit="s" onChange={onChange} min={0} />
    );
    fireEvent.change(container.querySelector('input'), {
      target: { value: '' },
    });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('is disabled when disabled=true', () => {
    const { container } = render(
      <NumberUnit value={5} unit="s" onChange={() => {}} min={0} disabled />
    );
    expect(container.querySelector('input').disabled).toBe(true);
  });

  it('adds invalid class when error is truthy', () => {
    const { container } = render(
      <NumberUnit value={-1} unit="s" onChange={() => {}} min={0} error="bad" />
    );
    expect(
      container.querySelector('.num-unit').classList.contains('invalid')
    ).toBe(true);
  });

  it('renders the unit label', () => {
    const { container } = render(
      <NumberUnit value={5} unit="seconds" onChange={() => {}} />
    );
    expect(container.querySelector('.unit').textContent).toBe('seconds');
  });

  it('omits unit span when unit is not provided', () => {
    const { container } = render(<NumberUnit value={5} onChange={() => {}} />);
    expect(container.querySelector('.unit')).toBeNull();
  });
});

// ── CoverResolution ───────────────────────────────────────────────────────────

describe('CoverResolution', () => {
  it('fires onChange with number when typing a value', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CoverResolution
        value={{ number: '', original: false }}
        onChange={onChange}
        t={t}
      />
    );
    const input = container.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: '600' } });
    expect(onChange).toHaveBeenCalledWith({ number: 600, original: false });
  });

  it('fires onChange with original=true and clears number when checkbox is checked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <CoverResolution
        value={{ number: 600, original: false }}
        onChange={onChange}
        t={t}
      />
    );
    const checkbox = container.querySelector('input[type="checkbox"]');
    fireEvent.click(checkbox);
    // number is cleared when switching to "original" (matches coverResToUi semantics)
    expect(onChange).toHaveBeenCalledWith({ number: '', original: true });
  });

  it('disables the number input when original=true', () => {
    const { container } = render(
      <CoverResolution
        value={{ number: '', original: true }}
        onChange={() => {}}
        t={t}
      />
    );
    expect(container.querySelector('input[type="number"]').disabled).toBe(true);
  });

  it('shows the px unit label', () => {
    const { container } = render(
      <CoverResolution
        value={{ number: 500, original: false }}
        onChange={() => {}}
        t={t}
      />
    );
    expect(container.querySelector('.unit').textContent).toBe(t.units_px);
  });
});

// ── SecretField ───────────────────────────────────────────────────────────────

function makeSecretItem(overrides = {}) {
  return {
    key: 'yandex_token',
    value: null,
    source: 'default',
    is_set: false,
    secret: true,
    preview: null,
    ...overrides,
  };
}

describe('SecretField — blocked', () => {
  it('renders blocked message when encryptionReady is false', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue={null}
        encryptionReady={false}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.blocked')).toBeTruthy();
    expect(container.textContent).toContain(t.secret_blocked);
  });

  it('does not render an input when blocked', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue={null}
        encryptionReady={false}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('input')).toBeNull();
  });
});

describe('SecretField — unset', () => {
  it('renders unset state when not set and encryptionReady', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.unset')).toBeTruthy();
    expect(container.textContent).toContain(t.secret_not_set);
  });

  it('transitions to editing when Set button is clicked', () => {
    const { container, getByText } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    fireEvent.click(getByText(t.secret_save));
    expect(container.querySelector('.secret-field.editing')).toBeTruthy();
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
  });
});

describe('SecretField — editing', () => {
  function renderEditing(onSet = vi.fn()) {
    const result = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={onSet}
        onClear={() => {}}
      />
    );
    fireEvent.click(result.getByText(t.secret_save));
    return result;
  }

  it('calls onSet with trimmed plaintext when confirm button is clicked', () => {
    const onSet = vi.fn();
    const { container } = renderEditing(onSet);
    const input = container.querySelector('input[type="password"]');
    fireEvent.change(input, { target: { value: '  mysecrettoken  ' } });
    fireEvent.click(container.querySelector('.btn-primary'));
    expect(onSet).toHaveBeenCalledWith('mysecrettoken');
  });

  it('calls onSet on Enter key', () => {
    const onSet = vi.fn();
    const { container } = renderEditing(onSet);
    const input = container.querySelector('input[type="password"]');
    fireEvent.change(input, { target: { value: 'token123' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSet).toHaveBeenCalledWith('token123');
  });

  it('cancels editing on Escape key and returns to unset', () => {
    const { container } = renderEditing();
    const input = container.querySelector('input[type="password"]');
    fireEvent.change(input, { target: { value: 'something' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(container.querySelector('.secret-field.editing')).toBeNull();
    expect(container.querySelector('.secret-field.unset')).toBeTruthy();
  });

  it('confirm button is disabled when input is blank', () => {
    const onSet = vi.fn();
    const { container } = renderEditing(onSet);
    const btn = container.querySelector('.btn-primary');
    expect(btn.disabled).toBe(true);
  });

  it('does not call onSet when confirm is clicked with blank input', () => {
    const onSet = vi.fn();
    const { container } = renderEditing(onSet);
    fireEvent.click(container.querySelector('.btn-primary'));
    expect(onSet).not.toHaveBeenCalled();
  });

  it('toggles the password input to text on eye button click', () => {
    const { container } = renderEditing();
    const eyeBtn = container.querySelector('.eye');
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
    fireEvent.click(eyeBtn);
    expect(container.querySelector('input[type="text"]')).toBeTruthy();
    fireEvent.click(eyeBtn);
    expect(container.querySelector('input[type="password"]')).toBeTruthy();
  });

  it('cancel button exits editing mode', () => {
    const { container, getByText } = renderEditing();
    fireEvent.click(getByText(t.secret_cancel));
    expect(container.querySelector('.secret-field.editing')).toBeNull();
  });
});

describe('SecretField — set (db)', () => {
  it('renders masked API preview for a db secret', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem({
          is_set: true,
          source: 'db',
          preview: '••••3f9a',
        })}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.set')).toBeTruthy();
    expect(container.textContent).toContain('••••3f9a');
    expect(container.querySelector('input')).toBeNull();
  });

  it('shows Replace and Clear for a db secret', () => {
    const { getByText } = render(
      <SecretField
        committedItem={makeSecretItem({
          is_set: true,
          source: 'db',
          preview: '••••3f9a',
        })}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(getByText(t.secret_replace)).toBeTruthy();
    expect(getByText(t.secret_clear)).toBeTruthy();
  });

  it('calls onClear when Clear button is clicked', () => {
    const onClear = vi.fn();
    const { getByText } = render(
      <SecretField
        committedItem={makeSecretItem({
          is_set: true,
          source: 'db',
          preview: '••••3f9a',
        })}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={onClear}
      />
    );
    fireEvent.click(getByText(t.secret_clear));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('SecretField — env', () => {
  it('renders env state for an env-provided secret (is_set true)', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem({ is_set: true, source: 'env' })}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.env')).toBeTruthy();
    expect(container.textContent).toContain(t.secret_from_env);
  });

  it('shows Replace but not Clear for an env secret', () => {
    const { getByText, queryByText } = render(
      <SecretField
        committedItem={makeSecretItem({ is_set: true, source: 'env' })}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(getByText(t.secret_replace)).toBeTruthy();
    expect(queryByText(t.secret_clear)).toBeNull();
  });

  it('collapses to unset when is_set is false even if source=env', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem({ is_set: false, source: 'env' })}
        draftValue={null}
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.env')).toBeNull();
    expect(container.querySelector('.secret-field.unset')).toBeTruthy();
  });
});

describe('SecretField — just-entered draft value', () => {
  it('shows masked last-4 of draftValue', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue="mysecrettoken123"
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.set')).toBeTruthy();
    expect(container.querySelector('.tail').textContent).toBe('n123');
  });

  it('shows Replace and Clear for a just-entered draft value', () => {
    const { getByText } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue="mysecrettoken123"
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(getByText(t.secret_replace)).toBeTruthy();
    expect(getByText(t.secret_clear)).toBeTruthy();
  });

  it('calls onClear when Clear is clicked on a draft value', () => {
    const onClear = vi.fn();
    const { getByText } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue="mytoken"
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={onClear}
      />
    );
    fireEvent.click(getByText(t.secret_clear));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not show "just-entered" state when draftValue is empty string', () => {
    const { container } = render(
      <SecretField
        committedItem={makeSecretItem()}
        draftValue=""
        encryptionReady={true}
        t={t}
        onSet={() => {}}
        onClear={() => {}}
      />
    );
    expect(container.querySelector('.secret-field.unset')).toBeTruthy();
  });
});

describe('SecretField — ToggleRow canReset', () => {
  it('ToggleRow shows ResetBtn when canReset=true', () => {
    const onReset = vi.fn();
    const { container } = render(
      <ToggleRow
        label="Embed cover"
        source="db"
        t={t}
        canReset={true}
        onReset={onReset}
        value={true}
        onChange={() => {}}
      />
    );
    expect(container.querySelector('.reset-btn')).toBeTruthy();
  });

  it('ToggleRow does not show ResetBtn when canReset=false', () => {
    const { container } = render(
      <ToggleRow
        label="Embed cover"
        source="default"
        t={t}
        canReset={false}
        onReset={() => {}}
        value={false}
        onChange={() => {}}
      />
    );
    expect(container.querySelector('.reset-btn')).toBeNull();
  });

  it('ToggleRow fires onChange when the toggle is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ToggleRow
        label="Embed cover"
        source="default"
        t={t}
        canReset={false}
        onReset={() => {}}
        value={false}
        onChange={onChange}
      />
    );
    fireEvent.click(container.querySelector('.tgl'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
