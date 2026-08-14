import fs from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'

const MAX_HOPS = 16
const cache = new Map()

/**
 * Collects custom properties from a PostCSS root.
 *
 * A token can be declared more than once (`:root` plus a theme scope). The
 * `:root` declaration wins, because that is where BEAM keeps the static
 * numeric scales that `fluid()` is allowed to interpolate.
 */
export function collectTokens(root) {
  const tokens = new Map()

  root.walkDecls(/^--/, (decl) => {
    const scopedToRoot = decl.parent?.type === 'rule' && /(^|,)\s*:root\s*$/.test(decl.parent.selector)
    const existing = tokens.get(decl.prop)

    if (existing && existing.scopedToRoot && !scopedToRoot) return

    tokens.set(decl.prop, { value: decl.value.trim(), scopedToRoot })
  })

  return tokens
}

function readTokenFile(file, cwd) {
  const absolute = path.isAbsolute(file) ? file : path.resolve(cwd, file)
  const stat = fs.statSync(absolute)
  const cached = cache.get(absolute)

  if (cached && cached.mtimeMs === stat.mtimeMs) return cached.tokens

  const tokens = collectTokens(postcss.parse(fs.readFileSync(absolute, 'utf8'), { from: absolute }))
  cache.set(absolute, { mtimeMs: stat.mtimeMs, tokens })

  return tokens
}

export function loadTokenFiles(files, cwd) {
  const merged = new Map()

  for (const file of files) {
    for (const [prop, entry] of readTokenFile(file, cwd)) merged.set(prop, entry)
  }

  return merged
}

/** Splits `var(--name, fallback)` into its two halves without a full value parser. */
function splitVar(input) {
  const inner = input.slice(4, -1)
  let depth = 0

  for (let i = 0; i < inner.length; i += 1) {
    const char = inner[i]
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1
    else if (char === ',' && depth === 0) {
      return { name: inner.slice(0, i).trim(), fallback: inner.slice(i + 1).trim() }
    }
  }

  return { name: inner.trim(), fallback: null }
}

function isVarCall(input) {
  return input.startsWith('var(') && input.endsWith(')')
}

/**
 * Follows a chain of `var()` references down to a literal value.
 * Returns `null` when the chain dead-ends, so callers can raise an error that
 * names the token instead of emitting broken CSS.
 */
export function resolveValue(input, sources) {
  let current = input.trim()

  for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
    if (!isVarCall(current)) return current

    const { name, fallback } = splitVar(current)
    const entry = sources.map((source) => source.get(name)).find(Boolean)

    if (entry) {
      current = entry.value
      continue
    }

    if (fallback === null) return null
    current = fallback
  }

  return null
}
