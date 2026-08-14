// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://beamcss.dev',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
})
