# BEAM Manifesto

_Created on 2026-02-18_

**BEAM** is a strict, opinionated, and browser-native CSS architecture designed for the modern era. It rejects the complexity of CSS-in-JS and the clutter of Atomic CSS in favor of distinct Component Identity, Editor Optimization (`Cmd+D`), and Semantic State.

It stands for **Block**, **Element**, **Attribute**, **Module**.

---

## 1. Core Philosophy

1.  **Identity over Utility:** A component is named by _what it is_ (`.user_card`), not _what it looks like_ (`.bg-white.rounded.p-4`).
2.  **Editor Optimized:** Naming conventions are specifically engineered to leverage Multi-Cursor selection (`Cmd+D` / `Ctrl+D`) in modern IDEs.
3.  **Browser Native:** We use CSS Variables, Nesting, and `clamp()` calculations. No complex build steps required.
4.  **State Driven:** We do not use classes for state (e.g., `--active`). We use Data Attributes.

---

## 2. The Syntax (B.E.A.M.)

BEAM uses specific casing to visually separate logical entities.

### B — Block (`snake_case`)

The root component. It defines the "namespace."

- **Rule:** Must use `snake_case`.
- **Why:** Editors treat snake_case as a single word. Double-clicking selects the whole component name.

```css
.nav_bar {
  ...;
}
.submit_button {
  ...;
}
```

### E — Element (`kebab-case`)

A dependent child of the Block.

- **Rule:** Connected by a **single hyphen** (`-`).
- **Rule:** **Always Flat.** Never mirror HTML nesting in class names.
- **Why:** Double-clicking selects only the element name (e.g., `title`), making refactoring instant.

```css
/* ✅ Correct: Flat */
.nav_bar-page_link { ... }

/* ❌ Incorrect: Nested */
.nav_bar-list-list_item-page_link { ... }
```

### A — Attribute (`[data-state]`)

Represents State or Variation. Replaces BEM Modifiers.

- **Rule:** Use standard HTML `data-` attributes.
- **Why:** High visibility in DOM inspection and clear separation of "Identity" (Class) vs "State" (Attribute).

```css
/* Styling the active state */
.nav_bar-link[data-active='true'] {
  color: var(--color-primary);
}

/* Styling a variant */
.submit_button[data-variant='danger'] {
  ...;
}
```

### M — Module (File Structure)

One Block = One File.

- **Rule:** The CSS file must be co-located with the Component logic.
- **Rule:** The Block name must match the filename.

```text
/components
  /UserProfile
    ├── index.ts          # Exports
    ├── UserProfile.tsx   # Markup & Logic
    └── UserProfile.css   # Contains .user_profile
```

---

## 3. System Architecture

BEAM requires a standardized "Physics" layer to ensure consistency across designers and developers.

### Units

| Unit    | Use Case                      | Reasoning                                              |
| :------ | :---------------------------- | :----------------------------------------------------- |
| **rem** | Layout, Text, Padding, Margin | Respects user browser settings and accessibility zoom. |
| **px**  | Borders, Shadows, Blur        | Physical reality. Needs to be crisp, not scaled.       |
| **em**  | Component Composition         | Scaling internals (e.g., icon size relative to text).  |

### Responsiveness (Fluid Mobile-First)

We do not use breakpoints for font sizes or standard margins. We use **Fluid Math**.

- **Rule:** Use global fluid variables (`--space-4`, `--text-lg`) that automatically scale using `clamp()`.
- **Media Queries:** Reserved strictly for **Layout Changes** (e.g., changing Flex direction from column to row).

### The Variable Tiers

Variables are organized in `theme.css`.

1.  **Tier 1: Primitives (The Palette)**
    - Raw values. _Never used directly in components._
    - `--primitive-slate-900: #0f172a;`
2.  **Tier 2: Semantic Tokens (The Contract)**
    - Named after function. **Dark Mode is handled here.**
    - `--bg-surface: var(--primitive-slate-50);`
    - `--text-body: var(--primitive-slate-900);`
