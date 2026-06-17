import { describe, it, expect } from 'vitest';
import { parseSSEEvent, applyProgressUpdate } from '../download-helpers.js';

describe('parseSSEEvent', () => {
  it('parses log event', () => {
    const result = parseSSEEvent(JSON.stringify({ log: 'test message' }));
    expect(result).toEqual({ type: 'log', text: 'test message' });
  });

  it('parses progress event', () => {
    const progressPayload = {
      album_id: 123,
      item_index: 0,
      item_total: 3,
      status: 'downloading',
      message: 'Downloading...',
    };
    const result = parseSSEEvent(JSON.stringify({ progress: progressPayload }));
    expect(result).toEqual({ type: 'progress', payload: progressPayload });
  });

  it('parses done event', () => {
    const result = parseSSEEvent(JSON.stringify({ done: true }));
    expect(result).toEqual({ type: 'done' });
  });

  it('returns null for invalid JSON', () => {
    const result = parseSSEEvent('not valid json');
    expect(result).toBeNull();
  });

  it('returns null for unknown event type', () => {
    const result = parseSSEEvent(JSON.stringify({ unknown: 'field' }));
    expect(result).toBeNull();
  });

  it('treats an empty-string log as a log event (key presence, not truthiness)', () => {
    const result = parseSSEEvent(JSON.stringify({ log: '' }));
    expect(result).toEqual({ type: 'log', text: '' });
  });

  it('returns null for done:false (done is gated on truthiness)', () => {
    const result = parseSSEEvent(JSON.stringify({ done: false }));
    expect(result).toBeNull();
  });
});

describe('applyProgressUpdate', () => {
  it('updates progress for existing album', () => {
    const downloads = [
      {
        album_id: 123,
        artist: 'Artist 1',
        album: 'Album 1',
        status: 'starting',
        progress: 10,
      },
    ];

    const progressEvent = {
      album_id: 123,
      status: 'downloading',
      message: 'Downloading tracks...',
    };

    const result = applyProgressUpdate(downloads, progressEvent);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      album_id: 123,
      artist: 'Artist 1',
      album: 'Album 1',
      status: 'downloading',
      message: 'Downloading tracks...',
      progress: 50,
    });
  });

  it('preserves other downloads unchanged', () => {
    const downloads = [
      { album_id: 123, artist: 'Artist 1', status: 'starting', progress: 10 },
      {
        album_id: 456,
        artist: 'Artist 2',
        status: 'downloading',
        progress: 50,
      },
    ];

    const progressEvent = {
      album_id: 123,
      status: 'downloading',
      message: 'In progress',
    };

    const result = applyProgressUpdate(downloads, progressEvent);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('downloading');
    expect(result[1].status).toBe('downloading');
    expect(result[1].album_id).toBe(456);
  });

  it('applies correct progress percent for each status', () => {
    const downloads = [{ album_id: 1, status: 'starting', progress: 0 }];

    const statuses = [
      { status: 'starting', expected: 10 },
      { status: 'downloading', expected: 50 },
      { status: 'downloaded', expected: 85 },
      { status: 'importing', expected: 95 },
      { status: 'done', expected: 100 },
      { status: 'failed', expected: 100 },
    ];

    for (const { status, expected } of statuses) {
      const event = { album_id: 1, status, message: '' };
      const result = applyProgressUpdate(downloads, event);
      expect(result[0].progress).toBe(expected);
    }
  });

  it('does not update when album_id not found', () => {
    const downloads = [
      { album_id: 123, artist: 'Artist 1', status: 'starting', progress: 10 },
    ];

    const progressEvent = {
      album_id: 999,
      status: 'downloading',
      message: 'Not found',
    };

    const result = applyProgressUpdate(downloads, progressEvent);
    expect(result).toEqual(downloads);
  });

  it('carries batch position (item_index/item_total) through when present', () => {
    const downloads = [{ album_id: 1, status: 'starting', progress: 0 }];
    const event = {
      album_id: 1,
      status: 'downloading',
      message: '',
      item_index: 2,
      item_total: 5,
    };
    const result = applyProgressUpdate(downloads, event);
    expect(result[0].item_index).toBe(2);
    expect(result[0].item_total).toBe(5);
  });

  it('preserves existing batch position when the event omits it', () => {
    const downloads = [
      {
        album_id: 1,
        status: 'starting',
        progress: 0,
        item_index: 3,
        item_total: 7,
      },
    ];
    const event = { album_id: 1, status: 'downloading', message: '' };
    const result = applyProgressUpdate(downloads, event);
    expect(result[0].item_index).toBe(3);
    expect(result[0].item_total).toBe(7);
  });

  it('keeps the prior message when the event carries no message', () => {
    const downloads = [
      {
        album_id: 1,
        status: 'downloading',
        progress: 50,
        message: 'Downloading track 3...',
      },
    ];
    const event = { album_id: 1, status: 'downloaded' };
    const result = applyProgressUpdate(downloads, event);
    expect(result[0].message).toBe('Downloading track 3...');
    expect(result[0].status).toBe('downloaded');
  });

  it('passes through speed/eta/numeric progress when the backend supplies them', () => {
    const downloads = [{ album_id: 1, status: 'starting', progress: 0 }];
    const event = {
      album_id: 1,
      status: 'downloading',
      message: '',
      speed: '1.2 MB/s',
      eta: '00:42',
      progress: 73,
    };
    const result = applyProgressUpdate(downloads, event);
    expect(result[0].speed).toBe('1.2 MB/s');
    expect(result[0].eta).toBe('00:42');
    expect(result[0].progress).toBe(73);
  });

  it('passes through partial + errors when the backend flags a partial album', () => {
    const downloads = [{ album_id: 1, status: 'downloading', progress: 50 }];
    const event = {
      album_id: 1,
      status: 'downloaded',
      message: 'Downloaded with 1 failed track(s)',
      partial: true,
      errors: 1,
    };
    const result = applyProgressUpdate(downloads, event);
    expect(result[0].partial).toBe(true);
    expect(result[0].errors).toBe(1);
    expect(result[0].status).toBe('downloaded');
  });

  it('keeps a previously-set partial flag when a later event omits it', () => {
    const downloads = [
      { album_id: 1, status: 'downloaded', progress: 85, partial: true },
    ];
    const event = { album_id: 1, status: 'done' };
    const result = applyProgressUpdate(downloads, event);
    // The sticky flag survives the terminal "done" event (which carries no partial).
    expect(result[0].partial).toBe(true);
    expect(result[0].status).toBe('done');
  });

  it('falls back to the bucket map and leaks no undefined when fields are absent', () => {
    const downloads = [{ album_id: 1, status: 'starting', progress: 0 }];
    const event = { album_id: 1, status: 'downloading', message: '' };
    const result = applyProgressUpdate(downloads, event);
    expect(result[0].progress).toBe(50);
    expect('speed' in result[0]).toBe(false);
    expect('eta' in result[0]).toBe(false);
  });

  it('returns new array (immutable)', () => {
    const downloads = [
      { album_id: 123, artist: 'Artist 1', status: 'starting', progress: 10 },
    ];

    const progressEvent = {
      album_id: 123,
      status: 'downloading',
      message: 'Test',
    };

    const result = applyProgressUpdate(downloads, progressEvent);
    expect(result).not.toBe(downloads);
    expect(downloads[0].status).toBe('starting'); // Original unchanged
    expect(result[0].status).toBe('downloading'); // New one updated
  });
});
