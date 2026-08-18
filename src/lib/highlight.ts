/**
 * A small, dependency-free syntax highlighter.
 *
 * Off-the-shelf highlighters paint with inline `style` attributes full of raw
 * hex codes. On a site that argues colors must pass through a token layer,
 * that would be an embarrassing exception, and it would break theme switching.
 *
 * So this emits semantic `data-token` attributes instead. Color lives in
 * theme.css as `--syntax-*`, which means code blocks re-theme for free, exactly
 * like every other component.
 */

export type Language = 'css' | 'html' | 'tsx' | 'lua' | 'bash' | 'json' | 'text'

type TokenName =
  | 'comment'
  | 'keyword'
  | 'selector'
  | 'attribute'
  | 'property'
  | 'variable'
  | 'function'
  | 'number'
  | 'string'
  | 'value'
  | 'punctuation'
  | 'tag'
  | 'meta'

interface Piece {
  token: TokenName | null
  text: string
}

const WHITESPACE = /\s+/y
const BLOCK_COMMENT = /\/\*[\s\S]*?(?:\*\/|$)/y
const LINE_COMMENT = /\/\/[^\n]*/y
const HASH_COMMENT = /#[^\n]*/y
const QUOTED = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y
const TEMPLATE = /`(?:[^`\\]|\\[\s\S])*`/y
const AT_RULE = /@[\w-]+/y
const CUSTOM_PROPERTY = /--[\w-]+/y
const ATTRIBUTE_SELECTOR = /\[[^\]\n]*\]/y
const CLASS_SELECTOR = /\.-?[_a-zA-Z][\w-]*/y
const ID_SELECTOR = /#-?[_a-zA-Z][\w-]*/y
const PSEUDO = /::?[\w-]+/y
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/y
const CALLEE = /[-\w]+(?=\()/y
const NUMBER = /[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?(?:%|[a-zA-Z]+)?/y
const IDENTIFIER = /-?[_a-zA-Z][\w-]*/y
const PUNCTUATION = /[-{}()[\];:,>+~*=!&|/?.]/y

function at(pattern: RegExp, source: string, index: number): string | null {
  pattern.lastIndex = index
  const match = pattern.exec(source)

  return match ? match[0] : null
}

/* -------------------------------------------------------------------------- */
/* CSS
/* -------------------------------------------------------------------------- */

/**
 * Decides whether a statement inside a block is a declaration or a nested rule.
 * Scanning to the first structural delimiter is what lets `&:hover {` read as a
 * selector while `color: red;` reads as a declaration.
 */
function isDeclaration(source: string, from: number): boolean {
  let depth = 0

  for (let i = from; i < source.length; i += 1) {
    const char = source[i]

    if (char === '(' || char === '[') depth += 1
    else if (char === ')' || char === ']') depth -= 1
    else if (depth === 0) {
      if (char === '{') return false
      if (char === ';' || char === '}') return true
    }
  }

  return true
}

function tokenizeCss(source: string): Piece[] {
  const pieces: Piece[] = []
  let index = 0
  let depth = 0
  let statement: 'selector' | 'declaration' = 'selector'
  let inValue = false
  let statementStart = true

  const push = (token: TokenName | null, text: string) => {
    pieces.push({ token, text })
    index += text.length
  }

  while (index < source.length) {
    const space = at(WHITESPACE, source, index)
    if (space) {
      push(null, space)
      continue
    }

    const comment = at(BLOCK_COMMENT, source, index)
    if (comment) {
      push('comment', comment)
      continue
    }

    if (statementStart) {
      statement = depth === 0 ? 'selector' : isDeclaration(source, index) ? 'declaration' : 'selector'
      inValue = false
      statementStart = false
    }

    const char = source[index]

    if (char === '{') {
      depth += 1
      statementStart = true
      push('punctuation', char)
      continue
    }

    if (char === '}') {
      depth -= 1
      statementStart = true
      push('punctuation', char)
      continue
    }

    if (char === ';') {
      statementStart = true
      push('punctuation', char)
      continue
    }

    if (char === ':' && statement === 'declaration' && !inValue) {
      inValue = true
      push('punctuation', char)
      continue
    }

    const quoted = at(QUOTED, source, index)
    if (quoted) {
      push('string', quoted)
      continue
    }

    const atRule = at(AT_RULE, source, index)
    if (atRule) {
      push('keyword', atRule)
      continue
    }

    const customProperty = at(CUSTOM_PROPERTY, source, index)
    if (customProperty) {
      push('variable', customProperty)
      continue
    }

    if (statement === 'selector') {
      const attributeSelector = at(ATTRIBUTE_SELECTOR, source, index)
      if (attributeSelector) {
        push('attribute', attributeSelector)
        continue
      }

      const classSelector = at(CLASS_SELECTOR, source, index)
      if (classSelector) {
        push('selector', classSelector)
        continue
      }

      const idSelector = at(ID_SELECTOR, source, index)
      if (idSelector) {
        push('selector', idSelector)
        continue
      }

      const pseudo = at(PSEUDO, source, index)
      if (pseudo) {
        push('selector', pseudo)
        continue
      }

      if (char === '&') {
        push('selector', char)
        continue
      }
    }

    const hex = at(HEX_COLOR, source, index)
    if (hex) {
      push('number', hex)
      continue
    }

    const callee = at(CALLEE, source, index)
    if (callee) {
      push('function', callee)
      continue
    }

    const number = at(NUMBER, source, index)
    if (number) {
      push('number', number)
      continue
    }

    const identifier = at(IDENTIFIER, source, index)
    if (identifier) {
      if (statement === 'declaration') push(inValue ? 'value' : 'property', identifier)
      else push('tag', identifier)
      continue
    }

    const punctuation = at(PUNCTUATION, source, index)
    if (punctuation) {
      push('punctuation', punctuation)
      continue
    }

    push(null, char)
  }

  return pieces
}

/* -------------------------------------------------------------------------- */
/* HTML
/* -------------------------------------------------------------------------- */

const HTML_COMMENT = /<!--[\s\S]*?(?:-->|$)/y
const DOCTYPE = /<!\w[^>]*>/y
const TAG_OPEN = /<\/?[a-zA-Z][\w.-]*/y
const ATTRIBUTE_NAME = /[@:a-zA-Z_][\w:.-]*/y
const TEXT_RUN = /[^<]+/y

/** Class attributes get per-name coloring so markup and stylesheet visually rhyme. */
function pushClassList(pieces: Piece[], raw: string) {
  const quote = raw[0]
  const inner = raw.slice(1, -1)

  pieces.push({ token: 'punctuation', text: quote })

  for (const part of inner.split(/(\s+)/)) {
    if (!part) continue
    pieces.push({ token: /^\s+$/.test(part) ? null : 'selector', text: part })
  }

  pieces.push({ token: 'punctuation', text: quote })
}

function tokenizeHtml(source: string): Piece[] {
  const pieces: Piece[] = []
  let index = 0
  let insideTag = false
  let attributeName = ''

  const push = (token: TokenName | null, text: string) => {
    pieces.push({ token, text })
    index += text.length
  }

  while (index < source.length) {
    if (!insideTag) {
      const comment = at(HTML_COMMENT, source, index)
      if (comment) {
        push('comment', comment)
        continue
      }

      const doctype = at(DOCTYPE, source, index)
      if (doctype) {
        push('meta', doctype)
        continue
      }

      const tagOpen = at(TAG_OPEN, source, index)
      if (tagOpen) {
        const slashLength = tagOpen.startsWith('</') ? 2 : 1
        push('punctuation', tagOpen.slice(0, slashLength))
        push('tag', tagOpen.slice(slashLength))
        insideTag = true
        continue
      }

      const text = at(TEXT_RUN, source, index)
      if (text) {
        push(null, text)
        continue
      }

      push(null, source[index])
      continue
    }

    const space = at(WHITESPACE, source, index)
    if (space) {
      push(null, space)
      continue
    }

    const char = source[index]

    if (char === '>' || (char === '/' && source[index + 1] === '>')) {
      const closer = char === '>' ? '>' : '/>'
      insideTag = false
      attributeName = ''
      push('punctuation', closer)
      continue
    }

    if (char === '=') {
      push('punctuation', char)
      continue
    }

    const quoted = at(QUOTED, source, index)
    if (quoted) {
      if (attributeName === 'class') {
        pushClassList(pieces, quoted)
        index += quoted.length
      } else {
        push('string', quoted)
      }
      attributeName = ''
      continue
    }

    const name = at(ATTRIBUTE_NAME, source, index)
    if (name) {
      attributeName = name
      push('attribute', name)
      continue
    }

    push(null, char)
  }

  return pieces
}

/* -------------------------------------------------------------------------- */
/* TSX / JavaScript
/* -------------------------------------------------------------------------- */

const TSX_KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'class',
  'const',
  'default',
  'else',
  'export',
  'extends',
  'false',
  'from',
  'function',
  'if',
  'import',
  'interface',
  'let',
  'new',
  'null',
  'return',
  'satisfies',
  'this',
  'true',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
])

const JSX_TAG = /<\/?[A-Za-z][\w.]*/y

function tokenizeTsx(source: string): Piece[] {
  const pieces: Piece[] = []
  let index = 0

  const push = (token: TokenName | null, text: string) => {
    pieces.push({ token, text })
    index += text.length
  }

  while (index < source.length) {
    const space = at(WHITESPACE, source, index)
    if (space) {
      push(null, space)
      continue
    }

    const lineComment = at(LINE_COMMENT, source, index)
    if (lineComment) {
      push('comment', lineComment)
      continue
    }

    const blockComment = at(BLOCK_COMMENT, source, index)
    if (blockComment) {
      push('comment', blockComment)
      continue
    }

    const template = at(TEMPLATE, source, index)
    if (template) {
      push('string', template)
      continue
    }

    const quoted = at(QUOTED, source, index)
    if (quoted) {
      push('string', quoted)
      continue
    }

    const customProperty = at(CUSTOM_PROPERTY, source, index)
    if (customProperty) {
      push('variable', customProperty)
      continue
    }

    const jsxTag = at(JSX_TAG, source, index)
    if (jsxTag) {
      const slashLength = jsxTag.startsWith('</') ? 2 : 1
      push('punctuation', jsxTag.slice(0, slashLength))
      push('tag', jsxTag.slice(slashLength))
      continue
    }

    const callee = at(CALLEE, source, index)
    if (callee) {
      push(TSX_KEYWORDS.has(callee) ? 'keyword' : 'function', callee)
      continue
    }

    const number = at(NUMBER, source, index)
    if (number) {
      push('number', number)
      continue
    }

    const identifier = at(IDENTIFIER, source, index)
    if (identifier) {
      const assigned = /^\s*=[^=]/.test(source.slice(index + identifier.length))

      if (TSX_KEYWORDS.has(identifier)) push('keyword', identifier)
      else if (assigned) push('attribute', identifier)
      else if (/^[A-Z]/.test(identifier)) push('tag', identifier)
      else push('value', identifier)
      continue
    }

    const punctuation = at(PUNCTUATION, source, index)
    if (punctuation) {
      push('punctuation', punctuation)
      continue
    }

    push(null, source[index])
  }

  return pieces
}

/* -------------------------------------------------------------------------- */
/* Shell
/* -------------------------------------------------------------------------- */

const SHELL_FLAG = /--?[\w-]+/y
const SHELL_CHAIN = /&&|\|\||[|;]/y
const SHELL_WORD = /[^\s"'#|;&]+/y

function tokenizeBash(source: string): Piece[] {
  const pieces: Piece[] = []
  let index = 0
  let expectCommand = true

  const push = (token: TokenName | null, text: string) => {
    pieces.push({ token, text })
    index += text.length
  }

  while (index < source.length) {
    const space = at(WHITESPACE, source, index)
    if (space) {
      if (space.includes('\n')) expectCommand = true
      push(null, space)
      continue
    }

    const comment = at(HASH_COMMENT, source, index)
    if (comment) {
      push('comment', comment)
      continue
    }

    const quoted = at(QUOTED, source, index)
    if (quoted) {
      push('string', quoted)
      continue
    }

    const chain = at(SHELL_CHAIN, source, index)
    if (chain) {
      expectCommand = true
      push('punctuation', chain)
      continue
    }

    const flag = at(SHELL_FLAG, source, index)
    if (flag) {
      push('keyword', flag)
      continue
    }

    const word = at(SHELL_WORD, source, index)
    if (word) {
      push(expectCommand ? 'function' : 'value', word)
      expectCommand = false
      continue
    }

    push(null, source[index])
  }

  return pieces
}

/* -------------------------------------------------------------------------- */
/* Lua
/* -------------------------------------------------------------------------- */

const LUA_KEYWORDS = new Set([
  'and',
  'break',
  'do',
  'else',
  'elseif',
  'end',
  'false',
  'for',
  'function',
  'goto',
  'if',
  'in',
  'local',
  'nil',
  'not',
  'or',
  'repeat',
  'return',
  'then',
  'true',
  'until',
  'while',
])

const LUA_BLOCK_COMMENT = /--\[\[[\s\S]*?(?:\]\]|$)/y
const LUA_LINE_COMMENT = /--[^\n]*/y
const LUA_LONG_STRING = /\[\[[\s\S]*?(?:\]\]|$)/y
const LUA_IDENTIFIER = /[_a-zA-Z]\w*/y
const LUA_PUNCTUATION = /\.\.\.?|[-+*/%^#=~<>(){}[\];:,.]/y

/**
 * True when the last meaningful token was `.` or `:`, meaning the identifier
 * about to be read is a table field. Walking emitted pieces rather than raw
 * characters keeps a comment ending in a full stop from looking like access.
 */
function followsAccessor(pieces: Piece[]): boolean {
  for (let index = pieces.length - 1; index >= 0; index -= 1) {
    const piece = pieces[index]
    if (piece.token === null && /^\s+$/.test(piece.text)) continue

    return piece.token === 'punctuation' && (piece.text === '.' || piece.text === ':')
  }

  return false
}

function tokenizeLua(source: string): Piece[] {
  const pieces: Piece[] = []
  let index = 0

  const push = (token: TokenName | null, text: string) => {
    pieces.push({ token, text })
    index += text.length
  }

  while (index < source.length) {
    const space = at(WHITESPACE, source, index)
    if (space) {
      push(null, space)
      continue
    }

    /* Block comments first: `--[[` also matches the line comment pattern. */
    const blockComment = at(LUA_BLOCK_COMMENT, source, index)
    if (blockComment) {
      push('comment', blockComment)
      continue
    }

    const lineComment = at(LUA_LINE_COMMENT, source, index)
    if (lineComment) {
      push('comment', lineComment)
      continue
    }

    const longString = at(LUA_LONG_STRING, source, index)
    if (longString) {
      push('string', longString)
      continue
    }

    const quoted = at(QUOTED, source, index)
    if (quoted) {
      push('string', quoted)
      continue
    }

    const number = at(NUMBER, source, index)
    if (number) {
      push('number', number)
      continue
    }

    const identifier = at(LUA_IDENTIFIER, source, index)
    if (identifier) {
      const isCall = /^\s*[({"']/.test(source.slice(index + identifier.length))

      if (LUA_KEYWORDS.has(identifier)) push('keyword', identifier)
      else if (isCall) push('function', identifier)
      else if (followsAccessor(pieces)) push('property', identifier)
      else push('variable', identifier)

      continue
    }

    const punctuation = at(LUA_PUNCTUATION, source, index)
    if (punctuation) {
      push('punctuation', punctuation)
      continue
    }

    push(null, source[index])
  }

  return pieces
}

/* -------------------------------------------------------------------------- */
/* JSON
/* -------------------------------------------------------------------------- */

function tokenizeJson(source: string): Piece[] {
  const pieces: Piece[] = []
  let index = 0

  const push = (token: TokenName | null, text: string) => {
    pieces.push({ token, text })
    index += text.length
  }

  while (index < source.length) {
    const space = at(WHITESPACE, source, index)
    if (space) {
      push(null, space)
      continue
    }

    const quoted = at(QUOTED, source, index)
    if (quoted) {
      const rest = source.slice(index + quoted.length)
      push(/^\s*:/.test(rest) ? 'property' : 'string', quoted)
      continue
    }

    const number = at(NUMBER, source, index)
    if (number) {
      push('number', number)
      continue
    }

    const identifier = at(IDENTIFIER, source, index)
    if (identifier) {
      push('keyword', identifier)
      continue
    }

    const punctuation = at(PUNCTUATION, source, index)
    if (punctuation) {
      push('punctuation', punctuation)
      continue
    }

    push(null, source[index])
  }

  return pieces
}

/* -------------------------------------------------------------------------- */
/* Public API
/* -------------------------------------------------------------------------- */

const TOKENIZERS: Record<Language, (source: string) => Piece[]> = {
  css: tokenizeCss,
  html: tokenizeHtml,
  tsx: tokenizeTsx,
  lua: tokenizeLua,
  bash: tokenizeBash,
  json: tokenizeJson,
  text: (source) => [{ token: null, text: source }],
}

function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Tokenizes `source` and returns HTML.
 *
 * @param source Code to highlight. Leading and trailing blank lines are trimmed.
 * @param language Tokenizer to use. Unknown languages fall through to plain text.
 * @param tokenClass BEAM element class applied to every emitted span.
 */
export function highlight(source: string, language: Language = 'text', tokenClass = 'code_block-token'): string {
  const tokenize = TOKENIZERS[language] ?? TOKENIZERS.text
  const code = source.replace(/^\n+/, '').replace(/\s+$/, '')

  return tokenize(code)
    .map(({ token, text }) =>
      token === null
        ? escapeHtml(text)
        : `<span class="${tokenClass}" data-token="${token}">${escapeHtml(text)}</span>`,
    )
    .join('')
}

/** Language label shown in the code block chrome. */
export const LANGUAGE_LABELS: Record<Language, string> = {
  css: 'CSS',
  html: 'HTML',
  tsx: 'TSX',
  lua: 'Lua',
  bash: 'Shell',
  json: 'JSON',
  text: 'Text',
}
