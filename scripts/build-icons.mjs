/**
 * Renders the raster icons from the same prism geometry as public/favicon.svg.
 *
 * Run by hand (`pnpm icons`) and commit the output, for the same reason as the
 * OG card: brand assets should change when someone decides to change them.
 *
 * The SVG favicon carries a prefers-color-scheme switch, which a rasteriser
 * cannot evaluate. So the raster versions are drawn entirely in the brand
 * vermilion, which is the one hue that holds up against both a white and a dark
 * browser chrome.
 */
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import { hex } from './lib/oklch.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const mark = ({
  prism,
  spectrum,
  background,
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32" fill="none">
  ${background ? `<rect width="32" height="32" fill="${background}" />` : ''}
  <path d="M15 4 27.5 26H2.5Z" stroke="${prism}" stroke-width="2.6" stroke-linejoin="round" />
  <path d="M1 16H8" stroke="${prism}" stroke-width="2.6" stroke-linecap="round" />
  <g stroke="${spectrum}" stroke-width="2.6" stroke-linecap="round">
    <path d="M19.5 11.5H31" />
    <path d="M22.5 17H31" />
    <path d="M25.5 22.5H31" />
  </g>
</svg>`

const render = (svg, size) =>
  sharp(Buffer.from(svg), { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer()

/**
 * ICO wrapping a single PNG. The format has allowed embedded PNG payloads since
 * Windows Vista, so this is a 22-byte header rather than a BMP encoder.
 */
const ico = (png, size) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(1, 4) // one image

  const entry = Buffer.alloc(16)
  entry.writeUInt8(size >= 256 ? 0 : size, 0)
  entry.writeUInt8(size >= 256 ? 0 : size, 1)
  entry.writeUInt8(0, 2) // palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(header.length + entry.length, 12)

  return Buffer.concat([header, entry, png])
}

const transparent = mark({ prism: hex('beam-600'), spectrum: hex('beam-500') })
const onDark = mark({
  prism: hex('stone-100'),
  spectrum: hex('beam-400'),
  background: hex('stone-950'),
})

const favicon32 = await render(transparent, 32)
await writeFile(resolve(root, 'public/favicon.ico'), ico(favicon32, 32))
await writeFile(resolve(root, 'public/icon-192.png'), await render(transparent, 192))
await writeFile(resolve(root, 'public/apple-touch-icon.png'), await render(onDark, 180))

console.log('build-icons: wrote favicon.ico, icon-192.png, apple-touch-icon.png')
