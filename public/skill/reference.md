# BEAM Reference

Exact token, layout and PostCSS details. If the host project defines different names, the host
project wins — read its `src/styles/theme.css` first.

## Token Layers

### Layer 1 — Foundations

Declared only in `theme.css`. Components never consume these.

```css
--palette-white
--palette-black
--palette-stone-50 … --palette-stone-950
--palette-beam-300 … --palette-beam-800     /* brand */
--palette-cyan-400, --palette-cyan-700      /* single counter-hue */
--palette-green-500, --palette-yellow-500, --palette-red-500

--typeface-instrument-serif
--typeface-instrument-sans
--typeface-jetbrains-mono
```

### Layer 2 — Themes

Declared only in `theme.css`. Components never consume these. This layer exists so Layer 3 can be a
pointer rather than a value.

Pattern: `--theme-{light|dark}-{category}-{name}`.

Categories: `bg-*`, `ink-*`, `border-*`, `action-*`, `brand-*`, `shadow-*`, `intent-*-subtle`,
`syntax-*`, `mix-contrast`.

### Layer 3 — Semantics

The public contract. This is the only layer a component may read.

| Group   | Tokens                                                                                                                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canvas  | `--bg-page`, `--bg-surface`, `--bg-surface-hover`, `--bg-overlay`, `--bg-sunken`, `--bg-scrim`                                                                                         |
| Ink     | `--ink-main`, `--ink-muted`, `--ink-faint`, `--ink-inverse`                                                                                                                            |
| Chrome  | `--border-base`, `--border-strong`, `--border-focus`                                                                                                                                   |
| Actions | `--action-primary`, `--action-primary-hover`, `--action-neutral`, `--action-neutral-hover`, `--action-contrast`, `--action-contrast-hover`, `--action-danger`, `--action-danger-hover` |
| Brand   | `--brand-primary`, `--brand-glow`                                                                                                                                                      |
| Intents | `--intent-success-base`, `--intent-success-strong`, `--intent-success-subtle`; same three for `warning` and `critical`                                                                 |
| Shadows | `--shadow-close`, `--shadow-base`, `--shadow-far`                                                                                                                                      |
| Syntax  | `--syntax-ink`, `--syntax-muted`, `--syntax-accent`, `--syntax-cool`                                                                                                                   |
| Mixing  | `--mix-contrast` — resolves to `black` in light, `white` in dark                                                                                                                       |

Theme routing:

- `<html>` carries an explicit `data-theme="light"` or `data-theme="dark"`. Render one server-side so
  the page is not dependent on JavaScript.
- `[data-theme='inverse']` resolves a subtree against the opposite of the nearest explicit theme.
  It flips once; nesting inverse inside inverse does not flip twice.

Every interactive colour extension needs a matching `-hover` pair.

### Static Semantics

Theme-agnostic constants that bypass the switchboard.

