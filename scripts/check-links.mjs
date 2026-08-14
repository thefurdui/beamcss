/**
 * Walks dist/ and resolves every internal href against what was actually built,
 * including fragment targets. A broken anchor is the cheapest possible bug to
 * ship and the most annoying to receive.
 *
 * Usage: pnpm links   (after a build)
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')

const pages = []

const collect = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name)
    if (entry.isDirectory()) await collect(full)
    else if (extname(entry.name) === '.html') pages.push(full)
  }
}

await collect(dist)

/** Route path → the set of ids that page renders. */
const anchors = new Map()
/** Route path → its raw markup, kept so hrefs are scanned once. */
const markup = new Map()

for (const page of pages) {
  const route = `/${page
    .slice(dist.length + 1)
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '')}`
  const html = await readFile(page, 'utf8')

  markup.set(route, html)
  anchors.set(route, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])))
}

const exists = async (path) =>
  stat(resolve(dist, path.replace(/^\//, ''))).then(
    () => true,
    () => false,
  )

let failures = 0
let checked = 0

for (const [route, html] of markup) {
  for (const match of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = match[1]

    if (/^(https?:|mailto:|tel:)/.test(href)) continue

    checked += 1

    const [path, fragment] = href.split('#')
    const target = path === '' ? route : path

    if (path !== '') {
      const isPage = anchors.has(target)
      const isAsset = !isPage && (await exists(target))

      if (!isPage && !isAsset) {
        failures += 1
        console.error(`FAIL  ${route} → ${href}  (no such page or file)`)
        continue
      }

      if (!isPage) continue
    }

    if (fragment && !anchors.get(target)?.has(fragment)) {
      failures += 1
      console.error(`FAIL  ${route} → ${href}  (no element with id="${fragment}")`)
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} broken link(s) of ${checked} internal href(s).`)
  process.exit(1)
}

console.log(`check-links: ${checked} internal href(s) across ${pages.length} page(s) all resolve.`)
