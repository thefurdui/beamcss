# BEAM Reference

Use this file for exact token, layout, and PostCSS details. If the host project has different token names, prefer the host project over this reference.

## Token Layers

### Layer 1 — Foundations

Defined only in `src/styles/theme.css`.

```css
--palette-white
--palette-black
--palette-stone-50 … --palette-stone-950
--palette-brand-base
--palette-green-500
--palette-yellow-500
--palette-red-500
--typeface-inter
--typeface-outfit
--typeface-azeret
--typeface-system
--typeface-emoji
```

Components never consume Layer 1 directly.

### Layer 2 — Themes

Defined only in `src/styles/theme.css`.

Pattern: `--theme-{light|dark}-{category}-{name}`.

Categories:

- `bg-*`
- `ink-*`
- `border-*`
- `action-*`
- `shadow-*`
- `intent-*-subtle`
- `mix-contrast`

Components never consume Layer 2 directly. Layer 2 exists so Layer 3 semantics can switch by theme.

### Layer 3 — Semantics

Components use this layer.

| Group | Tokens |
| --- | --- |
| Canvas | `--bg-page`, `--bg-surface`, `--bg-surface-hover`, `--bg-overlay`, `--bg-scrim` |
| Ink | `--ink-main`, `--ink-muted`, `--ink-faint`, `--ink-inverse` |
| Chrome | `--border-base`, `--border-focus` |
| Actions | `--action-primary`, `--action-primary-hover`, `--action-neutral`, `--action-neutral-hover`, `--action-contrast`, `--action-contrast-hover`, `--action-danger`, `--action-danger-hover` |
| Brand | `--brand-primary` |
| Intents | `--intent-success-base`, `--intent-success-strong`, `--intent-success-subtle`; same pattern for `warning` and `critical` |
| Shadows | `--shadow-close`, `--shadow-base`, `--shadow-far` |

Theme routing:

- Default is light.
- `[data-theme='dark']` switches semantic pointers to dark.
- `[data-theme='inverse']` flips the subtree against the current outer theme.

### Static Semantics

| Category | Tokens |
| --- | --- |
| Fonts | `--font-body`, `--font-heading`, `--font-mono` |
| Weights | `--weight-light`, `--weight-regular`, `--weight-medium`, `--weight-semibold`, `--weight-bold`, `--weight-extrabold`, `--weight-black` |
| Text sizes | `--text-5xs`, `--text-4xs`, `--text-3xs`, `--text-2xs`, `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl`, `--text-3xl`, `--text-4xl`, `--text-5xl`, `--text-6xl`, `--text-7xl`, `--text-8xl`, `--text-9xl` |
| Leading | `--leading-none`, `--leading-tight`, `--leading-base`, `--leading-relaxed` |
| Radius | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full` |
| Opacity | `--opacity-disabled`, `--opacity-muted` |
| Blur | `--blur-faint`, `--blur-soft`, `--blur-base`, `--blur-heavy`, `--blur-dense` |

Do not use opacity tokens to mute text. Use `--ink-muted` or `--ink-faint`.

### Spacing

Spacing tokens represent **void**: `margin`, `padding`, and `gap`.

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

Do not use `--space-*` for width, height, transform distances, or object mass.

### Motion

| Type | Tokens |
| --- | --- |
| Duration | `--duration-fast`, `--duration-base`, `--duration-slow` |
| Easing | `--ease-standard`, `--ease-enter`, `--ease-exit`, `--ease-spring` |
| Composed | `--transition-pressable` |

Reduced motion sets duration tokens to `0ms`.

### Z-Index

| Token | Value |
| --- | --- |
| `--z-sink` | `-1` |
| `--z-pinned` | `100` |
| `--z-dropdown` | `200` |
| `--z-overlay` | `300` |
| `--z-toast` | `400` |
| `--z-max` | `9999` |

Stack within a stratum with `calc(var(--z-overlay) + 1)`.

### Layer 4 — Component Scope

Use `--c-*` for local exceptions or component APIs.

```css
.promo_card {
  background: var(--c-card-bg, var(--bg-surface));
}
```

Runtime globals injected by JS use `--js-*`.

## Layout API

### `.l_stack`

Vertical flex.

| Attribute | Values |
| --- | --- |
| `data-gap` | `1`, `2`, `3`, `4`, `5`, `6`, `8`, `10`, `12`, `16`, `20`, `24` |
| `data-align` | `start`, `center`, `end` |
| `data-justify` | `start`, `center`, `between`, `end` |

### `.l_cluster`

Horizontal wrapping flex.

| Attribute | Values |
| --- | --- |
| `data-gap` | Same as `.l_stack` |
| `data-align` | `start`, `end`; default is center |
| `data-justify` | `center`, `between`, `end` |
| `data-reverse` | Presence flag |
| `data-nowrap` | Presence flag |

### `.l_grid`

Two-dimensional layout.

| Attribute | Values |
| --- | --- |
| `data-cols` | `2`, `3`, `4`, `auto` |
| `data-layout` | `sidebar` |
| `data-gap` | Same as `.l_stack` |

`data-cols='auto'` uses `--min-col-width`, defaulting to `16rem`.

### `.l_container`

Page bounds and macro padding.

| Attribute | Values |
| --- | --- |
| `data-size` | `prose`, `fluid` |

Default max width is `32rem`. `prose` is `65ch`. `fluid` is `100%`.

### `.l_switcher`

Container-query flex that starts stacked and switches to row.

`data-threshold`: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`.

