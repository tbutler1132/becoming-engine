# Engineering Standards & AI Directives

## 1. Core Philosophy: Iterability & Composability

We value code that is easy to **delete** and **compose** over code that is "clever" or "dry."

- **Write for disposability:** Modular components are easier to replace than monolithic classes.
- **Composition over Inheritance:** Use function composition or dependency injection. Avoid class inheritance hierarchies.
- **Explicit is better than Implicit:** Magic behavior is forbidden.

## 2. TypeScript Rules (Strict)

- **No `any`:** never use `any`. If the type is unknown, use `unknown` and cast safely with guards.
- **Explicit Return Types:** All functions (even void ones) must have explicit return types.
  - _Bad:_ `const add = (a, b) => a + b`
  - _Good:_ `const add = (a: number, b: number): number => a + b`
- **Discriminated Unions:** Use discriminated unions for state management rather than boolean flags.
  - _Bad:_ `{ isLoading: boolean, error: Error | null, data: T | null }`
  - _Good:_ `type State<T> = { status: 'loading' } | { status: 'error', error: Error } | { status: 'success', data: T }`
- **Result Types for Operations:** Operations that can fail return `Result<T>` instead of throwing.
  - `type Result<T> = { ok: true; value: T } | { ok: false; error: string }`
  - This makes errors explicit and composable without try/catch.
- **No "Magic Strings":** Use `enums` or `const` assertions for fixed string values.

## 3. Modularity & Architecture

- **Strict Boundaries:** Code is organized into Modules.
  - Modules should expose a public API via an `index.ts`.
  - Modules should **not** reach into the internals of other modules (e.g., `import { helper } from '../other-module/internal/helper'` is forbidden).
- **Internal Folders:** Implementation details live in `<module>/internal/`. These files are never imported from outside the module.
- **Unidirectional Data Flow:** Data flows down; events/signals flow up. Avoid circular dependencies.
- **Pure Logic Separation:** Separate "Business Logic" from "Side Effects" (I/O, Database, UI).
  - Logic functions should be pure: `(State, Input) => NewState`.
  - This makes logic universally testable without mocking databases.

## 4. Selective Configuration Principle

**Configure boundaries, not mechanisms. Make policy legible, keep machinery simple.**

When deciding what should be configurable, ask: "Could this value legitimately differ between deployments or evolve as the system learns?"

### Should Be Configurable (Policy/Boundaries)

- **Constraints/Thresholds:** Episode limits, variable thresholds, timeouts
- **Paths/Locations:** File paths, data directories, external service endpoints
- **Observability:** Loggers, metrics collectors, debug flags
- **Retry/Timeout Policies:** Network timeouts, retry counts

These are **boundaries** that may vary by context or evolve with learning.

### Should NOT Be Configurable (Mechanism/Ontology)

- **Core Ontology:** What a `Variable`/`Episode`/`Action` is (these define reality)
- **Pure Logic:** How filtering/validation works (these are algorithms)
- **Data Structures:** The shape of `State` (these are contracts)
- **Algorithm Choices:** How episodes are opened/closed (these are mechanisms)

These are **implementation details**. Making them configurable adds complexity without clear benefit.

**Principle:** Keep the system "quiet" (minimal configuration) while allowing boundaries to be explicit and revisable.

## 5. Coding Style & Cleanliness

- **Small Functions:** Functions should ideally fit on a single screen. If a function does "x AND y", split it.
- **Naming Conventions:**
  - **Verbs for Functions:** `calculateTotal`, `fetchUser`.
  - **Nouns for Types/Interfaces:** `UserProfile`, `Transaction`.
  - **Boolean prefixes:** `isActive`, `hasPermission`.
- **Guard Clauses:** Return early. Avoid deep `else` nesting.
  - _Bad:_ `if (x) { if (y) { ... } }`
  - _Good:_ `if (!x) return; if (!y) return; ...`

## 6. Testing & Iteration

- **Test Behavior, Not Implementation:** Tests should describe _what_ the module does, not _how_.
- **Dependency Injection:** If a class relies on an external service (like a database), inject the interface, not the concrete class. This allows easy mocking and swapping.

## 7. AI Agent Behavior Protocol

When generating code, follow this loop:

1.  **Define Types First:** Write the `interface` or `type` definitions before writing logic.
2.  **Check Constraints:** Ensure the code respects module boundaries defined in the file structure.
3.  **Self-Correction:** If you write a function longer than 20 lines, pause and ask if it should be refactored into smaller helpers.
4.  **Documentation:** Add JSDoc comments to exported functions explaining _Why_ (intent) and _Contract_ (params/returns), not implementation details.
