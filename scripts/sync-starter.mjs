/**
 * Copies the site's own global stylesheets into public/starter/ so the download
 * on /install is literally the CSS this page is wearing. One source of truth
 * means the starter kit cannot drift from the reference implementation.
 *
 * fonts.css is deliberately excluded: the faces you load are yours, and a
 * download that 404s is worse than no download. Write your own and import it
 * first, or skip it on system fonts / when faces already load in the head.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const FILES = ['reset.css', 'theme.css', 'layout.css', 'utils.css', 'generics.css']

const BANNER = (name) => `/*
 * BEAM CSS – ${name}
 * https://beamcss.org/spec/
 *
 * One of the five required global stylesheets. Import in this order:
 *   reset.css → theme.css → layout.css → utils.css → generics.css
 *
 * BEAM also defines a sixth file, fonts.css, holding @font-face and
 * nothing else. Skip it on system fonts, or when faces already load in the
 * document head. It is not part of this download because the files it
 * would reference are yours. Write your own and import it first.
 *
 * theme.css and layout.css contain fluid() calls. Install the build-time
 * plugin, or replace each call with a static value:
 *   npm install --save-dev postcss-beam-fluid
 */

`

const target = resolve(root, 'public/starter')
await mkdir(target, { recursive: true })

for (const name of FILES) {
  const source = await readFile(resolve(root, 'src/styles', name), 'utf8')
  await writeFile(resolve(target, name), BANNER(name) + source, 'utf8')
}

console.log(`sync-starter: wrote ${FILES.length} stylesheets to public/starter/`)
