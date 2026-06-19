---
name: beam
description: Apply and review BEAM (Block, Element, Attribute, Module) CSS architecture v2026. Use when writing or changing CSS, styling components/pages, creating theme/layout/utils/generics files, configuring BEAM PostCSS fluid interpolation, reviewing class names/tokens/state, or when the user mentions BEAM, beamcss, semantic CSS, no Tailwind, no CSS-in-JS, or no SASS.
---

# BEAM CSS Architecture

BEAM means **Block, Element, Attribute, Module**. It is strict, semantic, browser-native CSS built around component identity, flat editor-searchable selectors, `data-*` state, and design tokens.

## Load Order

1. Read `reference.md` when you need token names, layout APIs, file ownership, or PostCSS setup.
2. Read `examples.md` when generating or reviewing component/page code.
3. If the host project has `src/styles/theme.css`, treat it as the source of truth for token names.

## Non-Negotiable Rules

| Do not write | Required replacement |
| --- | --- |
| Tailwind/atomic classes like `flex`, `mt-4`, `bg-white` | BEAM classes plus semantic tokens |
| SASS/LESS syntax like `@mixin`, `@extend` | Native CSS processed by the project toolchain |
| `&-element` selector concatenation | Full selector: `.block_name-element_name` |
| Visual inline styles | CSS classes; inline style only for `--c-*` custom properties |
| Raw colors in component CSS | Layer 3 semantic tokens or local `--c-*` quarantine |
| State classes like `.is-active`, `.button--active` | HTML `data-*` attributes |
| `--palette-*` / `--theme-*` in component CSS | Layer 3 semantic tokens only |
| Random `z-index` numbers | `--z-*` strata plus `calc()` deltas |
| Hand-written responsive `clamp()` formulas | BEAM `fluid(min, max)` |
| `l_*` and block class on the same element | Wrapper composition |

## Class Taxonomy

Every class must fit one of these buckets.

| Class type | Syntax | Owns | Example |
| --- | --- | --- | --- |
| Block | `snake_case` | Component/page identity | `.user_card` |
| Element | `block_name-element_name` | A child part of one block | `.user_card-main_title` |
| Layout | `l_*` | Spatial geometry only | `.l_stack` |
| Utility | `u_*` | State-free behavior/reset | `.u_reset_button` |
| Generic | `g_*` | Global reusable visual object | `.g_divider` |

### Naming

- Convert component filenames to snake case: `UserCard.tsx` → `.user_card`, `RootLayout.astro` → `.root_layout`.
- For framework route files with generic names (`index.astro`, `page.tsx`), use the route’s semantic identity as the block (`.home_page`) and keep route CSS co-located.
- Attach elements with one hyphen after the block; use underscores inside the element name.
- Never mirror DOM depth in class names or CSS nesting.

```css
/* Correct */
.nav_bar-list_item {}
.nav_bar-action_button {}

/* Wrong */
.nav_bar-list-item {}
.nav_bar .list_item {}
.nav_bar {
  &-list_item {}
}
```

## Attribute State

Use HTML attributes for state and variation.

```html
<article class="promo_card" data-featured="true" data-state="loading">
```

```css
.promo_card[data-featured='true'] {
  border-color: var(--border-focus);
}
```

Nested state selectors are acceptable only when the project processes or supports native nesting:

```css
.promo_card {
  &[data-featured='true'] {
    border-color: var(--border-focus);
  }
}
```

## Binary Rule

Never put an `l_*` layout class and a block class on the same element.

```html
<!-- Wrong -->
<article class="l_stack promo_card">

<!-- Correct -->
<article class="promo_card">
  <div class="l_stack" data-gap="4">...</div>
</article>
```

Exception: a block may position a direct child `.l_container` only for z-axis anchoring, without changing the layout primitive’s display model.

## Variables

Components consume **Layer 3 semantics**. Do not skip layers.

| Layer | Prefix | File | Component access |
| --- | --- | --- | --- |
| 1 Foundations | `--palette-*`, `--typeface-*` | `theme.css` | Never |
| 2 Themes | `--theme-light-*`, `--theme-dark-*` | `theme.css` | Never |
| 3 Semantics | `--bg-*`, `--ink-*`, `--border-*`, `--action-*`, `--space-*`, `--text-*`, `--font-*`, etc. | `theme.css` | Yes |
| 4 Component | `--c-*` | local CSS / inline custom properties | Local API only |

Use `--c-*` for component-specific exceptions and JS/props APIs:

```tsx
<article className="promo_card" style={{ '--c-card-bg': themeColor } as React.CSSProperties}>
```

```css
.promo_card {
  background: var(--c-card-bg, var(--bg-surface));
}
```

## Spacing: Void vs Mass

- **Void** (`margin`, `padding`, `gap`) must use numeric `--space-*` tokens.
- **Mass** (`width`, `height`, `inset`, `transform` distances) uses raw `rem`/`px` or `--size-*`, never `--space-*`.

```css
.profile_card {
  padding: var(--space-4);
}

.profile_card-avatar {
  width: 3rem;
  height: 3rem;
}
```

## Layout Primitives

Use global `l_*` primitives for page geometry and spacing. Configure them with `data-*` attributes.

```html
<div class="l_container" data-size="prose">
  <div class="l_stack" data-gap="8">
    <article class="profile_card">...</article>
  </div>
</div>
```

Layout classes own display, direction, grid columns, wrapping, and gap. Blocks own visuals and component internals.

## CSS Authoring

- Prefer flat selectors. Keep component element selectors at the root level.
- Nest at most one level, only for state, pseudo-selectors, and queries when supported.
- Never use `&` to concatenate class names.
- Use `fluid(min, max)` for BEAM responsive interpolation.
- Run the project build after touching `fluid()`, PostCSS config, or token files.

```css
.hero_card-title {
  font-size: fluid(var(--text-4xl), var(--text-9xl));
}
```

## File Ownership

Keep the global five-file setup distinct:

```text
src/styles/
  reset.css      # Browser normalization; no classes
  theme.css      # Foundations, themes, semantic tokens
  layout.css     # l_* spatial primitives
  utils.css      # u_* zero-state utilities
  generics.css   # g_* global UI objects
```

Component/page CSS owns exactly one block plus its elements. Do not duplicate global responsibilities in component CSS.

## Implementation Workflow

1. Identify the block name from the component/page identity.
2. Create or update the co-located CSS module for that block.
3. Put external geometry in `l_*` wrappers; keep visuals on the block.
4. Name child classes as flat `block_name-element_name`.
5. Represent state and variants with `data-*`.
6. Use Layer 3 semantic tokens; use `--c-*` only for local APIs/exceptions.
7. Use `fluid()` for responsive token interpolation.
8. Build or run the nearest CSS validation before final output.

## Review Checklist

- No Tailwind/atomic class soup, SASS, CSS-in-JS styling, or visual inline styles.
- No `&-element`, DOM-depth selector nesting, state classes, or BEM modifiers.
- No `l_*` plus block class on the same element.
- No raw colors or Layer 1/2 tokens in component CSS.
- Void spacing uses `--space-*`; mass does not.
- Transitions use `--duration-*` and `--ease-*`; z-index uses `--z-*`.
- `fluid()` is compiled by PostCSS and no raw `fluid(` remains in built CSS.

## References

- Token catalog, layout API, PostCSS setup: `reference.md`
- Compliant examples and anti-pattern corrections: `examples.md`
