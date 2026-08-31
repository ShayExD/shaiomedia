// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// A GitHub Pages preview serves from /<repo>/ and must not be indexed;
// production ships to the domain root. Both come from env so the source is one build.
const SITE = process.env.SITE_URL ?? 'https://shaiomedia.com';
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  integrations: [sitemap({ i18n: undefined, changefreq: 'weekly', lastmod: new Date() })],
  vite: { plugins: [tailwindcss()] },
  image: { responsiveStyles: true },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
