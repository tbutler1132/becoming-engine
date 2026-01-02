# UI & React Standards

> Conventions for `src/apps/web/` — extends `docs/standards.md` for React/Next.js.

---

## 1. Component Organization

### File Structure

```
app/
  page.tsx              # Route pages (Server Components by default)
  actions.ts            # Server Actions for this route
  layout.tsx            # Layouts
  error.tsx             # Error boundary

components/
  VariableCard/
    VariableCard.tsx    # Component
    VariableCard.module.css  # Styles (colocated)
    index.ts            # Re-export
  ui/                   # Generic UI primitives (Button, Card, etc.)
```

### Naming

- **Components**: PascalCase (`VariableCard.tsx`)
- **Utilities/hooks**: camelCase (`useStatus.ts`)
- **CSS Modules**: `ComponentName.module.css`
- **Server Actions**: camelCase verbs (`completeAction`, `createNote`)

---

## 2. Server vs Client Components

```tsx
// Default: Server Components (no directive needed)
// - Fetch data directly
// - No useState, useEffect, onClick

// Client Components: only when you need interactivity
"use client";
// - useState, useEffect, event handlers
// - Keep these small and leaf-level
```

**Rule**: Start with Server Components. Only add `'use client'` when you need browser APIs or interactivity.

---

## 3. Props & Types

```tsx
// Props interface in same file, above component
interface VariableCardProps {
  id: string;
  name: string;
  status: VariableStatus;
  onComplete?: () => void;
}

// Explicit return types
export function VariableCard({
  id,
  name,
  status,
}: VariableCardProps): JSX.Element {
  // ...
}
```

**No `any`** — same as backend. Use proper types imported from `@libs/memory` or `@libs/regulator`.

---

## 4. Data Flow

```tsx
// Server Component fetches data
async function StatusPage(): Promise<JSX.Element> {
  const data = await getStatus();
  return <VariableList variables={data.variables} />;
}

// Props flow down, actions flow up
<ActionItem action={action} onComplete={completeAction} />;
```

**No client-side fetching** for initial data — Server Components handle it.

---

## 5. Server Actions

```tsx
// app/actions.ts
"use server";

import { JsonStore } from "@libs/memory";
import { Regulator } from "@libs/regulator";
import { revalidatePath } from "next/cache";

export async function completeAction(actionId: string): Promise<void> {
  const store = new JsonStore();
  const regulator = new Regulator();

  const state = await store.load();
  const result = regulator.completeAction(state, { actionId });

  if (!result.ok) {
    throw new Error(result.error);
  }

  await store.save(result.value);
  revalidatePath("/");
}
```

**Pattern**: Load → Mutate → Save → Revalidate

---

## 6. Styling (CSS Modules)

```css
/* VariableCard.module.css */

.card {
}
.card[data-status="Low"] {
}
.card[data-status="InRange"] {
}
.card[data-status="High"] {
}
```

```tsx
// Component
import styles from './VariableCard.module.css';

<div className={styles.card} data-status={status}>
```

### CSS Variables for theming

```css
:root {
  --color-low: #dc2626;
  --color-in-range: #16a34a;
  --color-high: #d97706;

  --font-display: "Your Mythic Font", serif;
  --font-body: system-ui, sans-serif;
}
```

**No inline styles** except for truly dynamic values.

---

## 7. Small Components

Same as backend: **if a component does "X and Y", split it**.

```tsx
// Bad: 200 lines mixing data, layout, and interactions
function StatusPage() {
  // ...
}

// Good: composed from focused components
function StatusPage(): JSX.Element {
  return (
    <main>
      <VariableSection variables={variables} />
      <EpisodeSection episodes={episodes} actions={actions} />
    </main>
  );
}
```

**Guideline**: If JSX exceeds ~50 lines, consider splitting.

---

## 8. Import Order

```tsx
// 1. React/Next
import { Suspense } from "react";
import Link from "next/link";

// 2. External libs (if any)

// 3. Internal libs (@libs/*)
import { getStatusData } from "@libs/regulator";
import type { Variable } from "@libs/memory";

// 4. Local components
import { VariableCard } from "@/components/VariableCard";

// 5. Styles
import styles from "./page.module.css";
```

---

## 9. Error Handling

```tsx
// Server Actions throw on error (caught by error boundary)
if (!result.ok) {
  throw new Error(result.error);
}
```

```tsx
// app/error.tsx — error boundary for the route
"use client";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): JSX.Element {
  return (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## 10. Anti-patterns to Avoid

| ❌ Avoid                                 | ✅ Instead                                |
| ---------------------------------------- | ----------------------------------------- |
| `useEffect` for data fetching            | Server Components fetch directly          |
| `useState` for server data               | Props from Server Components              |
| Prop drilling > 2 levels                 | Extract smaller components or use context |
| Giant components (>50 lines JSX)         | Split into focused sub-components         |
| Mixing styling approaches                | Pick CSS Modules, stick with it           |
| `any` types                              | Import proper types from libs             |
| Inline event handlers with complex logic | Extract to named functions                |

---

## 11. Accessibility Basics

- Semantic HTML (`<button>` not `<div onClick>`)
- Meaningful `aria-label` for icon-only buttons
- Color is not the only indicator (add text/icons for status)
- Keyboard navigation works (`tabIndex`, focus states)

---

## 12. File Checklist (new component)

When creating a new component:

1. [ ] Create folder: `components/ComponentName/`
2. [ ] Create component file: `ComponentName.tsx`
3. [ ] Create styles: `ComponentName.module.css`
4. [ ] Create barrel export: `index.ts`
5. [ ] Props interface with explicit types
6. [ ] Explicit return type on function
7. [ ] No `any`, no inline styles
