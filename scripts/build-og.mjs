/**
 * Renders public/og.png – the social card.
 *
 * Run by hand (`pnpm og`) rather than on prebuild, and commit the result. A
 * brand asset that silently changes because a CI image swapped its default
 * monospace font is not a build artifact, it is a surprise.
 *
 * Type is monospace only, which is the one generic family whose metrics are
 * close enough across macOS, Linux and Windows to be safe. The I-beam carries
 * the identity; the words are a caption.
 */
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import { hex, oklchToHex, PALETTE, parseOklch } from './lib/oklch.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const WIDTH = 1200
const HEIGHT = 630

const ink = hex('stone-100')
const inkMuted = hex('stone-400')
const inkFaint = hex('stone-500')
const page = hex('stone-950')
const rule = hex('stone-800')
const glow = hex('beam-400')

/*
 * Dark-theme BeamMark faces. The card is stone-950, so we light the steel the
 * same way BeamMark.css does on dark: glow on the top flange, brand-primary on
 * the I-profile, mix-with-black on the receding faces so shade never inverts.
 *
 * Paths are the glyph in src/components/BeamMark/assets/glyph.svg. Keep them
 * in lockstep; this file cannot import CSS classes.
 */
const mixWithBlack = (name, percent) => {
  const { l, c, h } = parseOklch(PALETTE[name])
  const amount = percent / 100
  return oklchToHex(`oklch(${l * amount} ${c * amount} ${h})`)
}

const faceLit = hex('beam-400')
const faceFront = hex('beam-500')
const faceShade = mixWithBlack('beam-500', 80)
const faceShadow = mixWithBlack('beam-500', 65)

const BEAM_SIZE = 416
const BEAM_X = 724
const BEAM_Y = (HEIGHT - BEAM_SIZE) / 2
const BEAM_SCALE = BEAM_SIZE / 32
const BEAM_CX = BEAM_X + 16 * BEAM_SCALE
const BEAM_CY = BEAM_Y + 16 * BEAM_SCALE

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

const beamMark = () => `
  <g transform="translate(${BEAM_X} ${BEAM_Y}) scale(${BEAM_SCALE})">
    <g transform="translate(0.5 1.5)">
      <path fill="${faceLit}" d="M3 7 L14 2 L28 2 L17 7 Z" />
      <path fill="${faceShade}" d="M13 12 L24 7 L24 17 L13 22 Z" />
      <path fill="${faceShade}" d="M13 22 L24 17 L28 17 L17 22 Z" />
      <path fill="${faceShadow}" d="M17 7 L28 2 L28 7 L17 12 Z" />
      <path fill="${faceShadow}" d="M17 22 L28 17 L28 22 L17 27 Z" />
      <path fill="${faceFront}" d="M3 7 H17 V12 H13 V22 H17 V27 H3 V22 H7 V12 H3 Z" />
    </g>
  </g>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${page}" />
  ${grid()}

  <defs>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${glow}" stop-opacity="0.28" />
      <stop offset="1" stop-color="${glow}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <circle cx="${BEAM_CX}" cy="${BEAM_CY}" r="280" fill="url(#glow)" />

  ${beamMark()}

  <g font-family="monospace">
    <text x="60" y="96" fill="${glow}" font-size="21" letter-spacing="5.5">BLOCK · ELEMENT · ATTRIBUTE · MODULE</text>
    <text x="58" y="252" fill="${ink}" font-size="132" font-weight="bold" letter-spacing="-6">beam</text>
    <text x="60" y="418" fill="${inkMuted}" font-size="27">Semantic CSS architecture</text>
    <text x="60" y="456" fill="${inkMuted}" font-size="27">for OCD-grade determinism.</text>
    <text x="60" y="562" fill="${inkFaint}" font-size="21" letter-spacing="1.5">beamcss.org</text>
  </g>

  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${HEIGHT - 1}" stroke="${rule}" stroke-width="1" />
</svg>`

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()

await writeFile(resolve(root, 'public/og.png'), png)

const { size } = await sharp(png).metadata()
console.log(`build-og: wrote public/og.png (${WIDTH}×${HEIGHT}, ${(size / 1024).toFixed(1)} KB)`)
