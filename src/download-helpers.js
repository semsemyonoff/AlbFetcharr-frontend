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

    // Backend-gated passthrough: the SSE stream does NOT currently emit speed,
    // eta, or a continuous numeric progress (see Post-Completion). This keeps
    // such fields alive if the backend contract ever supplies them; until then
    // they stay undefined and the bar falls back to the per-status bucket map.
    if (speed != null) updated.speed = speed;
    if (eta != null) updated.eta = eta;
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
