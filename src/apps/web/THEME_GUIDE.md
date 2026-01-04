# Theme Architecture Guide

## Overview

The web app uses a **three-tier CSS variable system** that makes theme switching trivial while maintaining clean, organized code.

## Architecture

### 1. Base Tokens (`--base-*`)
Raw color values that define the theme palette. **Swap these to change themes.**

```css
/* Status colors */
--base-red-500: #dc2626;
--base-emerald-500: #10b981;

/* Grayscale */
--base-black: #0a0a0a;
--base-white: #fafafa;

/* Alien digital accents */
--base-cyan-500: #06b6d4;
--base-violet-500: #8b5cf6;
```

### 2. Semantic Tokens (`--color-*`, `--bg-*`, `--text-*`)
Purpose-based variables that reference base tokens. **Change what they reference to adjust theme behavior.**

```css
/* These reference base tokens */
--color-low: var(--base-red-500);
--bg-quiet: var(--base-gray-950);
--text-primary: var(--base-white);
```

### 3. Component Tokens
Specialized variables for specific components (badges, cards, etc).

```css
--badge-low-bg: rgba(220, 38, 38, 0.12);
--card-shadow-low: rgba(220, 38, 38, 0.1);
```

## How to Switch Themes

### Option 1: Quick Theme Swap
Override base tokens in a new `:root` selector or media query:

```css
/* Light theme example */
@media (prefers-color-scheme: light) {
  :root {
    --base-black: #ffffff;
    --base-white: #0a0a0a;
    --base-gray-950: #f5f5f5;
    --base-gray-900: #e5e5e5;
    /* ... etc */
  }
}
```

### Option 2: Custom Theme File
Create a new CSS file (e.g., `theme-ocean.css`):

```css
:root {
  /* Ocean theme */
  --base-cyan-500: #0ea5e9;
  --base-violet-500: #3b82f6;
  /* ... override all base tokens */
}
```

Import after `globals.css` in `layout.tsx`.

### Option 3: Data Attribute Themes
Add data attributes for runtime theme switching:

```css
[data-theme="ocean"] {
  --base-cyan-500: #0ea5e9;
  /* ... */
}
```

Then toggle via JavaScript:
```js
document.documentElement.setAttribute('data-theme', 'ocean');
```

## File Structure

```
src/apps/web/
├── app/
│   ├── globals.css          # All CSS variables + global styles
│   ├── page.module.css      # Status page styles
│   └── layout.tsx           # Font imports
├── components/ui/
│   ├── Badge/
│   │   └── Badge.module.css # Badge component styles
│   ├── Button/
│   │   └── Button.module.css # Button component styles
│   └── Card/
│       └── Card.module.css  # Card component styles
└── THEME_GUIDE.md          # This file
```

## Benefits

✅ **No hardcoded colors** - All values use CSS variables
✅ **Single source of truth** - All variables defined in `globals.css`
✅ **Easy theme switching** - Just override base tokens
✅ **Well documented** - Clear comments explain each section
✅ **Component isolation** - Components only reference variables

## Current Theme: Luxury Minimalism + Alien Digital

- **Base**: Deep blacks, refined grays, crisp white
- **Accents**: Cyan, violet, emerald (computational life)
- **Typography**: Cormorant Garamond (display) + JetBrains Mono (body/UI)
- **Effects**: Metallic gradients, iridescent glows, grain texture, mesh animation

## Creating New Themes

1. Copy all `--base-*` variables from `globals.css`
2. Modify the color values
3. Optionally adjust `--gradient-*` and component tokens
4. Test with all component states (Low, InRange, High, etc)

Example new theme tokens:
```css
/* Warm Earth Theme */
--base-red-500: #dc2626;      → #d97706 (amber)
--base-emerald-500: #10b981;  → #65a30d (lime)
--base-cyan-500: #06b6d4;     → #0891b2 (dark cyan)
```

All component styles will automatically adapt!
