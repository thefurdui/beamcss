/**
 * Renders public/og.png – the social card.
 *
 * Run by hand (`pnpm og`) rather than on prebuild, and commit the result. A
 * brand asset that silently changes because a CI image swapped its default
 * monospace font is not a build artifact, it is a surprise.
 *
 * Type is monospace only, which is the one generic family whose metrics are
 * close enough across macOS, Linux and Windows to be safe. The prism carries
 * the identity; the words are a caption.
 */
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import { hex } from './lib/oklch.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const WIDTH = 1200
const HEIGHT = 630

const ink = hex('stone-100')
const inkMuted = hex('stone-400')
const inkFaint = hex('stone-500')
const page = hex('stone-950')
const rule = hex('stone-800')
const beam = hex('beam-400')

/*
 * Geometry mirrors PrismDiagram: the source meets the left face, and every ray
 * radiates from one exit node on the right face. Keeping the two in sync means
 * the card and the hero read as the same drawing.
 */
const NODE = { x: 838, y: 315 }
const RAYS = [
  { y: 150, opacity: 1 },
  { y: 255, opacity: 0.8 },
  { y: 375, opacity: 0.62 },
  { y: 480, opacity: 0.44 },
]

const grid = () => {
  const lines = []

  for (let x = 0; x <= WIDTH; x += 60) {
    lines.push(`<path d="M${x} 0V${HEIGHT}" />`)
  }

  for (let y = 0; y <= HEIGHT; y += 60) {
    lines.push(`<path d="M0 ${y}H${WIDTH}" />`)
  }

  return `<g stroke="${rule}" stroke-width="1" opacity="0.4">${lines.join('')}</g>`
}

const spectrum = () =>
  RAYS.map(
    ({ y, opacity }) =>
      `<path d="M${NODE.x} ${NODE.y}L${WIDTH + 40} ${y}" stroke="${beam}" stroke-width="3" stroke-linecap="round" opacity="${opacity}" />`,
  ).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${page}" />
  ${grid()}

  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${beam}" stop-opacity="0.28" />
      <stop offset="1" stop-color="${beam}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <circle cx="${NODE.x}" cy="${NODE.y}" r="240" fill="url(#glow)" />

  ${spectrum()}

  <path d="M60 ${NODE.y}H720" stroke="${inkFaint}" stroke-width="3" stroke-linecap="round" />
  <path d="M760 145 850 485H670Z" stroke="${hex('stone-700')}" stroke-width="3" stroke-linejoin="round" fill="${beam}" fill-opacity="0.04" />
  <circle cx="${NODE.x}" cy="${NODE.y}" r="6" fill="${beam}" />

  <g font-family="monospace">
    <text x="60" y="96" fill="${beam}" font-size="21" letter-spacing="5.5">BLOCK · ELEMENT · ATTRIBUTE · MODULE</text>
    <text x="58" y="252" fill="${ink}" font-size="132" font-weight="bold" letter-spacing="-6">beam</text>
    <text x="60" y="418" fill="${inkMuted}" font-size="27">Semantic CSS that survives contact</text>
    <text x="60" y="456" fill="${inkMuted}" font-size="27">with a design change.</text>
    <text x="60" y="562" fill="${inkFaint}" font-size="21" letter-spacing="1.5">beamcss.dev</text>
  </g>

  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" stroke="${rule}" stroke-width="1" />
</svg>`

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()

await writeFile(resolve(root, 'public/og.png'), png)

const { size } = await sharp(png).metadata()
console.log(`build-og: wrote public/og.png (${WIDTH}×${HEIGHT}, ${(size / 1024).toFixed(1)} KB)`)
