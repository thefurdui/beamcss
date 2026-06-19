# BEAM Examples

Use these as patterns for generated code. Preserve the class taxonomy, Binary Rule, token layers, and `data-*` state model.

## React Component

**PromoCard.tsx**

```tsx
import './PromoCard.css'

interface PromoCardProps {
  title: string
  description: string
  accentColor?: string
  featured?: boolean
}

export function PromoCard({ title, description, accentColor, featured = false }: PromoCardProps) {
  return (
    <article
      className="promo_card"
      data-featured={featured ? 'true' : undefined}
      style={{ '--c-accent': accentColor } as React.CSSProperties}
    >
      <div className="l_stack" data-gap="4">
        <h2 className="promo_card-title">{title}</h2>
        <p className="promo_card-body">{description}</p>
        <button className="u_reset_button promo_card-action_button u_pressable" type="button">
          Read more
        </button>
      </div>
    </article>
  )
}
```

**PromoCard.css**

```css
.promo_card {
  padding: fluid(var(--space-4), var(--space-8));
  background: var(--bg-surface);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-close);
}

.promo_card[data-featured='true'] {
  border-color: var(--c-accent, var(--border-focus));
  box-shadow: var(--shadow-base);
}

.promo_card-title {
  color: var(--ink-main);
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
}

.promo_card-body {
  color: var(--ink-muted);
  font-size: var(--text-base);
  line-height: var(--leading-base);
}

.promo_card-action_button {
  height: 2.5rem;
  padding-inline: var(--space-4);
  color: var(--ink-inverse);
  background: var(--c-accent, var(--action-primary));
  border-radius: var(--radius-md);
  transition:
    background var(--duration-fast) var(--ease-standard),
    var(--transition-pressable);
}

.promo_card-action_button:hover {
  background: var(--action-primary-hover);
}
```

## Astro Component

**FeatureCard.astro**

```astro
---
import './FeatureCard.css'

interface Props {
  title: string
  body: string
  highlighted?: boolean
}

const { title, body, highlighted = false } = Astro.props
---

<article class="feature_card" data-highlighted={highlighted ? 'true' : undefined}>
  <div class="l_stack" data-gap="3">
    <h3 class="feature_card-title">{title}</h3>
    <p class="feature_card-body">{body}</p>
  </div>
</article>
```

**FeatureCard.css**

```css
.feature_card {
  padding: var(--space-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
}

.feature_card[data-highlighted='true'] {
  background: var(--intent-success-subtle);
  border-color: var(--intent-success-base);
}

.feature_card-title {
  color: var(--ink-main);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
}

.feature_card-body {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-base);
}
```

## Astro Route Page

Use a semantic block for generic route filenames like `index.astro`.

**index.astro**

```astro
---
import './index.css'
---

<article class="home_page">
  <div class="l_container" data-size="prose">
    <div class="l_stack" data-gap="12">
      <section class="home_page-hero">
        <div class="l_stack" data-gap="3">
          <h1 class="home_page-title">Andrei Furdui</h1>
          <p class="home_page-summary">I ship products fast.</p>
        </div>
      </section>
    </div>
  </div>
</article>
```

**index.css**

```css
.home_page {
  min-height: 100dvh;
  padding-block: var(--space-12);
  background: var(--bg-page);
  color: var(--ink-main);
}

.home_page-hero {
  padding-block: fluid(var(--space-8), var(--space-20));
}

.home_page-title {
  color: var(--ink-main);
  font-family: var(--font-heading);
  font-size: fluid(var(--text-4xl), var(--text-9xl));
  font-weight: var(--weight-black);
  line-height: var(--leading-none);
}

.home_page-summary {
  color: var(--ink-muted);
  font-size: var(--text-lg);
}
```

## Layout Composition

