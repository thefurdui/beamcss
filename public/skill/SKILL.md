---
name: beam-css
description: Apply and review BEAM (Block, Element, Attribute, Module) CSS architecture. Use when writing or changing CSS, styling components or pages, creating theme/layout/utils/generics files, configuring BEAM PostCSS fluid interpolation, reviewing class names, tokens or state, or when the user mentions BEAM, beamcss, semantic CSS, no Tailwind, no CSS-in-JS, no SASS, no ID selectors, or mobile-first min-width queries.
version: 2026.1
homepage: https://beamcss.org
---

# BEAM CSS Architecture

BEAM means **Block, Element, Attribute, Module**. It is strict, semantic, browser-native CSS built
around component identity, flat editor-searchable selectors, `data-*` state, and design tokens.

## Load Order

1. Read `reference.md` when you need token names, layout APIs, file ownership, or PostCSS setup.
2. Read `examples.md` when generating or reviewing component and page code.
3. If the host project has `src/styles/theme.css`, treat it as the source of truth for token names –
   it outranks anything in this skill.

## Non-Negotiable Rules

| Do not write                                       | Required replacement                                           |
| -------------------------------------------------- | -------------------------------------------------------------- |
| Atomic classes like `flex`, `mt-4`, `bg-white`     | BEAM classes plus semantic tokens                              |
| SASS/LESS syntax like `@mixin`, `@extend`          | Native CSS processed by the project toolchain                  |
| `&-element` selector concatenation                 | Full selector: `.block_name-element_name`                      |
| Visual inline styles                               | CSS classes; inline `style` only for `--c-*` custom properties |
| Raw colours in component CSS                       | Layer 3 semantic tokens, or local `--c-*` quarantine           |
| State classes like `.is-active`, `.button--active` | HTML `data-*` attributes                                       |
| `--palette-*` / `--theme-*` in component CSS       | Layer 3 semantic tokens only                                   |
| Random `z-index` numbers                           | `--z-*` strata plus `calc()` deltas                            |
| Hand-written responsive `clamp()` formulas         | `fluid(min, max)`                                              |
| `l_*` and a block class on the same element        | Wrapper composition                                            |
| `--space-*` on `width`, `height`, `inset`          | Raw `rem` or `px`                                              |
| Literal durations or easings in a `transition`     | `--duration-*` and `--ease-*`                                  |
| ID selectors like `#header`                        | Classes; HTML `id` is for the document, never for CSS          |
| `@media` / `@container` with `max-width`           | Unqueried small-canvas default, then `min-width` only          |

## Class Taxonomy

Every class must fit one of these five buckets. A class that fits none of them is a bug.

| Class type | Syntax                    | Owns                                                | Example                 |
| ---------- | ------------------------- | --------------------------------------------------- | ----------------------- |
| Block      | `snake_case`              | Component or page identity                          | `.user_card`            |
| Element    | `block_name-element_name` | A dependent part of exactly one block               | `.user_card-main_title` |
| Layout     | `l_*`                     | Spatial geometry and rhythm only                    | `.l_stack`              |
| Utility    | `u_*`                     | Single-purpose, state-free behaviour                | `.u_reset_button`       |
| Generic    | `g_*`                     | Global visual object too small for a component file | `.g_divider`            |

### Naming

- Derive the block from the component filename: `UserCard.tsx` → `.user_card`,
  `RootLayout.astro` → `.root_layout`.
- For framework route files with generic names (`index.astro`, `page.tsx`), use the route's semantic
  identity: `.home_page`, `.settings_page`. Keep route CSS co-located.
- Join a block to its element with exactly one hyphen. Use underscores between words inside either
  half. The hyphen therefore means one thing in the whole codebase: _belongs to_.
- Element names are flat. They never encode DOM depth, and selectors never nest to reach them.

```css
/* Correct */
.nav_bar {
}
.nav_bar-list_item {
}
.nav_bar-action_button {
}

/* Wrong */
.nav_bar-list-item {
} /* hyphen now means two things */
.nav_bar .list_item {
} /* mirrors today's markup */
.nav_bar {
  &-list_item {
  }
} /* the string does not exist */
```

## Attribute State

State and variation live in HTML attributes. There are no state classes in BEAM.

