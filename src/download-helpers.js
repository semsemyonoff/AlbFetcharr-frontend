export function parseSSEEvent(rawData) {
  try {
    const parsed = JSON.parse(rawData);
    if ('log' in parsed) {
      return { type: 'log', text: parsed.log };
    }
    if (parsed.progress) {
      return { type: 'progress', payload: parsed.progress };
    }
    if (parsed.done) {
      return { type: 'done' };
    }
  } catch (e) {
    console.error('Failed to parse SSE event:', e);
  }
  return null;
}

export function applyProgressUpdate(downloads, progressEvent) {
  const { album_id, status, message, item_index, item_total, speed, eta } =
    progressEvent;
  const next = [...downloads];
  const idx = next.findIndex((d) => d.album_id === album_id);

  if (idx !== -1) {
    const updated = {
      ...next[idx],
      status,
      message: message || next[idx].message,
    };

    // Batch position ("album N of M") — honest, available data. Only overwrite
    // when the event actually carries it so initial values survive.
    if (item_index != null) updated.item_index = item_index;
    if (item_total != null) updated.item_total = item_total;

    // Backend-gated passthrough: the SSE stream MAY emit speed, eta, or a
    // continuous numeric progress (per-track YouTube downloads do). This keeps
    // such fields alive when the backend supplies them; otherwise they stay
    // undefined and the bar falls back to the per-status bucket map.
    if (speed != null) updated.speed = speed;
    if (eta != null) updated.eta = eta;

    // Partial album: the download finished but some tracks failed (e.g. region-
    // locked / 403 after retries). The backend still imports what's available and
    // reports status "downloaded"/"done" with partial=true + an errors count;
    // the UI renders this as a warning, not a failure. Sticky once set so the
    // later "done"/"importing" events (which omit it) do not clear the warning.
    if (progressEvent.partial != null) updated.partial = progressEvent.partial;
    if (progressEvent.errors != null) updated.errors = progressEvent.errors;

    updated.progress =
      typeof progressEvent.progress === 'number'
        ? progressEvent.progress
        : getProgressPercent(status);

    next[idx] = updated;
  }

  return next;
}

function getProgressPercent(status) {
  const map = {
    starting: 10,
    downloading: 50,
    downloaded: 85,
    importing: 95,
    done: 100,
    failed: 100,
  };
  return map[status] || 0;
}