| Category   | Tokens                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Families   | `--font-heading`, `--font-body`, `--font-mono`                                                                                                                                  |
| Weights    | `--weight-light` `300`, `--weight-regular` `400`, `--weight-medium` `500`, `--weight-semibold` `600`, `--weight-bold` `700`, `--weight-extrabold` `800`, `--weight-black` `900` |
| Text sizes | `--text-5xs`, `--text-4xs`, `--text-3xs`, `--text-2xs`, `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` … `--text-9xl`                          |
| Leading    | `--leading-none` `1`, `--leading-tight` `1.2`, `--leading-snug` `1.35`, `--leading-base` `1.5`, `--leading-relaxed` `1.75`                                                      |
| Tracking   | `--tracking-tighter`, `--tracking-tight`, `--tracking-base`, `--tracking-wide`, `--tracking-wider`                                                                              |
| Radius     | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`                                                                                                     |
| Opacity    | `--opacity-disabled` `0.5`, `--opacity-muted` `0.7`                                                                                                                             |
| Blur       | `--blur-faint`, `--blur-soft`, `--blur-base`, `--blur-heavy`, `--blur-dense`                                                                                                    |

Never use opacity tokens to mute text. Use `--ink-muted` or `--ink-faint`.

### Spacing (Void only)

`--space-*` is negative space: `margin`, `padding`, `gap`. The number is the 4px grid step, not an
index, so the scale extends without renumbering.

```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-10: 2.5rem;
--space-12: 3rem;
--space-16: 4rem;
--space-20: 5rem;
--space-24: 6rem;
--space-32: 8rem;
--space-40: 10rem;
```

Never use `--space-*` for width, height, inset or transform distance.

### Motion

| Type     | Tokens                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Duration | `--duration-fast` `150ms`, `--duration-base` `300ms`, `--duration-slow` `500ms` |
| Easing   | `--ease-standard`, `--ease-enter`, `--ease-exit`, `--ease-spring`               |
| Composed | `--transition-pressable`, `--transition-colors`                                 |

`prefers-reduced-motion: reduce` sets every duration token to `0ms`, which is why transitions must
use the tokens. Named `@keyframes` animations may use bespoke timings, because choreography is
authored rather than systematic — guard those with a media query yourself.

### Z-Index

| Token          | Value  | For                              |
| -------------- | ------ | -------------------------------- |
| `--z-sink`     | `-1`   | Decorative layers behind content |
| `--z-pinned`   | `100`  | Sticky headers and rails         |
| `--z-dropdown` | `200`  | Menus, popovers, tooltips        |
| `--z-overlay`  | `300`  | Modals and scrims                |
| `--z-toast`    | `400`  | Transient notifications          |
| `--z-max`      | `9999` | Skip links and debug affordances |

Stack inside a stratum with `calc(var(--z-overlay) + 1)`.

### Layer 4 — Component Scope

`--c-*` for local exceptions and component APIs. `--js-*` for globals injected at runtime, read-only.

```css
.promo_card {
  --c-card-bg: var(--bg-surface);

  background: var(--c-card-bg);
}
```

## Layout API

### `.l_stack`

Vertical flex.

| Attribute      | Values                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `data-gap`     | `0`, `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24`, `32`, `fluid-sm`, `fluid-md`, `fluid-lg`, `fluid-xl` |
| `data-align`   | `start`, `center`, `end`                                                                                                   |
| `data-justify` | `start`, `center`, `between`, `end`                                                                                        |

### `.l_cluster`

Horizontal wrapping flex. Cross-axis default is `center`.

| Attribute      | Values                     |
| -------------- | -------------------------- |
| `data-gap`     | Same as `.l_stack`         |
| `data-align`   | `start`, `end`             |
| `data-justify` | `center`, `between`, `end` |
| `data-reverse` | Presence flag              |
| `data-nowrap`  | Presence flag              |

### `.l_grid`

Two-dimensional layout.

| Attribute     | Values                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| `data-cols`   | `2`, `3`, `4`, `auto`                                                                                           |
| `data-min`    | `xs` `10rem`, `sm` `13rem`, `md` `16rem`, `lg` `20rem`, `xl` `26rem` — the column floor when `data-cols="auto"` |
| `data-layout` | `sidebar` — one column, becoming `fit-content(20rem)` plus fluid content at `64rem`                             |
| `data-gap`    | Same as `.l_stack`                                                                                              |

`data-cols="auto"` is an auto-fit grid whose floor is `--c-min-col-width`, defaulting to `16rem`. Set
it inline for a one-off rather than adding a new `data-min` step.

### `.l_container`

Page bounds and macro padding. Default max width is `32rem`; padding is
`fluid(var(--space-4), var(--space-8))`.

| `data-size` | Max width                          |
| ----------- | ---------------------------------- |
| _(omitted)_ | `32rem`                            |
| `prose`     | `65ch`                             |
| `narrow`    | `44rem`                            |
| `page`      | `72rem`                            |
| `wide`      | `88rem`                            |
| `fluid`     | `100%` — padding and centring only |

A `.l_container` nested inside `data-size="fluid"` drops its own inline padding, so a full-bleed
wrapper around a bounded container does not double up.

### `.l_switcher`

Container-query flex. Starts stacked, switches to a row once the _parent_ container passes the
threshold, so a component moved into a sidebar rearranges itself with no media query edits.

| Attribute        | Values                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-threshold` | `3xs` `16rem`, `2xs` `18rem`, `xs` `20rem`, `sm` `24rem`, `md` `28rem`, `lg` `32rem`, `xl` `36rem`, `2xl` `42rem`, `3xl` `48rem`, `4xl` `56rem`, `5xl` `64rem`, `6xl` `72rem`, `7xl` `80rem` |
| `data-align`     | `start`, `center`, `end`, `stretch` — applies in both directions                                                                                                                             |
| `data-gap`       | Same as `.l_stack`                                                                                                                                                                           |

