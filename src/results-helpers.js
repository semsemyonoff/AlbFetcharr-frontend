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

export function groupBySource(candidates) {
  const grouped = {};
  for (const cand of candidates) {
    if (!Object.prototype.hasOwnProperty.call(grouped, cand.source)) {
      grouped[cand.source] = [];
    }
    grouped[cand.source].push(cand);
  }
  return grouped;
}

export function getBestCandidate(candidates) {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, current) =>
    (current.match || 0) > (best.match || 0) ? current : best
  );
}
