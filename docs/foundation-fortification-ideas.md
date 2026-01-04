# Foundation Fortification Ideas

> Ideas for additional tooling and practices to strengthen the codebase before feature work begins.
> Generated: 2025-01-03

---

## Current State (Already Excellent)

- ✅ TypeScript ultra-strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- ✅ Property-based testing with fast-check
- ✅ DNA tripwire tests (mutation safety)
- ✅ Module boundary enforcement via ESLint
- ✅ Result types (no thrown exceptions)
- ✅ Runtime validation for all state data (1,400+ lines of guards)
- ✅ Schema migrations with explicit versioning
- ✅ ADRs for decision tracking
- ✅ 80% coverage thresholds
- ✅ Husky + lint-staged
- ✅ CI on GitHub Actions

---

## Recommended Additions

### Tier 1: Quick Wins (15 min each)

#### 1. Pre-Push Hook with Full Check

Pre-commit only runs lint-staged. Add a pre-push hook that runs the full `npm run check`:

```bash
# .husky/pre-push
npm run check
```

Catches the "committed junk, pushed disaster" scenario.

#### 2. Security Auditing in CI

Add `npm audit` to the CI pipeline:

```yaml
# In ci.yml
- run: npm audit --audit-level=high
```

Catches known vulnerabilities before they hit production.

#### 3. Conventional Commits + Changelog Automation

Enforce conventional commits for automatic changelogs and version bumps:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

```js
// commitlint.config.js
export default { extends: ["@commitlint/config-conventional"] };
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit "$1"
```

Later, add `semantic-release` or `standard-version` for automated releases.

---

### Tier 2: Medium Effort (30 min each)

#### 4. Dead Code Detection

Use **knip** (successor to ts-prune) to find unused exports, dependencies, and dead code:

```bash
npm install --save-dev knip
npx knip
```

Add to `check` script periodically. Great for keeping the codebase lean.

#### 5. Circular Dependency Detection

Use **madge** to catch circular imports:

```bash
npm install --save-dev madge
npx madge --circular --extensions ts src/
```

Add to CI or as a separate npm script.

#### 6. Type Coverage Tracking

Track actual type coverage over time:

```bash
npm install --save-dev typescript-coverage-report
npx typescript-coverage-report
```

Shows where `unknown` or loose types are creeping in.

#### 7. CODEOWNERS for Critical Paths

Protect DNA and core organs with required reviews:

```
# .github/CODEOWNERS
/src/dna.ts @your-username
/src/dna.test.ts @your-username
/src/libs/memory/ @your-username
/src/libs/regulator/ @your-username
```

Combine with branch protection rules (require review + CI pass before merge).

#### 8. Spell Check for Docs/Comments

Use **cspell** to catch typos:

```bash
npm install --save-dev cspell
npx cspell "**/*.ts" "**/*.md"
```

Add project-specific words to `cspell.json`.

---

### Tier 3: Higher Effort (1+ hours)

#### 9. API Surface Locking

Use **api-extractor** to generate an API report that fails if public APIs change unexpectedly:

```bash
npm install --save-dev @microsoft/api-extractor
```

Creates a `.api.md` file that must be committed when APIs change — making breaking changes explicit.

#### 10. Mutation Testing

Use **Stryker** to test the tests — it mutates code and checks if tests catch the mutations:

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/typescript-checker @stryker-mutator/vitest-runner
```

"Paranoia mode" of testing. If a mutant survives, tests have blind spots.

#### 11. JSON Schema for State Files

Generate a JSON Schema from TypeScript types for external validation:

```bash
npm install --save-dev typescript-json-schema
npx typescript-json-schema tsconfig.json State --out data/state.schema.json
```

Useful if external tools ever touch state files.

#### 12. Smoke Tests / Integration Tests

Add integration tests that exercise the full CLI flow:

```typescript
// src/apps/cli/cli.integration.test.ts
import { execSync } from "child_process";

describe("CLI Smoke Tests", () => {
  it("status command runs without error", () => {
    const output = execSync("BECOMING_ENV=dev npm run becoming:status:test", {
      encoding: "utf8",
    });
    expect(output).not.toContain("Error");
  });
});
```

Catches integration failures that unit tests miss.

---

## Doctrine-Aligned Additions

Given the emphasis on "viability" and "quiet baseline":

- **Backup script** for `data/` directory before risky operations
- **State snapshots** — automatically save state before each mutation for rollback
- **Health check command** — `npm run health` that validates state files, runs tests, and reports coverage in one view

---

## Priority Recommendation

For maximum impact with minimum effort, implement in this order:

1. Pre-push hook with `npm run check`
2. `npm audit` in CI
3. Conventional commits via commitlint
4. Dead code detection with knip
5. CODEOWNERS + branch protection

These five give 80% of the safety benefit for 20% of the effort.
