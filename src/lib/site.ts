/**
 * Single source of truth for external references.
 * Update these once; every page follows.
 */
export const SITE = {
  name: 'BEAM CSS',
  tagline: 'Block. Element. Attribute. Module.',
  repo: 'https://github.com/thefurdui/beamcss',
  fontsManualCss: 'https://github.com/thefurdui/beamcss/blob/main/src/styles/fonts.css',
  fontsFontsourceCss: 'https://github.com/thefurdui/beamcss/blob/v0.1.0/src/styles/fonts.css',
  npm: 'https://www.npmjs.com/package/postcss-beam-fluid',
  author: 'Andrei Furdui',
  authorUrl: 'https://github.com/thefurdui',
  version: '2026.1',
} as const

export const NAV = [
  { href: '/spec/', label: 'Spec' },
  { href: '/install/', label: 'Install' },
  { href: '/lineage/', label: 'Lineage' },
] as const

/** State of CSS 2026, run by Sacha Greif and Devographics. 4,902 respondents. */
export const SURVEY = {
  url: 'https://2026.stateofcss.com/en-US/pain-points/',
  respondents: '4,902',
  year: '2026',
} as const