```html
<div class="l_container" data-size="prose">
  <div class="l_stack" data-gap="8">
    <header class="site_header">
      <div class="l_cluster" data-gap="4" data-justify="between">
        <a class="site_header-logo" href="/">ACME</a>
        <nav class="site_header-nav">...</nav>
      </div>
    </header>

    <article class="hero_card">
      <div class="l_switcher" data-threshold="md" data-gap="6">
        <div class="hero_card-copy">...</div>
        <aside class="hero_card-aside">...</aside>
      </div>
    </article>
  </div>
</div>
```

## Toolbar Pattern

```html
<div class="toolbar">
  <div class="l_cluster" data-gap="2" data-justify="between">
    <h2 class="toolbar-title">Dashboard</h2>
    <div class="l_cluster" data-gap="2">
      <button class="u_reset_button toolbar-action_button u_pressable">Save</button>
      <button class="u_reset_button toolbar-action_button u_pressable">Export</button>
    </div>
  </div>
</div>
```

```css
.toolbar {
  padding: var(--space-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
}

.toolbar-title {
  color: var(--ink-main);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
}

.toolbar-action_button {
  height: 2.5rem;
  padding-inline: var(--space-3);
  color: var(--ink-inverse);
  background: var(--action-primary);
  border-radius: var(--radius-md);
  transition:
    background var(--duration-fast) var(--ease-standard),
    var(--transition-pressable);
}

.toolbar-action_button:hover {
  background: var(--action-primary-hover);
}
```

## Inverse Theme Subtree

```html
<section class="cta_section" data-theme="inverse">
  <div class="l_container" data-size="prose">
    <div class="l_stack" data-gap="4">
      <h2 class="cta_section-heading">Contextual inverse</h2>
      <p class="cta_section-copy">The same semantic tokens flip automatically.</p>
    </div>
  </div>
</section>
```

```css
.cta_section {
  padding-block: var(--space-16);
  background: var(--bg-page);
  color: var(--ink-main);
}

.cta_section-heading {
  font-size: var(--text-4xl);
  line-height: var(--leading-tight);
}

.cta_section-copy {
  color: var(--ink-muted);
}
```

## Z-Index Stacking

```css
.modal_overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--bg-scrim);
}

.modal_dialog {
  position: relative;
  z-index: calc(var(--z-overlay) + 1);
}

.modal_close_button {
  position: absolute;
  z-index: calc(var(--z-overlay) + 2);
}
```

## Anti-Patterns and Corrections

### Tailwind Soup

```html
<!-- Wrong -->
<div class="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md">
```

```html
<!-- Correct -->
<article class="promo_card">
  <div class="l_stack" data-gap="4">...</div>
</article>
```

### Ampersand Concatenation

```css
/* Wrong */
.user_card {
  &-title {
    color: red;
  }
}
```

```css
/* Correct */
.user_card-title {
  color: var(--ink-main);
}
```

### DOM-Mirrored Nesting

```css
/* Wrong */
.user_card {
  .user_card-header {
    .user_card-title {}
  }
}
```

```css
/* Correct */
.user_card-header {}
.user_card-title {}
```

### State Classes

```html
<!-- Wrong -->
<button class="nav_button is-active">
```

```html
<!-- Correct -->
<button class="nav_button" data-state="active">
```

### Binary Rule Violation

```html
<!-- Wrong -->
<article class="l_stack promo_card">
```

```html
<!-- Correct -->
<article class="promo_card">
  <div class="l_stack" data-gap="4">...</div>
</article>
```

### Wrong Color Layer

```css
/* Wrong */
.promo_card {
  background: var(--palette-white);
  color: var(--theme-light-ink-main);
}
```

```css
/* Correct */
.promo_card {
  background: var(--bg-surface);
  color: var(--ink-main);
}
```

### Space Token on Mass

```css
/* Wrong */
.avatar {
  width: var(--space-12);
  height: var(--space-12);
}
```

```css
/* Correct */
.avatar {
  width: 3rem;
  height: 3rem;
}
```

### Inline Visual Styles

```tsx
// Wrong
<div style={{ padding: '16px', backgroundColor: '#fff' }} />
```

```tsx
// Correct
<article className="promo_card" style={{ '--c-accent': accentColor } as React.CSSProperties} />
```
