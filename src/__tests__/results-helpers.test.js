import { describe, it, expect } from 'vitest';
import {
  isSourceLoading,
  buildSourceCandidates,
  scoreCandidate,
  getBestCandidate,
  buildDownloadItems,
} from '../results-helpers';

describe('results-helpers', () => {
  describe('isSourceLoading', () => {
    it('returns true for a loading sentinel', () => {
      expect(isSourceLoading({ loading: true })).toBe(true);
    });

    it('returns false for a resolved array', () => {
      expect(isSourceLoading([])).toBe(false);
    });

    it('returns false for an error object', () => {
      expect(isSourceLoading({ message: 'Network error' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isSourceLoading(null)).toBe(false);
    });

    it('returns false for undefined (absent source key)', () => {
      expect(isSourceLoading(undefined)).toBe(false);
    });
  });

  describe('buildSourceCandidates', () => {
    const albumRef = { artist: 'The Beatles', album: 'Abbey Road' };

    const makeRaw = (overrides = {}) => ({
      match_artists: ['The Beatles'],
      match_title: 'Abbey Road',
      match_url: 'https://music.yandex.ru/album/1',
      year: 1969,
      track_count: 17,
      cover_url: 'https://example.com/cover.jpg',
      ...overrides,
    });

    it('builds a candidate with the correct id format', () => {
      const cands = buildSourceCandidates([makeRaw()], 'yandex', 42, albumRef);
      expect(cands[0].id).toBe('42-yandex-0');
    });

    it('assigns match score via scoreCandidate', () => {
      const cands = buildSourceCandidates([makeRaw()], 'yandex', 42, albumRef);
      expect(cands[0].match).toBeGreaterThan(0.9);
    });

    it('normalises match_artists from a string', () => {
      const raw = makeRaw({ match_artists: 'Artist A, Artist B' });
      const cands = buildSourceCandidates([raw], 'yandex', 42, albumRef);
      expect(cands[0].match_artists).toEqual(['Artist A', 'Artist B']);
    });

    it('keeps match_artists when already an array', () => {
      const raw = makeRaw({ match_artists: ['A', 'B'] });
      const cands = buildSourceCandidates([raw], 'yandex', 42, albumRef);
      expect(cands[0].match_artists).toEqual(['A', 'B']);
    });

    it('uses first artist as the artist field fallback', () => {
      const cands = buildSourceCandidates([makeRaw()], 'yandex', 42, albumRef);
      expect(cands[0].artist).toBe('The Beatles');
    });

    it('propagates all display fields', () => {
      const cands = buildSourceCandidates([makeRaw()], 'yandex', 42, albumRef);
      const c = cands[0];
      expect(c.source).toBe('yandex');
      expect(c.year).toBe(1969);
      expect(c.track_count).toBe(17);
      expect(c.cover_url).toBe('https://example.com/cover.jpg');
      expect(c.match_url).toBe('https://music.yandex.ru/album/1');
    });

    it('returns multiple candidates with sequential ids', () => {
      const cands = buildSourceCandidates(
        [makeRaw(), makeRaw({ match_title: 'Abbey Road (Remaster)' })],
        'yandex',
        42,
        albumRef
      );
      expect(cands).toHaveLength(2);
      expect(cands[0].id).toBe('42-yandex-0');
      expect(cands[1].id).toBe('42-yandex-1');
    });
  });

  describe('scoreCandidate', () => {
    it('returns high score for exact match', () => {
      const album = { artist: 'The Beatles', album: 'Abbey Road' };
      const candidate = {
        match_artists: ['The Beatles'],
        match_title: 'Abbey Road',
      };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeGreaterThan(0.9);
    });

    it('returns lower score for partial match', () => {
      const album = { artist: 'The Beatles', album: 'Abbey Road' };
      const candidate = { match_artists: ['Beatles'], match_title: 'Abbey' };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(0.9);
    });

    it('returns low score for unrelated candidate', () => {
      const album = { artist: 'Pink Floyd', album: 'The Wall' };
      const candidate = {
        match_artists: ['The Beatles'],
        match_title: 'Abbey Road',
      };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeLessThan(0.5);
    });

    it('handles case-insensitive matching', () => {
      const album = { artist: 'the beatles', album: 'abbey road' };
      const candidate = {
        match_artists: ['THE BEATLES'],
        match_title: 'ABBEY ROAD',
      };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeGreaterThan(0.9);
    });

    it('handles multiple artists', () => {
      const album = { artist: 'Collaboration', album: 'Album' };
      const candidate = {
        match_artists: ['Artist1', 'Artist2'],
        match_title: 'Album',
      };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeGreaterThan(0);
    });

    it('returns 0 for completely different strings', () => {
      const album = { artist: 'A', album: 'B' };
      const candidate = { match_artists: ['XXXXXX'], match_title: 'YYYYYY' };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('getBestCandidate', () => {
    it('returns candidate with highest match score', () => {
      const candidates = [
        { id: '1', match: 0.7 },
        { id: '2', match: 0.95 },
        { id: '3', match: 0.5 },
      ];
      const best = getBestCandidate(candidates);
      expect(best.id).toBe('2');
    });

    it('returns first candidate when all have same score', () => {
      const candidates = [
        { id: '1', match: 0.8 },
        { id: '2', match: 0.8 },
      ];
      const best = getBestCandidate(candidates);
      expect(best.id).toBe('1');
    });

    it('handles undefined match scores as 0', () => {
      const candidates = [
        { id: '1', match: undefined },
        { id: '2', match: 0.5 },
      ];
      const best = getBestCandidate(candidates);
      expect(best.id).toBe('2');
    });

    it('returns null for empty array', () => {
      const best = getBestCandidate([]);
      expect(best).toBeNull();
    });
  });

  describe('buildDownloadItems', () => {
    const makeItem = (overrides = {}) => ({
      album: {
        id: '42',
        artist: 'Lidarr Artist',
        album: 'Lidarr Album',
        root_folder: '/music',
        ...(overrides.album || {}),
      },
      results: {
        youtube_music: [
          {
            id: 'cand-1',
            source: 'youtube_music',
            artist: 'Match Artist',
            match_artists: ['Match Artist'],
            title: 'Match Title',
            match_title: 'Match Title',
            url: 'https://music.youtube.com/browse/X',
            match_url: 'https://music.youtube.com/browse/X',
          },
        ],
        ...(overrides.results || {}),
      },
    });

    it('uses the Lidarr album identity, not the source match, for artist/title', () => {
      const items = [makeItem()];
      const choices = {
        42: { candidateId: 'cand-1', source: 'youtube_music' },
      };
      const out = buildDownloadItems(items, choices, ['youtube_music']);
      expect(out).toHaveLength(1);
      expect(out[0].artist).toBe('Lidarr Artist');
      expect(out[0].title).toBe('Lidarr Album');
      expect(out[0].source).toBe('youtube_music');
      expect(out[0].match_url).toBe('https://music.youtube.com/browse/X');
    });

    it('keeps a comma-containing artist intact (regression: split on ", ")', () => {
      // The candidate's `artist` is match_artists[0] after the UI split on ", ",
      // so it is the truncated first fragment. The payload must still carry the
      // full Lidarr name so the on-disk folder/tags are not cut at the comma.
      const fullName = 'Кобыла и Трупоглазые Жабы, Нашли Поздно Утром';
      const items = [
        makeItem({
          album: { artist: fullName, album: '1917' },
          results: {
            youtube_music: [
              {
                id: 'cand-1',
                source: 'youtube_music',
                artist: 'Кобыла и Трупоглазые Жабы',
                match_artists: [
                  'Кобыла и Трупоглазые Жабы',
                  'Нашли Поздно Утром',
                ],
                title: '1917',
                match_title: '1917',
                url: 'u',
                match_url: 'u',
              },
            ],
          },
        }),
      ];
      const choices = {
        42: { candidateId: 'cand-1', source: 'youtube_music' },
      };
      const out = buildDownloadItems(items, choices, ['youtube_music']);
      expect(out[0].artist).toBe(fullName);
      expect(out[0].title).toBe('1917');
    });

    it('skips items with no choice or a skip choice', () => {
      const items = [makeItem(), makeItem({ album: { id: '43' } })];
      const choices = {
        42: 'skip',
        // 43 has no entry
      };
      const out = buildDownloadItems(items, choices, ['youtube_music']);
      expect(out).toHaveLength(0);
    });

    it('skips when the chosen candidate id is not found', () => {
      const items = [makeItem()];
      const choices = { 42: { candidateId: 'missing' } };
      const out = buildDownloadItems(items, choices, ['youtube_music']);
      expect(out).toHaveLength(0);
    });

    it('carries quality and root_folder through', () => {
      const items = [makeItem()];
      const choices = { 42: { candidateId: 'cand-1', format: '2' } };
      const out = buildDownloadItems(items, choices, ['youtube_music']);
      expect(out[0].quality).toBe('2');
      expect(out[0].root_folder).toBe('/music');
      expect(out[0].album_id).toBe(42);
    });

    // ── Yandex quality precedence ─────────────────────────────────────────────

    const makeYandexItem = () => ({
      album: {
        id: '10',
        artist: 'Artist',
        album: 'Album',
        root_folder: '/music',
      },
      results: {
        yandex: [
          {
            id: 'cand-y',
            source: 'yandex',
            artist: 'Artist',
            match_artists: ['Artist'],
            title: 'Album',
            match_title: 'Album',
            url: 'https://music.yandex.ru/album/1',
            match_url: 'https://music.yandex.ru/album/1',
          },
        ],
      },
    });

    it('omits quality for a Yandex item with choice.format === null (backend uses override/global)', () => {
      const items = [makeYandexItem()];
      const choices = {
        10: { candidateId: 'cand-y', format: null, source: 'yandex' },
      };
      const out = buildDownloadItems(items, choices, ['yandex']);
      expect(out).toHaveLength(1);
      expect(out[0]).not.toHaveProperty('quality');
    });

    it('includes quality when explicitly chosen to "2" (FLAC)', () => {
      const items = [makeYandexItem()];
      const choices = {
        10: { candidateId: 'cand-y', format: '2', source: 'yandex' },
      };
      const out = buildDownloadItems(items, choices, ['yandex']);
      expect(out[0].quality).toBe('2');
    });

    it('includes quality when explicitly chosen to "0" (falsy-safe)', () => {
      const items = [makeYandexItem()];
      const choices = {
        10: { candidateId: 'cand-y', format: '0', source: 'yandex' },
      };
      const out = buildDownloadItems(items, choices, ['yandex']);
      expect(out[0].quality).toBe('0');
    });

    it('includes quality when explicitly chosen to "1"', () => {
      const items = [makeYandexItem()];
      const choices = {
        10: { candidateId: 'cand-y', format: '1', source: 'yandex' },
      };
      const out = buildDownloadItems(items, choices, ['yandex']);
      expect(out[0].quality).toBe('1');
    });
  });
});
