# Plugin Developer Experience Specification

This document specifies the developer experience for creating plugins in the Becoming Engine.

## Goals

1. **Fast onboarding**: New developers can create their first plugin in < 10 minutes
2. **Type safety**: Full TypeScript support with autocomplete
3. **Fast feedback**: See changes immediately, catch errors early
4. **Quality gates**: Validation prevents broken plugins
5. **Clear examples**: Learn from working plugins

## Phase 1: Foundation (Essential)

### 1. Plugin Scaffolding CLI

**Command**: `npm run plugin:create --name <name> --type <type>`

**Types**: `sensorium`, `procedural-model`, `world-model`

**Generated Structure**:

```
plugins/<name>/
  ├── plugin.json          # Manifest
  ├── index.ts              # Plugin implementation
  ├── index.test.ts         # Test file
  ├── README.md             # Documentation template
  └── tsconfig.json         # TypeScript config (extends root)
```

**Implementation**:

- CLI tool in `src/apps/plugin-cli/`
- Templates in `src/apps/plugin-cli/templates/`
- Validates plugin name (kebab-case, no conflicts)
- Generates boilerplate matching project standards

**Example**:

```bash
npm run plugin:create --name sleep-tracker --type sensorium

✅ Created plugin: plugins/sleep-tracker/
✅ Generated plugin.json
✅ Generated index.ts with SensoriumPlugin interface
✅ Generated index.test.ts with example tests
✅ Generated README.md template
```

---

### 2. TypeScript Plugin Package

**Package**: `@libs/plugins`

**Exports**:

```typescript
// Core interfaces
export type {
  Plugin,
  SensoriumPlugin,
  ProceduralModelPlugin,
  WorldModelPlugin,
};
export type { PluginContext, PluginStorage };
export type { Observation, Result };

// Utilities
export { createPluginContext } from "./context.js";
export { validateObservation } from "./validation.js";

// Testing utilities
export { testPlugin, createMockContext } from "./testing.js";
```

**Implementation**:

- `src/libs/plugins/index.ts` - Public API
- `src/libs/plugins/types.ts` - Type definitions
- `src/libs/plugins/context.ts` - PluginContext implementation
- `src/libs/plugins/testing.ts` - Testing utilities
- `src/libs/plugins/validation.ts` - Observation validation

**Type Safety**:

- Full TypeScript types for all interfaces
- Config schema → TypeScript types (JSON Schema → TS)
- Autocomplete for PluginContext methods
- Compile-time validation

---

### 3. Testing Utilities

**Package**: `@libs/plugins/testing`

**Utilities**:

```typescript
// Create mock PluginContext
export function createMockContext(options?: {
  config?: Record<string, unknown>;
  state?: Partial<State>;
  logger?: Logger;
}): PluginContext;

// Test plugin and validate outputs
export function testPlugin(
  plugin: SensoriumPlugin,
  context: PluginContext,
): Promise<Result<Observation[]>>;

// Validate Observation against DNA types
export function validateObservation(obs: Observation): Result<void>;

// Mock network requests
export function mockNetworkRequest(url: string, response: unknown): void;
```

**Implementation**:

- `src/libs/plugins/testing/index.ts`
- Mock implementations of PluginContext
- Validation helpers
- Network mocking utilities

**Example**:

```typescript
import { createMockContext, testPlugin } from '@libs/plugins/testing';

const context = createMockContext({
  config: { apiKey: 'test' },
  state: { variables: [...] },
});

const result = await testPlugin(plugin, context);
expect(result.ok).toBe(true);
```

---

## Phase 2: High Value (After Foundation)

### 4. Plugin Validation CLI

**Command**: `npm run plugin:validate --name <name>`

**Checks**:

- ✅ Manifest is valid JSON
- ✅ Permissions are valid (match allowed list)
- ✅ Config schema is valid JSON Schema
- ✅ TypeScript compiles without errors
- ✅ Tests pass
- ✅ Plugin implements correct interface
- ✅ Observations match DNA types
- ✅ No obvious security issues

**Output**:

```
Validating plugin: sleep-tracker

✅ Manifest valid
✅ Permissions valid
✅ Config schema valid
✅ TypeScript compiles
✅ Tests pass (5/5)
✅ Observations validated
✅ Interface implemented correctly

Plugin is ready for distribution!
```

**Implementation**:

- `src/apps/plugin-cli/validate.ts`
- Runs all checks
- Provides actionable error messages
- Exit code 0 if valid, 1 if invalid

---

### 5. Plugin Development Mode

