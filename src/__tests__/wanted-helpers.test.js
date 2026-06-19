import { describe, it, expect } from 'vitest';
import {
  mapWantedAlbum,
  formatDuration,
  albumTypeLabel,
  deriveLibraries,
} from '../wanted-helpers.js';

const fullRecord = {
  album_id: 42,
  artist: 'Radiohead',
  title: 'OK Computer',
  release_date: '1997-05-28',
  album_type: 'Album',
  duration: 3200000,
  track_count: 12,
  cover_url: 'https://example.com/cover.jpg',
  root_folder: '/libraries/Lossless',
};

describe('mapWantedAlbum', () => {
  it('maps a full backend record correctly', () => {
    const result = mapWantedAlbum(fullRecord);
    expect(result.id).toBe('42');
    expect(result.artist).toBe('Radiohead');
    expect(result.album).toBe('OK Computer');
    expect(result.year).toBe(1997);
    expect(result.tracks).toBe(12);
    expect(result.durationMs).toBe(3200000);
    expect(result.albumType).toBe('Album');
    expect(result.coverUrl).toBe('https://example.com/cover.jpg');
    expect(result.library).toBe('Lossless');
    expect(result.root_folder).toBe('/libraries/Lossless');
  });

  it('returns null year for release_date "N/A"', () => {
    const result = mapWantedAlbum({ ...fullRecord, release_date: 'N/A' });
    expect(result.year).toBeNull();
  });

  it('returns null year when release_date is missing', () => {
    const result = mapWantedAlbum({ ...fullRecord, release_date: undefined });
    expect(result.year).toBeNull();
  });

  it('returns null year when release_date produces NaN', () => {
    const result = mapWantedAlbum({ ...fullRecord, release_date: 'invalid' });
    expect(result.year).toBeNull();
  });

  it('falls back to "Unknown Artist" when artist is missing', () => {
    const result = mapWantedAlbum({ ...fullRecord, artist: '' });
    expect(result.artist).toBe('Unknown Artist');
  });

  it('falls back to "Unknown Album" when title is missing', () => {
    const result = mapWantedAlbum({ ...fullRecord, title: null });
    expect(result.album).toBe('Unknown Album');
  });

  it('defaults tracks to 0 when track_count is absent', () => {
    const result = mapWantedAlbum({ ...fullRecord, track_count: undefined });
    expect(result.tracks).toBe(0);
  });

  it('defaults durationMs to 0 when duration is absent', () => {
    const result = mapWantedAlbum({ ...fullRecord, duration: undefined });
    expect(result.durationMs).toBe(0);
  });

  it('defaults albumType to "" when album_type is absent', () => {
    const result = mapWantedAlbum({ ...fullRecord, album_type: undefined });
    expect(result.albumType).toBe('');
  });

  it('defaults coverUrl to "" when cover_url is absent', () => {
    const result = mapWantedAlbum({ ...fullRecord, cover_url: undefined });
    expect(result.coverUrl).toBe('');
  });

  it('derives library as last path segment', () => {
    const result = mapWantedAlbum({
      ...fullRecord,
      root_folder: '/music/libraries/Lossless',
    });
    expect(result.library).toBe('Lossless');
  });

  it('returns empty library for empty root_folder', () => {
    const result = mapWantedAlbum({ ...fullRecord, root_folder: '' });
    expect(result.library).toBe('');
  });

  it('returns empty library for undefined root_folder', () => {
    const result = mapWantedAlbum({ ...fullRecord, root_folder: undefined });
    expect(result.library).toBe('');
  });

  it('keeps root_folder verbatim', () => {
    const result = mapWantedAlbum(fullRecord);
    expect(result.root_folder).toBe('/libraries/Lossless');
  });
});

describe('formatDuration', () => {
  it('returns "—" for null', () => {
    expect(formatDuration(null)).toBe('—');
  });

  it('returns "—" for 0 (backend default for missing albums)', () => {
    expect(formatDuration(0)).toBe('—');
  });

  it('formats sub-hour duration as m:ss', () => {
    // 3540000 ms = 3540 s = 59 min 0 s
    expect(formatDuration(3540000)).toBe('59:00');
  });

  it('formats exact minutes as m:00', () => {
    expect(formatDuration(5 * 60 * 1000)).toBe('5:00');
  });

  it('formats seconds correctly', () => {
    expect(formatDuration(75000)).toBe('1:15');
  });

  it('formats multi-hour duration as h:mm:ss', () => {
    expect(formatDuration(3 * 3600 * 1000 + 4 * 60 * 1000 + 5 * 1000)).toBe(
      '3:04:05'
    );
  });

  it('pads minutes and seconds with leading zero in h:mm:ss', () => {
    expect(formatDuration(1 * 3600 * 1000 + 2 * 60 * 1000 + 3 * 1000)).toBe(
      '1:02:03'
    );
  });
});

describe('albumTypeLabel', () => {
  it('returns the raw type for unknown types (passthrough)', () => {
    expect(albumTypeLabel('NotAType', 'en')).toBe('NotAType');
    expect(albumTypeLabel('NotAType', 'ru')).toBe('NotAType');
  });

  it('returns the raw type as fallback when i18n key is missing', () => {
    expect(albumTypeLabel('Album', 'en')).toBe('Album');
    expect(albumTypeLabel('EP', 'en')).toBe('EP');
    expect(albumTypeLabel('Single', 'en')).toBe('Single');
  });

  it('falls back to en when unknown lang is given', () => {
    expect(albumTypeLabel('Album', 'zz')).toBe('Album');
  });
});

describe('deriveLibraries', () => {
  it('returns distinct library names in encounter order', () => {
    const albums = [
      { library: 'Lossless' },
      { library: 'Lossy' },
      { library: 'Lossless' },
      { library: 'Classical' },
    ];
    expect(deriveLibraries(albums)).toEqual(['Lossless', 'Lossy', 'Classical']);
  });

  it('excludes albums with empty library', () => {
    const albums = [{ library: '' }, { library: 'Lossless' }, { library: '' }];
    expect(deriveLibraries(albums)).toEqual(['Lossless']);
  });

  it('returns empty array when all libraries are empty', () => {
    const albums = [{ library: '' }, { library: '' }];
    expect(deriveLibraries(albums)).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(deriveLibraries([])).toEqual([]);
  });

  it('preserves encounter order, not alphabetical', () => {
    const albums = [{ library: 'Z' }, { library: 'A' }, { library: 'M' }];
    expect(deriveLibraries(albums)).toEqual(['Z', 'A', 'M']);
  });
});
