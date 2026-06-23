# The BEAM Manifesto (v2026)

BEAM is a strict, opinionated, and browser-native CSS architecture designed for the modern era. It rejects the complexity of CSS-in-JS and the clutter of Atomic CSS in favor of distinct Component Identity, Editor Optimization (Cmd+D), and Semantic State.

It stands for **Block, Element, Attribute, Module.**

### 1. Core Philosophy

- **Identity over Utility:** A component is named by what it is (`.user_card`), not what it looks like (`.bg-white.rounded.p-4`).
- **Editor Optimized:** Naming conventions are specifically engineered to leverage Multi-Cursor selection (Cmd+D / Ctrl+D) in modern IDEs.
- **Browser Native:** We use CSS Variables and Native Nesting. No heavy preprocessors (SASS/LESS) required.
- **State Driven:** We do not use classes for state (e.g., `--active`). We use standard HTML Data Attributes.

### 2. The Prefix Taxonomy & Syntax

BEAM uses specific casing and prefixes to visually separate logical entities. This creates a Zero-Guesswork Namespace.

**The Tetrad (4 Valid Class Types)**

- **snake_case (Block):** Component Identity. E.g., `.user_card`.
- **l\_ (Layout):** Spatial geometry and rhythm. E.g., `.l_stack`.
- **u\_ (Utility):** Zero-State Contracts & layout-agnostic atomic behaviors. E.g., `.u_reset_button`.
- **g\_ (Generic):** Global UI assets. E.g., `.g_divider`.

**B.E.A.M. Rules**

- **B — Block (snake_case):** The root component. It defines the namespace. Must use snake_case.
- **E — Element (-snake_case):** A dependent child of the Block.
  - Rule: Connected to the Block by a single hyphen (`-`).
  - Rule: Words inside the element MUST be separated by an underscore (`_`). Hyphens are explicitly forbidden inside the element name.
  - Rule: Always Flat. Never mirror HTML nesting in class names.
  - `/* ✅ Correct */ .nav_bar-list_item { ... }`
  - `/* ❌ Incorrect */ .nav_bar-list-item { ... }`
- **A — Attribute ([data-state]):** Represents State or Variation. Replaces BEM Modifiers. Use standard HTML `data-` attributes.
- **M — Module (File Structure):** One Block = One File. The CSS file must be co-located with the Component logic.

### 3. The Variable Radar System

CSS Variables are organized hierarchically. Their prefix tells you exactly where they live and what data type they hold. Numbered tiers are banned; variables are categorized by their functional responsibility.

- `--palette-[name]` / `--typeface-[name]`: **Foundations.** The Raw Assets. (`theme.css`).
- `--theme-[context]-[name]`: **Themes.** The Contextual Switchboard. (`theme.css`).
- `--bg-`, `--ink-`, `--border-`, `--shadow-`, `--space-`, `--size-`, `--text-`, `--font-`: **Semantics.** The Public Contract. (`theme.css`).
- `--c-[name]`: **Components.** Local Scope. Props or private variables. (Local `.css` or `.tsx`).
- `--js-[name]`: **Dynamic Globals.** Injected by JavaScript at runtime.

### The Color Taxonomy (The BEAM Firewall)

You must never use arbitrary colors in Core UI. Colors must pass through the **4-Layer Taxonomy**. Semantic tokens must never point horizontally to other semantic tokens; they must strictly utilize the Double-Mapped Theme Engine.

**1. Foundations (The Raw Materials)**
Raw hex/oklch codes. Never use these directly in UI components.

```css
:root {
  --palette-stone-900: oklch(...);
  --palette-green-500: oklch(...);
}
```

**2. Themes (The Contextual Switchboard)**
This defines what "Light" or "Dark" actually means physically. Components MUST NEVER touch these. They exist solely to be routed.

```css
:root {
  --theme-light-bg-surface: var(--palette-white);
  --theme-dark-bg-surface: var(--palette-stone-900);
}
```

**3. Semantics (The Public Contract)**
The global interface and routing engine. This is the ONLY layer components are allowed to consume. This layer powers the **Contextual Inverse Engine**, allowing DOM nodes like `[data-theme="inverse"]` to seamlessly flip the Semantic pointer to the opposite Theme switchboard without altering component CSS.

- **A. The Kernel (Strictly 16 Variables):** The minimalist baseline.
  - Canvas: `--bg-page`, `--bg-surface`, `--bg-surface-hover`, `--bg-overlay`
  - Ink: `--ink-main`, `--ink-muted`, `--ink-faint`, `--ink-inverse`
  - Chrome: `--border-base`, `--border-focus`
  - Interactive: `--action-primary`, `--action-primary-hover`, `--action-neutral`, `--action-neutral-hover`, `--action-danger`, `--action-danger-hover`
- **B. The Extensions (Maximalist-Friendly):** Bespoke interactive colors required by the design system (e.g., `--action-contrast`). MUST include a hover state pair.
- **C. Intents & Categories (Static UI):** Repeating static colors for status (`--intent-success-subtle`) or data visualization. Strictly limited to base, subtle, and strong.

**4. Components (Local Scope & API)**
Exceptions are handled locally using the `--c-` prefix.

```css
.holiday_promo {
  --c-magic-bg: #8a2be2; /* Quarantined locally. Never leaks to theme.css */
  background: var(--c-magic-bg);
}
```

