# beamcss.dev

The website for **BEAM** — Block, Element, Attribute, Module. A strict, browser-native CSS
architecture.

The site is also the reference implementation. The five required stylesheets in `src/styles/` are the
ones offered for download on `/install`, copied at build time so the documentation and the artifact
cannot drift apart. `fonts.css` — BEAM's optional sixth file — stays out of that download because it
imports Fontsource packages a fresh project will not have.

## Stack

- **Astro** — static output, zero client JS except two small inline scripts (theme resolution and
  clipboard).
- **PostCSS** with one local plugin, `postcss-beam-fluid`, which compiles `fluid()` to `clamp()`.
- **Fontsource** — Instrument Serif for display, Instrument Sans for body, JetBrains Mono for code.
  Self-hosted, no third-party font requests.
- No Tailwind, no SASS, no CSS-in-JS. That would be a slightly awkward look for this particular site.

## Layout

```text
src/
  styles/            The global layer: five required files plus fonts.css.
  components/        One block per component, CSS co-located.
  layouts/           RootLayout: head, theme boot, skip link, chrome.
  pages/             /, /spec, /lineage, /install — each with co-located CSS.
  lib/
    highlight.ts     Syntax highlighter emitting data-token attributes, not inline styles.
    site.ts          External URLs and survey citations, in one place.

packages/
  postcss-beam-fluid/  The published plugin, with its own tests.

public/
  skill/             The agent skill: SKILL.md, reference.md, examples.md.
  starter/           Generated. Do not edit; edit src/styles instead.

scripts/
  sync-starter.mjs   src/styles → public/starter. Runs on predev and prebuild.
  build-og.mjs       Renders public/og.png. Run by hand, commit the result.
  build-icons.mjs    Renders the favicon/apple-touch rasters. Same.
  check-contrast.mjs WCAG audit of every semantic colour pair the design uses.
  check-links.mjs    Resolves every internal href and fragment against dist/.
  verify-build.mjs   Post-build guards (see below).
  lib/oklch.mjs      OKLCH → sRGB, shared by the audit and the image scripts.
```

## Commands

| Command         | Does                                                                            |
| --------------- | ------------------------------------------------------------------------------- |
| `pnpm dev`      | Dev server. Syncs the starter kit first.                                        |
| `pnpm build`    | Static build to `dist/`.                                                        |
| `pnpm verify`   | Everything: plugin tests, contrast audit, build, post-build guards, link check. |
| `pnpm test`     | The `postcss-beam-fluid` suite.                                                 |
| `pnpm contrast` | Prints the real WCAG ratio for every semantic pair.                             |
| `pnpm links`    | Checks internal links and fragments in `dist/`.                                 |
| `pnpm og`       | Regenerates `public/og.png`.                                                    |
| `pnpm icons`    | Regenerates the favicon and touch icons.                                        |

Run the dev server in background mode when working with an agent:

```bash
pnpm astro dev --background
```

## What `verify-build` enforces

These are the failure modes that are silent otherwise, which is the only reason they are automated:

1. **No raw `fluid(`** in built CSS. If one survives, PostCSS never ran and every fluid size on the
   site is invalid.
2. **No Layer 1 or Layer 2 token** read by a visual property. That would mean something reached
   through the colour firewall and will not theme.
3. **`<html>` carries a server-rendered `data-theme`**, so the semantic layer resolves with
   JavaScript disabled.
4. **Every class in the rendered DOM fits the taxonomy** — a block, an element, or one of `l_`, `u_`,
   `g_`. The homepage invites readers to open the inspector and check, so this needs to be true on
   every deploy, not just the day it was written.

## Brand assets

`og.png` and the icon rasters are generated but **committed**, and their scripts are deliberately not
wired into `prebuild`. A brand asset that changes because a CI runner swapped its default monospace
font is not a build artifact, it is a surprise. Regenerate them when you mean to.

## Licence

MIT. The stylesheets, the skill and the plugin are all yours to take.
