import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LENGTH_PATTERN = /^(-?(?:\d+|\d*\.\d+))(px|rem)$/
const VAR_PATTERN = /^var\(\s*(--[\w-]+)\s*\)$/
const TOKEN_DECLARATION_PATTERN = /^\s*(--[\w-]+)\s*:\s*([^;]+);/gm
const FLOAT_PRECISION = 6

/**
 * @typedef {{
 *   minViewport?: string
 *   maxViewport?: string
 *   tokenFiles?: string[]
 *   tokens?: Record<string, string>
 * }} BeamFluidOptions
 */

/**
 * @typedef {{ value: number; unit: 'px' | 'rem'; source: string }} ParsedLength
 */

/**
 * BEAM point-to-point fluid interpolation.
 *
 * Supported:
 * - `fluid(1rem, 8rem)`
 * - `fluid(var(--text-4xl), var(--text-9xl))` when the tokens resolve to `px` or `rem`
 * - `fluid(1rem, 8rem, 40rem, 80rem)`
 *
 * The output avoids CSS `*` and `/` math so it works as ordinary `clamp()` CSS:
 * `clamp(2.25rem, calc(-3.5rem + 14.375vw), 8rem)`.
 *
 * @param {string} value
 * @param {Required<Pick<BeamFluidOptions, 'minViewport' | 'maxViewport'>>} options
 * @param {Map<string, string>} tokens
 */
function transformFluidValue(value, options, tokens) {
  let result = value
  let searchIndex = 0

  while (searchIndex < result.length) {
    const fluidIndex = result.indexOf('fluid(', searchIndex)
    if (fluidIndex === -1) {
      break
    }

    const openParen = fluidIndex + 'fluid('.length - 1
    const closeParen = findClosingParen(result, openParen)

    if (closeParen === -1) {
      throw new Error(`postcss-beam-fluid: unclosed fluid() call near index ${fluidIndex}`)
    }

    const args = splitTopLevelArgs(result.slice(openParen + 1, closeParen))
    if (args.length !== 2 && args.length !== 4) {
      throw new Error(
        `postcss-beam-fluid: fluid() expects 2 or 4 arguments, got ${args.length} in "${result.slice(fluidIndex, closeParen + 1)}"`,
      )
    }

    const [min, max, minViewport = options.minViewport, maxViewport = options.maxViewport] = args
    const replacement = buildClamp(min, max, minViewport, maxViewport, tokens)
    result = result.slice(0, fluidIndex) + replacement + result.slice(closeParen + 1)
    searchIndex = fluidIndex + replacement.length
  }

  return result
}

/**
 * @param {string} source
 * @param {number} openIndex index of "("
 */
function findClosingParen(source, openIndex) {
  let depth = 0

  for (let characterIndex = openIndex; characterIndex < source.length; characterIndex += 1) {
    const character = source[characterIndex]

    if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth -= 1
      if (depth === 0) {
        return characterIndex
      }
    }
  }

  return -1
}

