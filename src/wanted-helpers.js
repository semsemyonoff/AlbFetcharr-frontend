import { I18N } from './i18n.js';

export function mapWantedAlbum(album) {
  const rawYear = album.release_date
    ? parseInt(album.release_date.slice(0, 4), 10)
    : NaN;
  const year = Number.isNaN(rawYear) ? null : rawYear;

  const rawFolder = album.root_folder || '';
  const segments = rawFolder.split('/').filter(Boolean);
  const library = segments.length > 0 ? segments[segments.length - 1] : '';

  return {
    id: String(album.album_id),
    artist: album.artist || 'Unknown Artist',
    album: album.title || 'Unknown Album',
    year,
    tracks: album.track_count ?? 0,
    durationMs: album.duration ?? 0,
    albumType: album.album_type ?? '',
    coverUrl: album.cover_url ?? '',
    library,
    root_folder: album.root_folder,
  };
}

export function formatDuration(ms) {
  if (ms == null || ms === 0) return '—';
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function albumTypeLabel(type, lang) {
  const t = I18N[lang] || I18N.en;
  return t[`type_${type}`] || type;
}

export function deriveLibraries(albums) {
  const seen = new Set();
  const result = [];
  for (const album of albums) {
    const lib = album.library;
    if (lib && !seen.has(lib)) {
      seen.add(lib);
      result.push(lib);
    }
  }
  return result;
}
