// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://beamcss.org',
  // Astro 7's default `'jsx'` strips newlines between inline tags, so
  // `word\n<code>` becomes `word<code>`. This site is mostly running prose;
  // HTML whitespace has to remain HTML whitespace.
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
})
