import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Cover } from '../cover.jsx';

afterEach(cleanup);

describe('Cover', () => {
  it('renders an <img> with the cover URL when provided', () => {
    const { container } = render(
      <Cover coverUrl="https://example.com/art.jpg" fallback="Radiohead" />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/art.jpg');
    expect(container.querySelector('.vinyl-stripes')).toBeNull();
  });

  it('renders the vinyl-stripe placeholder with initials when coverUrl is absent', () => {
    const { container } = render(<Cover fallback="OK Computer" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.vinyl-stripes')).toBeTruthy();
    expect(container.querySelector('span').textContent).toBe('OK');
  });

  it('renders placeholder when coverUrl is an empty string', () => {
    const { container } = render(<Cover coverUrl="" fallback="Boards of Canada" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.vinyl-stripes')).toBeTruthy();
  });

  it('falls back to vinyl-stripe placeholder on image error', () => {
    const { container } = render(
      <Cover coverUrl="https://example.com/broken.jpg" fallback="Aphex Twin" />
    );
    const img = container.querySelector('img');
    expect(img).toBeTruthy();

    fireEvent.error(img);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.vinyl-stripes')).toBeTruthy();
    expect(container.querySelector('span').textContent).toBe('Ap');
  });

  it('applies the lg class when the lg prop is true', () => {
    const { container } = render(<Cover lg fallback="Mogwai" />);
    expect(container.querySelector('.cover.lg')).toBeTruthy();
  });

  it('does not apply the lg class by default', () => {
    const { container } = render(<Cover fallback="Mogwai" />);
    expect(container.querySelector('.cover')).toBeTruthy();
    expect(container.querySelector('.cover.lg')).toBeNull();
  });

  it('uses empty initials when fallback is absent', () => {
    const { container } = render(<Cover />);
    expect(container.querySelector('span').textContent).toBe('');
  });
});
