import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import SelectStep from '../select-step';
import { I18N } from '../i18n';

afterEach(cleanup);

function renderSelect(fetchState, lang = 'en') {
  return render(
    <SelectStep
      t={I18N[lang]}
      lang={lang}
      fetchState={fetchState}
      onRefetch={() => {}}
      albums={[]}
      selected={new Set()}
      setSelected={() => {}}
      sources={{}}
      setSources={() => {}}
      onSearch={() => {}}
      availableSources={[]}
    />
  );
}

describe('SelectStep — i18n-resolved empty/error states', () => {
  it('renders the empty state via i18n keys (EN + RU)', () => {
    const en = renderSelect('empty', 'en');
    expect(en.getByText(I18N.en.empty_title)).toBeTruthy();
    expect(en.getByText(I18N.en.empty_body)).toBeTruthy();
    cleanup();
    const ru = renderSelect('empty', 'ru');
    expect(ru.getByText(I18N.ru.empty_title)).toBeTruthy();
    expect(ru.getByText(I18N.ru.empty_body)).toBeTruthy();
  });

  it('renders the connection-error state via i18n keys (EN + RU)', () => {
    const en = renderSelect('error', 'en');
    expect(en.getByText(I18N.en.conn_error_title)).toBeTruthy();
    expect(en.getByText(I18N.en.conn_error_body)).toBeTruthy();
    cleanup();
    const ru = renderSelect('error', 'ru');
    expect(ru.getByText(I18N.ru.conn_error_title)).toBeTruthy();
    expect(ru.getByText(I18N.ru.conn_error_body)).toBeTruthy();
  });
});
