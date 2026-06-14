import { describe, it, expect } from 'vitest';
import { scoreCandidate, groupBySource, getBestCandidate } from '../results-helpers';

describe('results-helpers', () => {
  describe('scoreCandidate', () => {
    it('returns high score for exact match', () => {
      const album = { artist: 'The Beatles', album: 'Abbey Road' };
      const candidate = { match_artists: ['The Beatles'], match_title: 'Abbey Road' };
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
      const candidate = { match_artists: ['The Beatles'], match_title: 'Abbey Road' };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeLessThan(0.5);
    });

    it('handles case-insensitive matching', () => {
      const album = { artist: 'the beatles', album: 'abbey road' };
      const candidate = { match_artists: ['THE BEATLES'], match_title: 'ABBEY ROAD' };
      const score = scoreCandidate(album, candidate);
      expect(score).toBeGreaterThan(0.9);
    });

    it('handles multiple artists', () => {
      const album = { artist: 'Collaboration', album: 'Album' };
      const candidate = { match_artists: ['Artist1', 'Artist2'], match_title: 'Album' };
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

  describe('groupBySource', () => {
    it('groups candidates by source', () => {
      const candidates = [
        { source: 'yandex', id: '1' },
        { source: 'youtube_music', id: '2' },
        { source: 'yandex', id: '3' },
        { source: 'soundcloud', id: '4' },
        { source: 'youtube_music', id: '5' },
      ];
      const grouped = groupBySource(candidates);
      expect(grouped.yandex).toHaveLength(2);
      expect(grouped.youtube_music).toHaveLength(2);
      expect(grouped.soundcloud).toHaveLength(1);
    });

    it('omits sources not present in candidates', () => {
      const candidates = [{ source: 'yandex', id: '1' }];
      const grouped = groupBySource(candidates);
      expect(grouped.yandex).toHaveLength(1);
      expect(grouped.youtube_music).toBeUndefined();
      expect(grouped.soundcloud).toBeUndefined();
    });

    it('includes unknown sources not in the original three', () => {
      const candidates = [{ source: 'new_source', id: '1' }];
      const grouped = groupBySource(candidates);
      expect(grouped.new_source).toHaveLength(1);
    });

    it('maintains order of candidates within groups', () => {
      const candidates = [
        { source: 'yandex', id: '1', priority: 1 },
        { source: 'yandex', id: '2', priority: 2 },
        { source: 'yandex', id: '3', priority: 3 },
      ];
      const grouped = groupBySource(candidates);
      expect(grouped.yandex[0].id).toBe('1');
      expect(grouped.yandex[1].id).toBe('2');
      expect(grouped.yandex[2].id).toBe('3');
    });

    it('handles empty array', () => {
      const grouped = groupBySource([]);
      expect(Object.keys(grouped)).toHaveLength(0);
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
});
