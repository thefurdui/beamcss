/**
 * Post-build guard. A silently wrong stylesheet is worse than a red build, so
 * these checks fail loudly rather than warn.
 *
 *   1. No raw fluid() survived, which would mean PostCSS never ran.
 *   2. No Layer 1 or Layer 2 token is read by a visual property, which would
 *      mean something reached through the colour firewall.
 *   3. <html> ships an explicit data-theme, so semantics resolve without JS.
 *   4. Every class in the rendered DOM fits the five-bucket taxonomy. The
 *      homepage invites people to open the inspector and check this, so it had
 *      better be true on every deploy rather than on the day it was written.
 *
 * public/starter/ is exempt from (1): those files are authored source served
 * verbatim as a download, and their fluid() calls are the point.
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

const EXEMPT = [`${sep}starter${sep}`]

/*
 * Anchored on (?<![\w-]) so that --border-base, which legitimately points at a
 * --palette-*, is not mistaken for a component reading one.
 */
const FIREWALL_LEAK =
  /(?<![\w-])(?:background|background-color|color|border|border-color|border-[a-z-]*color|fill|stroke|box-shadow|outline|outline-color|text-decoration-color|caret-color)\s*:\s*[^;{}]*var\(--(?:palette|theme)-/g

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const found = []

  for (const entry of entries) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) found.push(...(await walk(full)))
    else if (extname(entry.name) === '.css') found.push(full)
  }

  return found
}

const relative = (file) => file.slice(dist.length + 1)

let failures = 0

const fail = (message) => {
  failures += 1
  console.error(`FAIL  ${message}`)
}

const sheets = (await walk(dist)).filter((file) => !EXEMPT.some((fragment) => file.includes(fragment)))

if (sheets.length === 0) {
  fail('no stylesheets found in dist/ — did the build run?')
}

for (const sheet of sheets) {
  const css = await readFile(sheet, 'utf8')

  if (/fluid\(/.test(css)) {
    fail(`${relative(sheet)} still contains a raw fluid() call`)
  }

  for (const leak of css.matchAll(FIREWALL_LEAK)) {
    fail(`${relative(sheet)} reads a Layer 1/2 token from a visual property: ${leak[0].slice(0, 80)}`)
  }
}

const markup = await readFile(resolve(dist, 'index.html'), 'utf8').catch(() => '')

if (!markup) {
  fail('dist/index.html is missing')
} else if (!/<html[^>]+data-theme=/.test(markup)) {
  fail('index.html has no server-rendered data-theme, so semantics depend on JavaScript')
}

/*
 * A block, an element, or one of the three prefixes. Nothing else exists.
 * <pre> content is stripped first, because a code sample demonstrating hashed
 * CSS-in-JS class names is quoting the problem, not committing it.
 */
const TAXONOMY = /^(?:[lug]_[a-z][a-z0-9_]*|[a-z][a-z0-9_]*(?:-[a-z][a-z0-9_]*)?)$/

const htmlFiles = []

const collectHtml = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) await collectHtml(full)
    else if (extname(entry.name) === '.html') htmlFiles.push(full)
  }
}

await collectHtml(dist)

const offenders = new Map()

for (const file of htmlFiles) {
  const source = (await readFile(file, 'utf8')).replace(/<pre[\s\S]*?<\/pre>/g, '')

  for (const attribute of source.matchAll(/\sclass="([^"]*)"/g)) {
    for (const name of attribute[1].split(/\s+/).filter(Boolean)) {
      if (!TAXONOMY.test(name)) {
        offenders.set(name, (offenders.get(name) ?? 0) + 1)
      }
    }
  }
}

for (const [name, count] of offenders) {
  fail(`class "${name}" fits no BEAM bucket (${count} occurrence${count === 1 ? '' : 's'})`)
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}

console.log(
  `verify-build: ${sheets.length} stylesheet(s) clean, ${htmlFiles.length} page(s) taxonomy-clean, theme resolves without JavaScript.`,
)