**Command**: `npm run plugin:dev --name <name>`

**Features**:

- Watch plugin files for changes
- Validate on change
- Run tests automatically
- Show Observation output
- Show Membrane validation results
- Hot reload (restart plugin execution)

**Output**:

```
🔍 Watching plugin: sleep-tracker

✅ Plugin loaded
✅ Tests passing (5/5)

[2024-01-15 10:30:45] Plugin executed
  → Produced 1 Observation:
    - variableProxySignal: var_sleep → InRange

[2024-01-15 10:30:46] File changed: index.ts
  → Reloading...
  ✅ Plugin reloaded
  ✅ Tests passing (5/5)
```

**Implementation**:

- `src/apps/plugin-cli/dev.ts`
- File watcher (chokidar or native)
- Plugin loader with hot reload
- Test runner integration
- Observation inspector

---

### 6. Example Plugins

**Location**: `plugins/examples/`

**Examples**:

- `sleep-tracker/` - Full Sensorium plugin
- `email-followup/` - Procedural Model plugin
- `project-management/` - World Model plugin (Phase 2)

**Each Example Includes**:

- Working implementation
- Comprehensive tests
- README with explanation
- Config examples
- Usage examples

**Purpose**:

- Learning resource
- Reference implementation
- Starting point for new plugins

---

## Phase 3: Nice to Have

### 7. Plugin Debug Mode

**Command**: `npm run plugin:debug --name <name>`

**Features**:

- Verbose logging
- Execution timeline
- Observation production log
- Membrane validation details
- Config access log
- Storage operations log
- Performance metrics

**Output**:

```
🐛 Debug mode: sleep-tracker

[10:30:45.123] Plugin initialized
[10:30:45.124] Config accessed: apiKey
[10:30:45.125] State read: variables (3 items)
[10:30:45.200] Network request: GET https://api.sleep.com/data
[10:30:45.350] Observation produced: variableProxySignal
[10:30:45.351] Membrane validation: ✅ Passed
[10:30:45.352] Execution time: 229ms
```

---

### 8. Plugin Documentation Generator

**Command**: `npm run plugin:docs --name <name>`

**Generates**:

- README.md from JSDoc comments
- Config schema → usage examples
- Example Observations
- Test examples
- API documentation

**Implementation**:

- Extract JSDoc from code
- Generate markdown
- Include examples from tests
- Config schema → usage guide

---

### 9. Plugin Development Checklist

**Command**: `npm run plugin:checklist --name <name>`

**Checks**:

- ✅ Plugin manifest valid
- ✅ TypeScript compiles
- ✅ Tests pass
- ✅ Observations validated
- ✅ Config schema valid
- ✅ README exists
- ✅ Examples provided
- ⚠️ Error handling tests
- ⚠️ Network error handling
- ⚠️ Config validation

**Output**:

```
Plugin Checklist: sleep-tracker

✅ Core Requirements (7/7)
⚠️  Recommendations (3)
   - Consider adding error handling tests
   - Consider testing network failures
   - Consider validating config at runtime
```

---

## Implementation Plan

### Step 1: Create Plugin Package

1. Create `src/libs/plugins/` directory
2. Define types (`types.ts`)
3. Implement PluginContext (`context.ts`)
4. Create testing utilities (`testing.ts`)
5. Export public API (`index.ts`)

### Step 2: Create Plugin CLI

1. Create `src/apps/plugin-cli/` directory
2. Implement `create` command (scaffolding)
3. Implement `validate` command
4. Implement `dev` command (watch mode)
5. Add npm scripts to `package.json`

### Step 3: Create Example Plugins

1. Create `plugins/examples/` directory
2. Implement sleep-tracker example
3. Add tests and documentation
4. Use as reference implementation

### Step 4: Add Advanced Features

1. Debug mode
2. Documentation generator
3. Development checklist

---

## Success Criteria

**Phase 1 Complete When**:

- Developer can create plugin in < 5 minutes
- TypeScript autocomplete works
- Tests can be written easily
- Plugin validates successfully

**Phase 2 Complete When**:

- Developer can iterate quickly (watch mode)
- Validation catches errors before distribution
- Examples exist for all plugin types

**Phase 3 Complete When**:

- Debugging is easy (debug mode)
- Documentation is auto-generated
- Quality checklist guides development

---

## Notes

- All tooling should match project standards (TypeScript, Result types, explicit returns)
- Plugin CLI should be separate from main CLI (different concerns)
- Testing utilities should be lightweight (no heavy dependencies)
- Examples should be real, working plugins (not stubs)
