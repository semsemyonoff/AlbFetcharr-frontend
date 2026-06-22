// Pure helpers for the Tweaks panel "Accent" control.
//
// An accent palette is a two-color pair [from, to]. The app's accent surfaces
// are driven by three CSS custom properties (already declared in styles.css):
// --accent-blue (the primary color), --accent-teal (the secondary color), and
// --accent-grad (a 135deg gradient between them). accentVars() maps a palette
// to those three vars; the consumer applies them to document.documentElement.

// The palette options shipped by the design prototype. The first entry matches
// the default vars in styles.css.
export const ACCENT_PALETTES = [
  ['#2d8eff', '#2ed3bf'],
  ['#7a5aff', '#2ed3bf'],
  ['#2ed3bf', '#6ee7a3'],
  ['#ff7a45', '#ffcc00'],
];

export const DEFAULT_ACCENT = ACCENT_PALETTES[0];

// Map a [from, to] palette to the three accent CSS variables. Falls back to the
// default palette when given a missing/malformed value, so a bad persisted
// value can never blank out the accent.
export function accentVars(palette) {
  const [from, to] =
    Array.isArray(palette) && palette.length >= 2 ? palette : DEFAULT_ACCENT;
  return {
    '--accent-blue': from,
    '--accent-teal': to,
    '--accent-grad': `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  };
}

// Apply a palette's accent vars to a DOM element (default: the document root).
export function applyAccent(palette, el) {
  const root =
    el ||
    (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!root) return;
  const vars = accentVars(palette);
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// The distinct logo-palette colors, used to tint per-library swatches so each
// library reads as a different color. Derived from ACCENT_PALETTES (the same
// blue/teal/green/violet/orange/amber family as the logo) with duplicates
// dropped, preserving first-seen order.
export const LIBRARY_SWATCHES = [...new Set(ACCENT_PALETTES.flat())];

// Deterministically map a library name to one of the LIBRARY_SWATCHES colors.
// The same name always yields the same color (so a library is recognizable at a
// glance), while different names spread across the palette. Returns the first
// swatch for empty/missing input.
export function libraryColor(name) {
  const key = typeof name === 'string' ? name : '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % LIBRARY_SWATCHES.length;
  return LIBRARY_SWATCHES[idx];
}

// Parse a persisted accent value (a JSON-encoded palette) back into an array.
// Returns the default palette for null/invalid input.
export function parseAccent(stored) {
  if (!stored) return DEFAULT_ACCENT;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
  } catch {
    // fall through to default
  }
  return DEFAULT_ACCENT;
}
