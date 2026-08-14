/**
 * WCAG contrast audit for the BEAM semantic layer.
 *
 * Colours are authored in OKLCH, which is perceptually uniform but says nothing
 * about WCAG luminance. This reports the real sRGB ratio for every pair the
 * design actually renders, so a "looks fine" accent cannot quietly ship at 3.8:1.
 *
 * Usage: pnpm contrast
 */
import { PALETTE, relativeLuminance } from './lib/oklch.mjs'

function luminance(name) {
  if (!(name in PALETTE)) throw new Error(`Unknown palette entry: ${name}`)
  return relativeLuminance(PALETTE[name])
}

function contrast(foreground, background) {
  const a = luminance(foreground)
  const b = luminance(background)
  const [light, dark] = a > b ? [a, b] : [b, a]

  return (light + 0.05) / (dark + 0.05)
}

/** [label, foreground, background, minimum ratio] */
const pairs = [
  ['light · ink-main on bg-page', 'stone-900', 'stone-50', 4.5],
  ['light · ink-main on bg-surface', 'stone-900', 'white', 4.5],
  ['light · ink-muted on bg-page', 'stone-600', 'stone-50', 4.5],
  ['light · ink-faint on bg-page', 'stone-500', 'stone-50', 3],
  ['light · accent text on bg-page', 'beam-700', 'stone-50', 4.5],
  ['light · accent text on bg-surface', 'beam-700', 'white', 4.5],
  ['light · ink-inverse on action-contrast', 'white', 'stone-900', 4.5],
  ['light · ink-inverse on action-primary', 'white', 'beam-700', 4.5],
  ['light · syntax-cool on bg-sunken', 'cyan-700', 'stone-100', 4.5],
  ['light · syntax-muted on bg-sunken', 'stone-500', 'stone-100', 3],
  ['light · border on bg-page', 'stone-300', 'stone-50', 1.4],

  ['dark  · ink-main on bg-page', 'stone-100', 'stone-950', 4.5],
  ['dark  · ink-main on bg-surface', 'stone-100', 'stone-900', 4.5],
  ['dark  · ink-muted on bg-page', 'stone-400', 'stone-950', 4.5],
  ['dark  · ink-faint on bg-page', 'stone-500', 'stone-950', 3],
  ['dark  · accent text on bg-page', 'beam-400', 'stone-950', 4.5],
  ['dark  · accent text on bg-surface', 'beam-400', 'stone-900', 4.5],
  ['dark  · ink-inverse on action-contrast', 'stone-900', 'stone-100', 4.5],
  ['dark  · ink-inverse on action-primary', 'stone-900', 'beam-400', 4.5],
  ['dark  · syntax-cool on bg-sunken', 'cyan-400', 'black', 4.5],
  ['dark  · syntax-muted on bg-sunken', 'stone-500', 'black', 3],
  ['dark  · border on bg-page', 'stone-800', 'stone-950', 1.2],
]

let failures = 0

for (const [label, foreground, background, minimum] of pairs) {
  const ratio = contrast(foreground, background)
  const pass = ratio >= minimum

  if (!pass) failures += 1

  console.log(
    `${pass ? 'pass' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1  (min ${minimum})  ${label}  [${foreground} / ${background}]`,
  )
}

console.log(`\n${pairs.length - failures}/${pairs.length} pairs pass.`)
process.exitCode = failures === 0 ? 0 : 1