### Z-Index & Motion Physics

**Z-Index Strata (The 6 Layers)**
NEVER use random z-index numbers. Use the predefined Z-Index Strata. If you need to stack within a stratum, use `calc()` delta math.
`--z-sink` (-1), `--z-pinned` (100), `--z-dropdown` (200), `--z-overlay` (300), `--z-toast` (400), `--z-max` (9999).
_Example:_ `z-index: calc(var(--z-pinned) + 1);`

**Motion Tokens**

- Transitions: MUST use `var(--duration-*)` and `var(--ease-*)`.
- Animations: CAN use magic numbers (`1.2s`, `linear`) for bespoke choreographies.
- Composable Physics: Export transition chunks for safe utility composition: `--transition-pressable: transform var(--duration-fast) var(--ease-standard);`

### 4. Spacing & Layout Strategy

BEAM enforces a strict separation between Internal Layout (Component) and External Layout (Glue).

**The Mass vs Void**

- **Negative space (Void):** `margin`, `padding`, and `gap` MUST use numeric `--space-` tokens. We use the strict 4px grid (where 4 = 1rem).
- **Positive space (Mass):** `width`, `height`, `top`, `left`, `transform` CANNOT use `--space-` tokens. Use raw `rem` or `px` values if the component has a bespoke physical shape

**The Global Layout Primitives (layout.css)**
Do not use flex/grid utility classes. Compose via external spacing attributes.

- **Stack:** `.l_stack` (Vertical flexbox). E.g., `.l_stack[data-gap="4"]`
- **Cluster:** `.l_cluster` (Horizontal wrapping flexbox).
- **Grid:** `.l_grid` (Strict 2D grid).
- **Container:** `.l_container` (Macro-page geometry and max-width bounds).
-  **Switcher:** `.l_switcher` (Container-query driven flexbox). Switches from column to row based on parent width thresholds synced to Tailwind's scale (@xs to @3xl). E.g., `.l_switcher[data-threshold="md"].`

**The Binary Rule ⚠️**
A generic Layout Class (`l_`) and a Component Class (`snake_case`) MUST NEVER exist on the same DOM element.

- ❌ Illegal: `<div class="l_stack user_card">` (Creates Specificity Wars).
- ✅ Legal (Wrapper): `<div class="l_stack"><div class="user_card">...</div></div>`
- ✅ Legal (Coordinate Exception): A Component Block may apply `position: relative` to a direct child `.l_container` to establish a Z-axis anchor, provided it does not alter the container's display model.

### 5. PostCSS & Native Nesting Rules

BEAM relies on Native CSS Nesting processed via PostCSS. Preprocessors (SASS/LESS) are banned.

**Point-to-Point Fluid Math**
Use the custom PostCSS `fluid()` function to interpolate between any two static numeric tokens.
`.user_card { padding: fluid(var(--space-4), var(--space-8)); }`

**The Ampersand Ban**
You MUST NEVER use the ampersand (`&`) to concatenate class names. It breaks Cmd+D text search.

- ❌ Illegal: `&-title { ... }`
- ✅ Legal: `.user_card-title { ... }`

**Allowed Nesting (Max 1 Level Deep)**

- State: `&[data-state="loading"] { ... }`
- Pseudo: `&:hover { ... }`
- Queries: `@container (min-width: 30rem) { ... }` (Nested inside the selector).

### 6. JavaScript Integration

BEAM treats Component CSS Variables (`--c-`) as a type-safe Component API. Pass style props as variables, not raw inline styles.

```tsx
interface Props {
  themeColor?: string
}

export const UserProfile = (props: Props) => {
  return (
    <article class="user_profile" style={{ '--c-card-bg': props.themeColor } as React.CSSProperties}>
      ...
    </article>
  )
}
```

### 7. The Global Stylesheet Setup

To implement BEAM, your global style folder must look exactly like this. DO NOT duplicate these functionalities in component CSS.

```text
/src/styles
  ├── reset.css        # Browser normalization (No classes)
  ├── theme.css        # Foundations, Themes, & Semantics (Colors, Grid, Typography)
  ├── layout.css       # .l_ classes (Spatial Geometry)
  ├── utils.css        # .u_ classes (Zero-state contracts, behaviors)
  ├── generics.css     # .g_ classes (Global visual UI assets)
  └── fonts.css        # @font-face declarations (Optional)
```

- **Utilities (`utils.css`):** Use `:where()` for The Zero State Contract to strip UA styles without specificity wars. `:where(.u_reset_button) { ... }`
- **Generics (`generics.css`):** Global blocks that are too simple to be components. (e.g., `.g_divider`, `.g_spinner`, `.g_prose`).

---

### References (Docs Sitemap)

- Component Identity
- Editor Optimization
- Semantic State
- Zero-Guesswork Namespace
- The Prefix Taxonomy
- The Variable Radar System
- **The 4-Layer Taxonomy**
- **The Contextual Inverse Engine**
- The BEAM Firewall
- Core UI Chrome (The 16 Variables)
- BEAM Extensions Protocol
- Z-Index Strata
- Motion Tokens & Physics
- Law of Rhythm vs Law of Object
- The Binary Rule
- Fluid Point-to-Point Interpolation
- The Zero State Contract
- Generics (UI Assets)