```html
<article class="promo_card" data-featured="true" data-state="loading">
  <button class="promo_card-action" data-variant="primary" aria-disabled="true">Save</button>
</article>
```

```css
.promo_card[data-featured='true'] {
  border-color: var(--border-focus);
}

.promo_card-action[data-variant='primary'] {
  background: var(--action-primary);
}
```

| Attribute      | Use for                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-state`   | Mutually exclusive lifecycle: `idle`, `loading`, `error`                                                                                                  |
| `data-variant` | A named visual treatment chosen by the caller                                                                                                             |
| `data-size`    | Discrete size steps                                                                                                                                       |
| `data-*` flags | Independent booleans, written as `"true"` or omitted entirely                                                                                             |
| `aria-*`       | Anything the accessibility tree already models – style `aria-expanded`, `aria-disabled`, `aria-current` directly rather than mirroring them into `data-*` |

Write `data-featured="true"` or omit the attribute. Never `data-featured="false"`, because
`[data-featured]` would then match both states.

Nesting for state is fine where the toolchain supports native nesting:

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
</article>
```

Two classes on one element means two owners for `display`, `gap` and `margin`. It also teaches the
component how it is arranged, so it can no longer be moved without editing it.

**One exception:** a block may set `position: relative` on a direct child `.l_container` to establish
a stacking anchor, provided it does not touch the container's display model.

## Variables

Components consume **Layer 3 semantics**. Never skip layers.

| Layer         | Prefix                                                                                                                                  | Declared in                    | Component access          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------- |
| 1 Foundations | `--palette-*`, `--typeface-*`                                                                                                           | `theme.css`                    | Never                     |
| 2 Themes      | `--theme-light-*`, `--theme-dark-*`                                                                                                     | `theme.css`                    | Never                     |
| 3 Semantics   | `--bg-*`, `--ink-*`, `--border-*`, `--action-*`, `--space-*`, `--text-*`, `--font-*`, `--radius-*`, `--z-*`, `--duration-*`, `--ease-*` | `theme.css`                    | Yes – the public contract |
| 4 Component   | `--c-*`                                                                                                                                 | local CSS, or inline as a prop | Local API only            |

Semantics point **down** at the theme switchboard, never **sideways** at another semantic.
`--button-bg: var(--bg-surface)` creates a token with no theme of its own.

`--c-*` is the component's public API, and setting one is the only legal use of the `style`
attribute:

```tsx
<article className="promo_card" style={{ '--c-card-bg': themeColor } as React.CSSProperties}>
```

```css
.promo_card {
  background: var(--c-card-bg, var(--bg-surface));
}
```

## Spacing: Void vs Mass

- **Void** – `margin`, `padding`, `gap` – always uses numeric `--space-*` tokens. Negative space is
  shared rhythm and must move together across the product.
- **Mass** – `width`, `height`, `inset`, `translate` – uses raw `rem` or `px`. An object's shape
  belongs to that object.

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

Use the global `l_*` primitives for geometry, configured with `data-*` attributes. Flex and grid
utility classes are not part of BEAM.

```html
<div class="l_container" data-size="page">
  <div class="l_stack" data-gap="8">
    <article class="profile_card">...</article>

    <div class="l_switcher" data-threshold="3xl" data-gap="6" data-align="start">
      <div class="profile_card">...</div>
      <aside class="profile_aside">...</aside>
    </div>
  </div>
</div>
```

Layout classes own display, direction, columns, wrapping and gap. Blocks own visuals and internals.
A component may still lay out its own children inside its own stylesheet – the primitives are for
composition _between_ things.

## CSS Authoring

- Prefer flat selectors. Keep component element selectors at the root level of the file.
- Nest at most one level, and only for state, pseudo-classes, or queries.
- Never use `&` to concatenate class names.
- Never select by ID. HTML `id` is a document hook (fragments, skip links, JS), not a style hook.
- Write mobile-first. `@media` and `@container` may use `min-width` only – never `max-width`, and
  never ceiling ranges (`width <`, `width <=`). The `max-width` **property** is still legal.
- Use `fluid(min, max)` rather than hand-written `clamp()`.
- Run the project build after touching `fluid()`, PostCSS config, or token files.

