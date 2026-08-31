/**
 * Prefix a path from public/ with the deploy base.
 *
 * The site ships to shaiomedia.com at the root, but a GitHub Pages project
 * site serves from /<repo>/. Hardcoded absolute paths break there, so every
 * public asset goes through here.
 */
export const asset = (p: string): string =>
  (import.meta.env.BASE_URL + "/" + p).replace(/\/{2,}/g, "/");