/** @param {string} source */
function splitTopLevelArgs(source) {
  /** @type {string[]} */
  const args = []
  let current = ''
  let depth = 0

  for (let characterIndex = 0; characterIndex < source.length; characterIndex += 1) {
    const character = source[characterIndex]

    if (character === '(') {
      depth += 1
      current += character
      continue
    }

    if (character === ')') {
      depth -= 1
      current += character
      continue
    }

    if (character === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

/**
 * @param {string} min
 * @param {string} max
 * @param {string} minViewport
 * @param {string} maxViewport
 * @param {Map<string, string>} tokens
 */
function buildClamp(min, max, minViewport, maxViewport, tokens) {
  const minLength = parseLength(min, tokens, 'min')
  const maxLength = parseLength(max, tokens, 'max')
  const minViewportLength = parseLength(minViewport, tokens, 'minViewport')
  const maxViewportLength = parseLength(maxViewport, tokens, 'maxViewport')

  assertCompatibleLengths(minLength, maxLength, minViewportLength, maxViewportLength)

  const viewportRange = maxViewportLength.value - minViewportLength.value
  const valueRange = maxLength.value - minLength.value

  if (viewportRange <= 0) {
    throw new Error('postcss-beam-fluid: maxViewport must be larger than minViewport')
  }

  if (valueRange < 0) {
    throw new Error('postcss-beam-fluid: max value must be greater than or equal to min value')
  }

  if (valueRange === 0) {
    return formatLength(minLength)
  }

  const slope = (valueRange / viewportRange) * 100
  const intercept = minLength.value - (valueRange * minViewportLength.value) / viewportRange
  const preferred = buildPreferredValue(intercept, slope, minLength.unit)

  return `clamp(${formatLength(minLength)}, ${preferred}, ${formatLength(maxLength)})`
}

/**
 * @param {string} input
 * @param {Map<string, string>} tokens
 * @param {string} label
 * @returns {ParsedLength}
 */
function parseLength(input, tokens, label) {
  const resolvedInput = resolveToken(input.trim(), tokens)
  const match = resolvedInput.match(LENGTH_PATTERN)

  if (!match) {
    throw new Error(
      `postcss-beam-fluid: ${label} must resolve to a static px/rem length. Received "${input}" → "${resolvedInput}".`,
    )
  }

  return {
    value: Number.parseFloat(match[1]),
    unit: /** @type {'px' | 'rem'} */ (match[2]),
    source: input,
  }
}

/**
 * @param {string} input
 * @param {Map<string, string>} tokens
 */
function resolveToken(input, tokens) {
  const variableMatch = input.match(VAR_PATTERN)

  if (!variableMatch) {
    return input
  }

  const tokenName = variableMatch[1]
  const tokenValue = tokens.get(tokenName)

  if (!tokenValue) {
    throw new Error(
      `postcss-beam-fluid: unresolved token "${tokenName}". Add it to the plugin tokens or tokenFiles config.`,
    )
  }

  return tokenValue.trim()
}

/**
 * @param {ParsedLength} minLength
 * @param {ParsedLength} maxLength
 * @param {ParsedLength} minViewportLength
 * @param {ParsedLength} maxViewportLength
 */
function assertCompatibleLengths(minLength, maxLength, minViewportLength, maxViewportLength) {
  const units = new Set([minLength.unit, maxLength.unit, minViewportLength.unit, maxViewportLength.unit])

  if (units.size !== 1) {
    throw new Error(
      `postcss-beam-fluid: all fluid() values must use the same unit. Received ${[
        minLength.source,
        maxLength.source,
        minViewportLength.source,
        maxViewportLength.source,
      ].join(', ')}.`,
    )
  }
}

/**
 * @param {number} intercept
 * @param {number} slope
 * @param {'px' | 'rem'} unit
 */
function buildPreferredValue(intercept, slope, unit) {
  const slopeValue = formatNumber(Math.abs(slope))

  if (isZero(intercept)) {
    return `${slopeValue}vw`
  }

  const operator = slope >= 0 ? '+' : '-'

  return `calc(${formatNumber(intercept)}${unit} ${operator} ${slopeValue}vw)`
}

/** @param {ParsedLength} length */
function formatLength(length) {
  return `${formatNumber(length.value)}${length.unit}`
}

/** @param {number} value */
function formatNumber(value) {
  return Number.parseFloat(value.toFixed(FLOAT_PRECISION)).toString()
}

/** @param {number} value */
function isZero(value) {
  return Math.abs(value) < Number.EPSILON
}

/**
 * @param {import('postcss').Root} root
 * @param {BeamFluidOptions} options
 */
function collectTokens(root, options) {
  const tokens = new Map()

  for (const [tokenName, tokenValue] of Object.entries(options.tokens ?? {})) {
    tokens.set(tokenName, tokenValue)
  }

  for (const tokenFile of options.tokenFiles ?? []) {
    for (const [tokenName, tokenValue] of readTokenFile(tokenFile)) {
      tokens.set(tokenName, tokenValue)
    }
  }

  root.walkDecls((declaration) => {
    if (declaration.prop.startsWith('--')) {
      tokens.set(declaration.prop, declaration.value)
    }
  })

  return tokens
}

/** @param {string} tokenFile */
function readTokenFile(tokenFile) {
  const filePath = resolve(process.cwd(), tokenFile)

  if (!existsSync(filePath)) {
    throw new Error(`postcss-beam-fluid: token file not found: ${tokenFile}`)
  }

  const source = readFileSync(filePath, 'utf8')
  /** @type {[string, string][]} */
  const tokens = []

  for (const match of source.matchAll(TOKEN_DECLARATION_PATTERN)) {
    tokens.push([match[1], match[2].trim()])
  }

  return tokens
}

/**
 * @param {BeamFluidOptions} [options]
 */
export default function postcssBeamFluid(options = {}) {
  const resolved = {
    ...options,
    minViewport: options.minViewport ?? '40rem',
    maxViewport: options.maxViewport ?? '80rem',
  }

  return {
    postcssPlugin: 'postcss-beam-fluid',

    /** @param {import('postcss').Root} root */
    Once(root) {
      const tokens = collectTokens(root, resolved)

      root.walkDecls((declaration) => {
        if (declaration.value.includes('fluid(')) {
          declaration.value = transformFluidValue(declaration.value, resolved, tokens)
        }
      })
    },
  }
}

postcssBeamFluid.postcss = true
