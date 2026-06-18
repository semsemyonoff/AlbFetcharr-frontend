/* Simple Levenshtein distance-based scoring for candidate matching */

function levenshteinDistance(a, b) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length;
  const n = b.length;
  const dp = Array(n + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[0][i] = i;
  for (let j = 0; j <= n; j++) dp[j][0] = j;

  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j][i] = Math.min(
        dp[j][i - 1] + 1,
        dp[j - 1][i] + 1,
        dp[j - 1][i - 1] + cost
      );
    }
  }
  return dp[n][m];
}

export function scoreCandidate(album, candidate) {
  const albumStr = `${album.artist} ${album.album}`.toLowerCase();
  const candidateStr =
    `${candidate.match_artists.join(' ')} ${candidate.match_title}`.toLowerCase();

  const dist = levenshteinDistance(albumStr, candidateStr);
  const maxLen = Math.max(albumStr.length, candidateStr.length);
  const similarity = Math.max(0, 1 - dist / maxLen);

  return similarity;
}

export function getBestCandidate(candidates) {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    (current.match || 0) > (best.match || 0) ? current : best
  );
}

/* Build the /api/download payload from the chosen candidates.
 *
 * The download identity (artist/title) is taken from the Lidarr album
 * (it.album.*), NOT the source match: the backend keys the on-disk folder
 * layout and its find_album_dir / check_album_status / post_import_cleanup
 * lookups off the Lidarr names. The source match is only used to resolve which
 * source/URL to fetch from. Using the match's artist would also corrupt names
 * that contain a comma — the candidate's `artist` is `match_artists[0]` after
 * splitting on ', ', so e.g. a band literally named "A, B" would download under
 * just "A". The match metadata (match_title/match_artists) is still forwarded
 * for reference.
 */
export function buildDownloadItems(searchItems, choices, sourceIds) {
  const toDownload = [];
  for (const it of searchItems) {
    const c = choices[it.album.id];
    if (!c || c === 'skip') continue;
    const allCands = sourceIds.flatMap((s) =>
      Array.isArray(it.results[s]) ? it.results[s] : []
    );
    const cand = allCands.find((x) => x.id === c.candidateId);
    if (!cand) continue;

    const item = {
      album_id: parseInt(it.album.id, 10),
      artist: it.album.artist || cand.artist,
      title: it.album.album || cand.title,
      source: cand.source,
      match_url: cand.url || cand.match_url,
      match_title: cand.title || cand.match_title,
      match_artists: cand.match_artists || [cand.artist],
      root_folder: it.album.root_folder,
    };
    // Only send quality when explicitly picked by the user; null means the
    // backend uses the session override or global default (routes.py:561-566).
    if (c.format != null) {
      item.quality = c.format;
    }
    toDownload.push(item);
  }
  return toDownload;
}