```css
.hero_card-title {
  font-size: fluid(var(--text-4xl), var(--text-9xl));
}
```

## Selectors and queries

Classes are the identity system. An ID selector is a second one with specificity `1,0,0` – no class
combination can override it without `!important` or another ID, and the name cannot be reused.

```css
/* Wrong */
#site_header {
}
[id='site_header'] {
}

/* Correct */
.site_header {
}
```

`:target` is a condition, not an ID selector, and remains legal.

The unqueried rule is the small canvas. Every width query **adds** as the canvas grows.

```css
/* Correct */
.toolbar {
  flex-direction: column;
}

@media (min-width: 48rem) {
  .toolbar {
    flex-direction: row;
  }
}

/* Wrong – large-canvas default, then undo */
.toolbar {
  flex-direction: row;
}

@media (max-width: 47.999rem) {
  .toolbar {
    flex-direction: column;
  }
}
```

Banned in `@media` and `@container`: `max-width` as a feature, and ceiling ranges (`width <`,
`width <=`). Allowed: `min-width`, floor ranges (`width >=`, `width >`), and non-width features
(`prefers-reduced-motion`, `hover`, `pointer`, `prefers-color-scheme`).

`.l_container { max-width: 32rem }` is a size constraint, not a query. That remains legal.

## File Ownership

Five required files, plus `fonts.css` as a sixth. Skip `fonts.css` only when faces come from
the system, or are already loaded outside CSS (a Google Fonts `<link>` in the document head, or a
bundler import such as Fontsource). Listed in import order:

```text
src/styles/
  fonts.css      # @font-face only – skip on system fonts, or when faces load in the head
  reset.css      # Browser normalisation; no classes
  theme.css      # Foundations, themes, semantic tokens
  layout.css     # l_* spatial primitives
  utils.css      # u_* zero-state utilities
  generics.css   # g_* global visual objects
```

Component and page CSS owns exactly one block plus its elements. Never redefine a reset, a token, a
layout primitive or a generic from a component file.

`fonts.css` contains `@font-face` blocks and nothing else – no tokens, no classes, no `@import` of
another stylesheet in the layer. Skip it when faces come from the system, or are already loaded
outside CSS. Conversely, never put `@font-face` in `theme.css`: that file names typefaces through
`--typeface-*`, it does not load them.

## Implementation Workflow

1. Identify the block name from the component or route identity.
2. Create or update the co-located CSS module for that block.
3. Put external geometry in `l_*` wrappers; keep visuals on the block.
4. Name child classes as flat `block_name-element_name`. Never select by ID.
5. Express state and variants with `data-*`.
6. Consume Layer 3 tokens; use `--c-*` only for local APIs and genuine exceptions.
7. Use `fluid()` for responsive interpolation.
8. Keep the unqueried rule as the small canvas; width queries use `min-width` only.
9. Run the project build, then walk the review checklist below.

## Review Checklist

Each line is mechanical. If a check needs an opinion, it is written wrong.

| Check         | Fails when                                                               |
| ------------- | ------------------------------------------------------------------------ |
| Taxonomy      | A class is not a block, element, `l_`, `u_` or `g_`                      |
| Naming        | A hyphen appears inside an element name, or a selector mirrors DOM depth |
| State         | A state or variant is a class instead of an attribute                    |
| Binary Rule   | An `l_*` class shares an element with a block                            |
| Firewall      | A component references a raw colour, a `--palette-*` or a `--theme-*`    |
| Void          | `margin`, `padding` or `gap` uses a raw length                           |
| Mass          | `width`, `height` or `inset` uses a `--space-*` token                    |
| Nesting       | An ampersand builds a name, or nesting goes deeper than one level        |
| IDs           | A `#` selector or `[id=…]` styles a node                                 |
| Queries       | A `@media` or `@container` uses `max-width` or a ceiling range           |
| Motion        | A transition uses a literal duration or easing curve                     |
| Z-index       | A number appears where a stratum token belongs                           |
| Inline styles | The `style` attribute sets anything other than a custom property         |
| Build         | A raw `fluid(` survives into the output                                  |

## References

- Token catalogue, layout API, PostCSS setup: `reference.md`
- Compliant examples and anti-pattern corrections: `examples.md`
- Full specification: https://beamcss.org/spec/
