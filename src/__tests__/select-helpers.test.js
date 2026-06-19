import { describe, it, expect } from 'vitest';
import { sortAlbums, filterAlbums, paginate } from '../select-helpers.js';

const mockAlbums = [
  {
    id: 'alb-1',
    artist: 'Radiohead',
    album: 'OK Computer',
    year: 1997,
    addedDaysAgo: 5,
    tracks: 12,
    library: 'Lossless',
    status: 'missing',
  },
  {
    id: 'alb-2',
    artist: 'Mastodon',
    album: 'Leviathan',
    year: 2004,
    addedDaysAgo: 10,
    tracks: 9,
    library: 'MP3',
    status: 'missing',
  },
  {
    id: 'alb-3',
    artist: 'Aphex Twin',
    album: 'Selected Ambient Works',
    year: 1992,
    addedDaysAgo: 2,
    tracks: 13,
    library: 'Lossless',
    status: 'done',
  },
  {
    id: 'alb-4',
    artist: 'Tool',
    album: 'Lateralus',
    year: 2001,
    addedDaysAgo: 15,
    tracks: 13,
    library: 'Vinyl',
    status: 'missing',
  },
];

describe('sortAlbums', () => {
  it('sorts by artist ascending', () => {
    const sorted = sortAlbums(mockAlbums, 'artist', 'asc');
    expect(sorted.map((a) => a.artist)).toEqual([
      'Aphex Twin',
      'Mastodon',
      'Radiohead',
      'Tool',
    ]);
  });

  it('sorts by artist descending', () => {
    const sorted = sortAlbums(mockAlbums, 'artist', 'desc');
    expect(sorted.map((a) => a.artist)).toEqual([
      'Tool',
      'Radiohead',
      'Mastodon',
      'Aphex Twin',
    ]);
  });

  it('sorts by album ascending', () => {
    const sorted = sortAlbums(mockAlbums, 'album', 'asc');
    expect(sorted[0].album).toBe('Lateralus');
    expect(sorted[sorted.length - 1].album).toBe('Selected Ambient Works');
  });

  it('sorts by year ascending', () => {
    const sorted = sortAlbums(mockAlbums, 'year', 'asc');
    expect(sorted.map((a) => a.year)).toEqual([1992, 1997, 2001, 2004]);
  });

  it('sorts by year descending', () => {
    const sorted = sortAlbums(mockAlbums, 'year', 'desc');
    expect(sorted.map((a) => a.year)).toEqual([2004, 2001, 1997, 1992]);
  });

  it('sorts by added descending (recently added first)', () => {
    const sorted = sortAlbums(mockAlbums, 'added', 'desc');
    expect(sorted.map((a) => a.addedDaysAgo)).toEqual([2, 5, 10, 15]);
  });

  it('sorts by library ascending', () => {
    const sorted = sortAlbums(mockAlbums, 'library', 'asc');
    expect(sorted.map((a) => a.library)).toEqual([
      'Lossless',
      'Lossless',
      'MP3',
      'Vinyl',
    ]);
  });

  it('sorts by library descending', () => {
    const sorted = sortAlbums(mockAlbums, 'library', 'desc');
    expect(sorted.map((a) => a.library)).toEqual([
      'Vinyl',
      'MP3',
      'Lossless',
      'Lossless',
    ]);
  });

  it('sorts by tracks ascending', () => {
    const sorted = sortAlbums(mockAlbums, 'tracks', 'asc');
    expect(sorted.map((a) => a.tracks)).toEqual([9, 12, 13, 13]);
  });

  it('sorts by tracks descending', () => {
    const sorted = sortAlbums(mockAlbums, 'tracks', 'desc');
    expect(sorted.map((a) => a.tracks)).toEqual([13, 13, 12, 9]);
  });

  it('does not mutate original array', () => {
    const original = [...mockAlbums];
    sortAlbums(mockAlbums, 'artist', 'asc');
    expect(mockAlbums).toEqual(original);
  });
});

describe('filterAlbums', () => {
  it('returns all albums when no filter', () => {
    const filtered = filterAlbums(mockAlbums);
    expect(filtered).toHaveLength(4);
  });

  it('filters by artist name', () => {
    const filtered = filterAlbums(mockAlbums, 'Radiohead');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].artist).toBe('Radiohead');
  });

  it('filters by album name', () => {
    const filtered = filterAlbums(mockAlbums, 'Leviathan');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].album).toBe('Leviathan');
  });

  it('filters by year', () => {
    const filtered = filterAlbums(mockAlbums, '2001');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].year).toBe(2001);
  });

  it('filters by query case-insensitively', () => {
    const filtered = filterAlbums(mockAlbums, 'TOOL');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].artist).toBe('Tool');
  });

  it('returns empty array when no match', () => {
    const filtered = filterAlbums(mockAlbums, 'Nonexistent');
    expect(filtered).toHaveLength(0);
  });

  it('trims query whitespace', () => {
    const filtered = filterAlbums(mockAlbums, '  Tool  ');
    expect(filtered).toHaveLength(1);
  });

  it('filters by library substring (case-insensitive)', () => {
    const filtered = filterAlbums(mockAlbums, 'loss');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((a) => a.library === 'Lossless')).toBe(true);
  });

  it('filters by exact library name', () => {
    const filtered = filterAlbums(mockAlbums, 'Vinyl');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].artist).toBe('Tool');
  });

  it('returns empty when library does not match', () => {
    const filtered = filterAlbums(mockAlbums, 'FLAC');
    expect(filtered).toHaveLength(0);
  });
});

describe('paginate', () => {
  it('paginates correctly', () => {
    const result = paginate(mockAlbums, 1, 2);
    expect(result.visible).toHaveLength(2);
    expect(result.visible[0].id).toBe('alb-1');
    expect(result.visible[1].id).toBe('alb-2');
  });

  it('handles second page', () => {
    const result = paginate(mockAlbums, 2, 2);
    expect(result.visible).toHaveLength(2);
    expect(result.visible[0].id).toBe('alb-3');
    expect(result.visible[1].id).toBe('alb-4');
  });

  it('handles request for page beyond available', () => {
    const result = paginate(mockAlbums, 10, 2);
    expect(result.safePage).toBe(2);
    expect(result.pages).toBe(2);
  });

  it('calculates correct page numbers', () => {
    const result = paginate(mockAlbums, 1, 2);
    expect(result.safePage).toBe(1);
    expect(result.pages).toBe(2);
    expect(result.total).toBe(4);
  });

  it('calculates start index correctly', () => {
    const result = paginate(mockAlbums, 2, 3);
    expect(result.start).toBe(3);
    expect(result.visible).toEqual(mockAlbums.slice(3, 6));
  });

  it('handles single page', () => {
    const result = paginate(mockAlbums, 1, 100);
    expect(result.pages).toBe(1);
    expect(result.visible).toEqual(mockAlbums);
  });

  it('handles empty array', () => {
    const result = paginate([], 1, 10);
    expect(result.visible).toHaveLength(0);
    expect(result.pages).toBe(1);
    expect(result.safePage).toBe(1);
  });
});
