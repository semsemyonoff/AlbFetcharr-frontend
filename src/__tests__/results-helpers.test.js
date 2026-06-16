import { describe, it, expect } from 'vitest';
import { scoreCandidate, getBestCandidate } from '../results-helpers';

describe('results-helpers', () => {
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
});
