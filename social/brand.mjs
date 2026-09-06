/**
 * Design tokens lifted verbatim from the live site so a post and the landing
 * page read as one brand. If palette.css changes, change it here too — these
 * are duplicated on purpose, because the renderer must not depend on Tailwind.
 */

export const ink = {
  950: '#050A13', 925: '#080F1C', 900: '#0B1424', 850: '#0F1B2E',
  800: '#13233A', 700: '#1B3350', 600: '#274766', 500: '#3D6187',
  400: '#5D80A8', 300: '#8AA6C6', 200: '#B6C8DE', 100: '#D8E2EE', 50: '#EDF2F8',
};

export const brand = {
  700: '#12386B', 600: '#17457F', 500: '#1B4F8A', 400: '#2E6FB8',
  300: '#4C8FE0', 200: '#8FBAF0', 100: '#CDE0F8', 50: '#E9F1FC',
};

export const paper = '#F4F7FA';
export const win = { 600: '#2E9B7A', 100: '#DFF1EA' };

/** Per-trade accent, mid-saturation so it carries on both grounds. */
export const verticals = {
  construction: { color: '#3D82D1', label: 'בנייה ושיפוצים' },
  roofing:      { color: '#2E9B7A', label: 'גגות' },
  chimney:      { color: '#DFA33A', label: 'ארובות' },
  locksmith:    { color: '#D45560', label: 'מנעולנות' },
  garage:       { color: '#6F64EA', label: 'דלתות גראז׳' },
};

export const site = {
  domain: 'service.shaiomedia.com',
  nameHe: 'שיו מדיה',
};

/** Canvas presets. Instagram feed is the default because it is where the
 *  catalogue actually converts; story and og come along for free. */
export const sizes = {
  feed:   { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
  story:  { w: 1080, h: 1920 },
  og:     { w: 1200, h: 630  },
};
