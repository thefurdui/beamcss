import { convert, formatLength, parseLength, round } from './length.js'
import { collectTokens, loadTokenFiles, resolveValue } from './tokens.js'

const FN = 'fluid'

class FluidError extends Error {}

function fail(message) {
  throw new FluidError(message)
}

/** Locates the next top-level `fluid(...)` call and returns its boundaries. */
function findCall(value, from) {
  let index = value.indexOf(`${FN}(`, from)

  while (index !== -1) {
    const before = index === 0 ? '' : value[index - 1]
    const isIdentifierChar = before !== '' && /[\w$-]/.test(before)

    if (!isIdentifierChar) {
      const argsStart = index + FN.length + 1
      let depth = 1

      for (let i = argsStart; i < value.length; i += 1) {
        if (value[i] === '(') depth += 1
        else if (value[i] === ')') {
          depth -= 1
          if (depth === 0) return { start: index, argsStart, argsEnd: i, end: i + 1 }
        }
      }

      fail(`Unclosed ${FN}() call in "${value}".`)
    }

    index = value.indexOf(`${FN}(`, index + 1)
  }

  return null
}

function splitArgs(input) {
  const args = []
  let depth = 0
  let start = 0

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1
    else if (char === ',' && depth === 0) {
      args.push(input.slice(start, i).trim())
      start = i + 1
    }
  }

  args.push(input.slice(start).trim())

  return args
}

function toLength(raw, sources, role) {
  const resolved = resolveValue(raw, sources)

  if (resolved === null) {
    fail(`Cannot resolve ${role} "${raw}". Add the token to a file listed in \`tokenFiles\`, or pass it via \`tokens\`.`)
  }

  const length = parseLength(resolved)

  if (!length) {
    fail(
      `Unsupported ${role} "${raw}"${resolved === raw ? '' : ` (resolves to "${resolved}")`}. ` +
        `${FN}() interpolates static px or rem values only.`,
    )
  }

  return length
}

/** Picks the output unit from a min/max pair, tolerating a unitless zero on either side. */
function pickUnit(min, max) {
  if (min.unit && max.unit && min.unit !== max.unit) {
    fail(
      `Mixed units in ${FN}(): "${formatLength(min.value, min.unit)}" and "${formatLength(max.value, max.unit)}". ` +
        `Interpolate between two px values or two rem values, never both.`,
    )
  }

  return min.unit ?? max.unit
}

function buildClamp(rawArgs, options) {
  const { sources, rootFontSize } = options

  if (rawArgs.length !== 2 && rawArgs.length !== 4) {
    fail(`${FN}() takes 2 or 4 arguments — ${FN}(min, max) or ${FN}(min, max, minViewport, maxViewport). Got ${rawArgs.length}.`)
  }

  const min = toLength(rawArgs[0], sources, 'minimum')
  const max = toLength(rawArgs[1], sources, 'maximum')
  const unit = pickUnit(min, max)

  if (unit === null) return '0'

  const minValue = convert(min, unit, rootFontSize)
  const maxValue = convert(max, unit, rootFontSize)

  if (round(minValue) === round(maxValue)) return formatLength(minValue, unit)

  const minViewport = toLength(rawArgs[2] ?? options.minViewport, sources, 'minimum viewport')
  const maxViewport = toLength(rawArgs[3] ?? options.maxViewport, sources, 'maximum viewport')

  if (minViewport.unit && maxViewport.unit && minViewport.unit !== maxViewport.unit) {
    fail(`Mixed viewport units in ${FN}(). Declare both viewport bounds in the same unit.`)
  }

  const minViewportValue = convert(minViewport, unit, rootFontSize)
  const maxViewportValue = convert(maxViewport, unit, rootFontSize)

  if (round(minViewportValue) === round(maxViewportValue)) {
    fail(`${FN}() viewport bounds must differ. Got "${rawArgs[2] ?? options.minViewport}" for both.`)
  }

  const slope = (maxValue - minValue) / (maxViewportValue - minViewportValue)
  const intercept = minValue - slope * minViewportValue
  const viewportTerm = round(slope * 100)

  const lower = formatLength(Math.min(minValue, maxValue), unit)
  const upper = formatLength(Math.max(minValue, maxValue), unit)

  let preferred
  if (round(intercept) === 0) {
    preferred = `${viewportTerm}vw`
  } else if (viewportTerm < 0) {
    preferred = `${formatLength(intercept, unit)} - ${Math.abs(viewportTerm)}vw`
  } else {
    preferred = `${formatLength(intercept, unit)} + ${viewportTerm}vw`
  }

  return `clamp(${lower}, ${preferred}, ${upper})`
}

export function expandFluid(value, options) {
  let output = ''
  let cursor = 0

  for (;;) {
    const call = findCall(value, cursor)

    if (!call) return output + value.slice(cursor)

    output += value.slice(cursor, call.start)
    output += buildClamp(splitArgs(value.slice(call.argsStart, call.argsEnd)), options)
    cursor = call.end
  }
}

/**
 * BEAM point-to-point fluid interpolation.
 *
 * Rewrites `fluid(min, max)` into a plain `clamp()` with pre-computed `vw`
 * math. Token references are resolved at build time, so the output contains no
 * multiplication, no division, and no runtime dependency on the plugin.
 *
 * @param {object} [opts]
 * @param {string} [opts.minViewport] Viewport where the minimum is reached.
 * @param {string} [opts.maxViewport] Viewport where the maximum is reached.
 * @param {string[]} [opts.tokenFiles] Stylesheets to harvest custom properties from.
 * @param {Record<string, string>} [opts.tokens] Inline token overrides.
 * @param {number} [opts.rootFontSize] px value of `1rem`, used to reconcile px and rem bounds.
 * @param {string} [opts.cwd] Base directory for relative `tokenFiles`.
 */
export default function postcssBeamFluid(opts = {}) {
  const {
    minViewport = '40rem',
    maxViewport = '80rem',
    tokenFiles = [],
    tokens = {},
    rootFontSize = 16,
    cwd = process.cwd(),
  } = opts

  const inlineTokens = new Map(
    Object.entries(tokens).map(([name, value]) => [
      name.startsWith('--') ? name : `--${name}`,
      { value: String(value).trim(), scopedToRoot: true },
    ]),
  )

  return {
    postcssPlugin: 'postcss-beam-fluid',

    prepare() {
      let localTokens = new Map()
      let fileTokens = new Map()

      return {
        Once(root) {
          localTokens = collectTokens(root)
          fileTokens = loadTokenFiles(tokenFiles, cwd)
        },

        Declaration(decl) {
          if (!decl.value.includes(`${FN}(`)) return

          try {
            decl.value = expandFluid(decl.value, {
              minViewport,
              maxViewport,
              rootFontSize,
              sources: [localTokens, inlineTokens, fileTokens],
            })
          } catch (error) {
            if (error instanceof FluidError) throw decl.error(error.message, { plugin: 'postcss-beam-fluid' })
            throw error
          }
        },
      }
    },
  }
}

postcssBeamFluid.postcss = true