Parent container behaviour is applied automatically via `*:has(> .l_switcher)`. Child sizing defaults
are wrapped in `:where()`, so a component class can set its own rail width without a specificity
fight.

### `.l_spacer`

Flex-grow spacer.

## Utilities

| Class                     | Purpose                                                  |
| ------------------------- | -------------------------------------------------------- |
| `:where(.u_reset_button)` | Strip UA button styling at zero specificity              |
| `:where(.u_reset_list)`   | Strip list styling                                       |
| `:where(.u_reset_input)`  | Strip input styling                                      |
| `.u_sr_only`              | Screen-reader-only content                               |
| `.u_truncate`             | Single-line ellipsis                                     |
| `.u_nowrap`               | Prevent wrapping                                         |
| `.u_balance`              | `text-wrap: balance` for short headings                  |
| `.u_pretty`               | `text-wrap: pretty` for running prose                    |
| `.u_tabular`              | Tabular figures for numbers that change                  |
| `.u_selectable`           | Restore selectable text in unselectable app shells       |
| `.u_pressable`            | Active scale and dim; pair with `--transition-pressable` |

## Generics

| Class         | Purpose                                                                |
| ------------- | ---------------------------------------------------------------------- |
| `.g_divider`  | Rule; `data-variant='transparent'`, `data-orientation='vertical'`      |
| `.g_spinner`  | Loading spinner                                                        |
| `.g_icon_box` | Consistent SVG sizing wrapper; `data-size='sm' \| 'lg'`                |
| `.g_eyebrow`  | Uppercase mono section label; `data-tone='accent'`                     |
| `.g_tag`      | Compact metadata pill; `data-tone='accent' \| 'success' \| 'critical'` |
| `.g_kbd`      | Keyboard key                                                           |
| `.g_code`     | Inline code; `data-tone='accent'`                                      |
| `.g_prose`    | Typography zone for unclassed Markdown or CMS output                   |

`.g_prose` is the one sanctioned exception to the no-descendant-selectors rule, because its content
is intentionally class-free.

## PostCSS Fluid Interpolation

```bash
npm install --save-dev postcss-beam-fluid
```

```js
// postcss.config.mjs
import postcssBeamFluid from 'postcss-beam-fluid'

export default {
  plugins: [
    postcssBeamFluid({
      minViewport: '40rem',
      maxViewport: '80rem',
      tokenFiles: ['src/styles/theme.css'],
    }),
  ],
}
```

```css
font-size: fluid(var(--text-4xl), var(--text-9xl));
padding-inline: fluid(var(--space-4), var(--space-8));

/* Per-call viewport bounds: min, max, minViewport, maxViewport */
font-size: fluid(2rem, 8rem, 40rem, 80rem);
```

Rules:

- Static `px` or `rem` only. `em`, `%` and `vw` depend on context the build cannot see.
- One unit per call. `fluid(16px, 2rem)` is a mistake, not a shortcut.
- Tokens are resolved from `tokenFiles`, inline `tokens`, and the current file.
- Unresolved tokens throw and fail the build, because a silently wrong size is worse than a red CI.
- Output is a plain `clamp()` with no `*` or `/`; the slope is computed at build time.

Validate:

```bash
npm run build && ! rg -q "fluid\(" dist
```

## File Ownership

| File                            | Owns                                        |
| ------------------------------- | ------------------------------------------- |
| `reset.css`                     | Browser normalisation only; no classes      |
| `theme.css`                     | `--palette-*`, `--theme-*`, semantic tokens |
| `layout.css`                    | `l_*` primitives                            |
| `utils.css`                     | `u_*` utilities                             |
| `generics.css`                  | `g_*` global visual objects                 |
| `ComponentName.css` / route CSS | Exactly one block plus its elements         |

## Firewall Rules

1. Components consume Layer 3 only.
2. Semantics route down through themes, never sideways to another semantic.
3. New reusable colours enter through `theme.css` and get all three layers.
4. Interactive colour extensions need hover pairs.
5. One block owns one CSS module. Never mix unrelated blocks in one file.
