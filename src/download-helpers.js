export function parseSSEEvent(rawData) {
  try {
    const parsed = JSON.parse(rawData);
    if ("log" in parsed) {
      return { type: "log", text: parsed.log };
    }
    if (parsed.progress) {
      return { type: "progress", payload: parsed.progress };
    }
    if (parsed.done) {
      return { type: "done" };
    }
  } catch (e) {
    console.error("Failed to parse SSE event:", e);
  }
  return null;
}

export function applyProgressUpdate(downloads, progressEvent) {
  const { album_id, item_index, item_total, status, message } = progressEvent;
  const next = [...downloads];
  const idx = next.findIndex((d) => d.album_id === album_id);

  if (idx !== -1) {
    next[idx] = {
      ...next[idx],
      status,
      message: message || next[idx].message,
    };
    next[idx].progress = getProgressPercent(status);
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