Parent container behavior is auto-applied with `*:has(> .l_switcher)`.

### `.l_spacer`

Flex grow spacer.

## Utilities

| Class | Purpose |
| --- | --- |
| `:where(.u_reset_button)` | Strip UA button styles with zero specificity |
| `:where(.u_reset_list)` | Strip list styles |
| `.u_sr_only` | Screen-reader-only content |
| `.u_truncate` | Single-line ellipsis |
| `.u_selectable` | Restore selectable text in PWA contexts |
| `.u_pressable` | Active scale/filter; pair with `--transition-pressable` |

## Generics

| Class | Purpose |
| --- | --- |
| `.g_divider` | Horizontal rule; supports `data-variant='transparent'` |
| `.g_spinner` | Loading spinner |
| `.g_icon_box` | Consistent SVG sizing wrapper |
| `.g_prose` | Markdown/CMS typography zone for unclassed descendants |

`.g_prose` is the controlled exception where descendant element selectors are acceptable because the content is intentionally unclassed.

## PostCSS Fluid Interpolation

BEAM uses a custom `postcss-beam-fluid` plugin.

```css
font-size: fluid(var(--text-4xl), var(--text-9xl));
padding-inline: fluid(var(--space-4), var(--space-8));
font-size: fluid(2rem, 8rem, 40rem, 80rem);
```

Current project setup:

```text
postcss.config.mjs
postcss/postcss-beam-fluid.mjs
```

Required config shape:

```js
postcssBeamFluid({
  minViewport: '40rem',
  maxViewport: '80rem',
  tokenFiles: ['src/styles/theme.css'],
})
```

The plugin:

- Resolves `var(--token)` values from configured `tokenFiles`, inline `tokens`, and the current CSS file.
- Supports static `px` and `rem` values only.
- Requires min, max, and viewport values to use the same unit.
- Emits plain `clamp()` with `vw` math, not CSS `*` or `/` division.
- Throws on unresolved tokens or unsupported values so build failures are explicit.

Validation:

```bash
pnpm build
rg "fluid\\(" dist
```

No built CSS should contain raw `fluid(`.

## File Ownership

| File | Owns |
| --- | --- |
| `reset.css` | Browser normalization only |
| `theme.css` | `--palette-*`, `--theme-*`, semantic tokens |
| `layout.css` | `l_*` layout primitives |
| `utils.css` | `u_*` utilities |
| `generics.css` | `g_*` global visual objects |
| `ComponentName.css` / route CSS | One block plus its elements |

## Firewall Rules

1. Components consume Layer 3 semantics only.
2. Semantics must route through themes, not horizontally to other semantics.
3. New reusable colors enter through `theme.css` Layers 1–3.
4. Interactive color extensions need hover pairs.
5. One block owns one CSS module; do not mix unrelated blocks in one component CSS file.
