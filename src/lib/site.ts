/**
 * Single source of truth for external references.
 * Update these once; every page follows.
 */
export const SITE = {
  name: 'BEAM CSS',
  tagline: 'Block. Element. Attribute. Module.',
  repo: 'https://github.com/thefurdui/beamcss',
  npm: 'https://www.npmjs.com/package/postcss-beam-fluid',
  author: 'Andrei Furdui',
  authorUrl: 'https://github.com/thefurdui',
  version: '2026.1',
} as const

export const NAV = [
  { href: '/spec/', label: 'Spec' },
  { href: '/lineage/', label: 'Lineage' },
  { href: '/install/', label: 'Install' },
] as const

/** State of CSS 2026, run by Sacha Greif and Devographics. 4,902 respondents. */
export const SURVEY = {
  url: 'https://2026.stateofcss.com/en-US/pain-points/',
  respondents: '4,902',
  year: '2026',
} as const