3.  **Tier 3: Local Variables (The Component API)**
    - Defined inside the component using the **Input/Default Pattern**.
    - See Section 5.

---

## 4. Layout Strategy

BEAM enforces a strict separation between **Internal Layout** (Component) and **External Layout** (Glue).

### The Global Layout Primitives (`layout.css`)

Do not use `flex/grid` classes in HTML. Use these 3 primitives for composition.

**1. The Stack (`.l_stack`)**
Vertical arrangement.

```css
.l_stack {
  display: flex;
  flex-direction: column;
}
.l_stack[data-gap='4'] {
  gap: var(--space-4);
}
```

**2. The Cluster (`.l_cluster`)**
Horizontal arrangement (wrapping).

```css
.l_cluster {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.l_cluster[data-align='center'] {
  align-items: center;
}
```

**3. The Grid (`.l_grid`)**
Strict 2D layout.

```css
.l_grid {
  display: grid;
}
.l_grid[data-cols='2'] {
  grid-template-columns: repeat(2, 1fr);
}
```

### The Binary Rule ⚠️

**A generic Layout Class (`l_`) and a Block Class (`snake_case`) must NEVER exist on the same DOM element.**

- **❌ Illegal:** `<div class="l_stack user_profile">`
- **✅ Legal (Wrapper):**
  ```html
  <div class="l_stack">
    <div class="user_profile">...</div>
  </div>
  ```
- **✅ Legal (Intrinsic):** If the User Profile _is_ naturally a stack, write `display: flex; flex-direction: column;` inside `.user_profile` CSS.

---

## 5. JavaScript Integration

BEAM treats CSS Variables as the Component API.

### The Input/Default Pattern

Inside your component CSS, define properties to accept inputs from JS, falling back to global tokens if undefined.

```css
/* UserProfile.css */
.user_profile {
  /* Syntax: var(--js-prop-name, var(--global-fallback)) */
  background: var(--card-bg, var(--bg-surface));
  padding: var(--card-padding, var(--space-4));
}
```

### Passing Values (React/Solid/Vue)

Pass style props as variables, not raw styles.

```tsx
// Type-safe interface
interface Props {
  themeColor?: string
}

export const UserProfile = (props: Props) => {
  return (
    <article
      class="user_profile"
      style={{ '--card-bg': props.themeColor }} // Passing data, not CSS
    >
      ...
    </article>
  )
}
```

---

## 6. Global Primitives & Icons

### UI Primitives (`primitives.css`)

Global blocks that are too simple to be components.

- **.divider**: Horizontal lines.
- **.spinner**: Loading states.
- **.screen_reader_only**: Accessibility helpers.

### Icons

**Do not use font classes.**
Use **Unplugin Icons** (or equivalent) to import SVG icons as Components.

```tsx
import IconCheck from '~icons/lucide/check'
;<div class="submit_button-icon_box">
  <IconCheck />
</div>
```

---

## 7. Setup & Files

To implement BEAM, your global style folder should look like this:

```text
/src/styles
  ├── reset.css        # Browser normalization
  ├── theme.css        # Tier 1 & Tier 2 Variables (Colors, Typography)
  ├── layout.css       # l_stack, l_cluster, l_grid, l_spacer
  └── primitives.css   # .divider, .container, etc.
```

### Quick Reference Rules

1.  **Block:** `snake_case`. One per file.
2.  **Element:** `kebab-case`. Flat nesting only.
3.  **State:** Use `data-attribute`.
4.  **Layout:** Use `l_` primitives for external spacing.
5.  **Colors:** Never use Hex codes in components. Use Semantic Variables (`var(--text-body)`).
6.  **Overrides:** Never use `!important`. Pass a variable via JS instead.

---

**This is BEAM.**
Structured. Scalable. Native.
