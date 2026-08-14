# postcss-beam-fluid

Point-to-point fluid interpolation for [BEAM CSS](https://beamcss.dev). Write `fluid(min, max)`, ship a plain `clamp()`.

```bash
pnpm add -D postcss-beam-fluid
```

## Why

Fluid typography and spacing are solved problems with an unsolved ergonomics story. The formula is always the same, and it is always written by hand:

```css
/* "2.25rem at 640px, 8rem at 1280px." Obvious, right? */
font-size: clamp(2.25rem, calc(2.25rem + (8 - 2.25) * ((100vw - 40rem) / (80 - 40))), 8rem);
```

Nobody reads that. Nobody audits that. Nobody notices when the second `2.25rem` drifts out of sync with the first. So you write it once, copy it forever, and your type scale quietly stops being a scale.

`fluid()` states the intent instead:

```css
font-size: fluid(var(--text-4xl), var(--text-9xl));
```

At build time that becomes:

```css
font-size: clamp(2.25rem, -3.5rem + 14.375vw, 8rem);
```

No runtime. No `calc()`. No multiplication or division left in the output — just two bounds and a pre-computed slope.

## Setup

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

`tokenFiles` is how the plugin learns your design tokens. It parses the custom properties out of those stylesheets so `fluid(var(--space-4), var(--space-8))` can be resolved without duplicating the scale in your build config. When a token is declared in both `:root` and a themed scope, the `:root` declaration wins.

## Usage

```css
/* Two tokens, global viewport bounds. */
padding: fluid(var(--space-4), var(--space-8));

/* Literals work too. */
gap: fluid(1rem, 3rem);

/* Per-call viewport bounds: min, max, minViewport, maxViewport. */
font-size: fluid(2rem, 8rem, 20rem, 60rem);

/* Multiple calls in one shorthand. */
padding: fluid(var(--space-4), var(--space-8)) fluid(var(--space-6), var(--space-12));

/* Descending is fine — the clamp bounds are ordered for you. */
letter-spacing: fluid(0.04rem, 0rem);
```

## Options

| Option | Default | Purpose |
| --- | --- | --- |
| `minViewport` | `'40rem'` | Viewport width at which the minimum is reached. |
| `maxViewport` | `'80rem'` | Viewport width at which the maximum is reached. |
| `tokenFiles` | `[]` | Stylesheets to harvest custom properties from. Relative to `cwd`. |
| `tokens` | `{}` | Inline token map, e.g. `{ '--space-4': '1rem' }`. Useful in tests. |
| `rootFontSize` | `16` | px value of `1rem`. Used to reconcile px bounds with rem viewports. |
| `cwd` | `process.cwd()` | Base directory for relative `tokenFiles`. |

Resolution order is: custom properties declared in the file being processed, then `tokens`, then `tokenFiles`.

## Rules

The plugin is deliberately strict, because a fluid value that silently resolves to something unintended is worse than a build failure.

- **Static `px` and `rem` only.** `em`, `%`, `vw`, and `ch` depend on context the build cannot see.
- **One unit per call.** `fluid(16px, 2rem)` is a bug, not a convenience.
- **`var()` chains are followed** through as many aliases as you like, and `var(--token, fallback)` uses the fallback when the token is missing.
- **Unresolved tokens throw**, with the file, line, and token name in the message. Nothing degrades quietly.
- **A unitless `0` is allowed** on either side and adopts the unit of its partner.
- **Equal bounds collapse** to a single value instead of emitting a pointless `clamp()`.

## Verifying

Add this to CI. If a raw `fluid(` reaches your build output, the plugin never ran:

```bash
pnpm build && ! rg -q "fluid\(" dist
```

## The maths

For bounds `min`/`max` reached at viewports `v0`/`v1`, all expressed in the same unit:

```text
slope     = (max - min) / (v1 - v0)
intercept = min - slope * v0
output    = clamp(min, intercept + slope * 100vw, max)
```

Because `slope` is a ratio of two same-unit lengths it is unitless, which is why the result is correct whether you work in `px` or `rem`. `intercept` and `slope * 100` are evaluated at build time and printed as literals, so the browser only ever sees a sum of two terms.

## License

MIT
