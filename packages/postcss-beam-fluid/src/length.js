const LENGTH = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem)$/
const UNITLESS_ZERO = /^-?0(?:\.0+)?$/
const PRECISION = 4

/**
 * Parses a static length. BEAM only interpolates between absolute values,
 * so `em`, `%`, `vw` and friends are deliberately rejected: they would make
 * the compiled `clamp()` depend on inherited context we cannot see.
 *
 * A unitless zero is accepted and reported with `unit: null` so it can adopt
 * the unit of the value it is paired with.
 */
export function parseLength(input) {
  const raw = input.trim()
  if (UNITLESS_ZERO.test(raw)) return { value: 0, unit: null }

  const match = LENGTH.exec(raw)
  if (!match) return null

  return { value: Number(match[1]), unit: match[2] }
}

export function convert(length, unit, rootFontSize) {
  if (length.unit === null || length.unit === unit) return length.value
  if (length.unit === 'px' && unit === 'rem') return length.value / rootFontSize
  if (length.unit === 'rem' && unit === 'px') return length.value * rootFontSize
  return null
}

export function round(value) {
  const rounded = Number(value.toFixed(PRECISION))
  return Object.is(rounded, -0) ? 0 : rounded
}

export function formatLength(value, unit) {
  return `${round(value)}${unit}`
}
