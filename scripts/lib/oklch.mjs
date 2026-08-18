/**
 * OKLCH → sRGB, shared by the contrast audit and the OG image generator.
 *
 * The palette is authored in OKLCH because it is perceptually uniform. Neither
 * WCAG luminance nor a PNG encoder can read that, so both consumers need the
 * same conversion – and there is exactly one copy of it.
 */

const OKLCH = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/

export function parseOklch(input) {
  const match = OKLCH.exec(input.trim())
  if (!match) throw new Error(`Not an oklch() colour: ${input}`)

  const lightness = match[1].endsWith('%') ? Number.parseFloat(match[1]) / 100 : Number(match[1])

  return { l: lightness, c: Number(match[2]), h: Number(match[3]) }
}

/** Linear-light sRGB, gamut-clipped. Channels are 0–1. */
export function oklchToLinearRgb({ l, c, h }) {
  const radians = (h * Math.PI) / 180
  const a = c * Math.cos(radians)
  const b = c * Math.sin(radians)

  const lCube = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const mCube = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const sCube = (l - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * lCube - 3.3077115913 * mCube + 0.2309699292 * sCube,
    -1.2684380046 * lCube + 2.6097574011 * mCube - 0.3413193965 * sCube,
    -0.0041960863 * lCube - 0.7034186147 * mCube + 1.707614701 * sCube,
  ].map((channel) => Math.min(1, Math.max(0, channel)))
}

const encodeGamma = (channel) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055)

/** Hex string, for consumers that cannot evaluate oklch() themselves. */
export function oklchToHex(input) {
  const hex = oklchToLinearRgb(parseOklch(input))
    .map((channel) => Math.round(encodeGamma(channel) * 255))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')

  return `#${hex}`
}

/** Relative luminance per WCAG 2.x, computed from linear-light sRGB. */
export function relativeLuminance(input) {
  const [r, g, b] = oklchToLinearRgb(parseOklch(input))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The BEAM foundation palette, mirrored from src/styles/theme.css. */
export const PALETTE = {
  white: 'oklch(1 0 0)',
  black: 'oklch(0 0 0)',
  'stone-50': 'oklch(98.5% 0.001 106.423)',
  'stone-100': 'oklch(97% 0.001 106.424)',
  'stone-200': 'oklch(92.3% 0.003 48.717)',
  'stone-300': 'oklch(86.9% 0.005 56.366)',
  'stone-400': 'oklch(70.9% 0.01 56.259)',
  'stone-500': 'oklch(55.3% 0.013 58.071)',
  'stone-600': 'oklch(44.4% 0.011 73.639)',
  'stone-700': 'oklch(37.4% 0.01 67.558)',
  'stone-800': 'oklch(26.8% 0.007 34.298)',
  'stone-900': 'oklch(21.6% 0.006 56.043)',
  'stone-950': 'oklch(14.7% 0.004 49.25)',
  'beam-300': 'oklch(0.87 0.09 45)',
  'beam-400': 'oklch(0.8 0.15 40)',
  'beam-500': 'oklch(0.72 0.19 33)',
  'beam-600': 'oklch(0.63 0.2 28)',
  'beam-700': 'oklch(0.53 0.19 27)',
  'beam-800': 'oklch(0.46 0.16 27)',
  'cyan-400': 'oklch(0.82 0.09 205)',
  'cyan-700': 'oklch(0.5 0.09 220)',
  'green-500': 'oklch(72.3% 0.219 149.579)',
  'yellow-500': 'oklch(0.795 0.184 86.05)',
  'red-500': 'oklch(0.637 0.237 25.33)',
}

export const hex = (name) => {
  if (!(name in PALETTE)) throw new Error(`Unknown palette entry: ${name}`)
  return oklchToHex(PALETTE[name])
}
