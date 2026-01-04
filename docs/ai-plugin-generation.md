# AI-Assisted Plugin Generation

## Status

Proposed

## Vision

Enable non-technical users to create plugins through natural language prompts, while preserving all doctrine constraints (anti-capture, agency, explicitness, viability).

## Core Principle: AI Assists, Human Decides

AI-generated plugins are **draft artifacts**, not active code. They follow the same pattern as other AI assistance in the system:

- **Pull-based**: User asks, AI proposes
- **Draft artifacts**: Generated plugin is a draft, not active
- **Explicit approval**: User must review and approve
- **All validation applies**: Membrane, DNA types, security checks
- **Code is visible**: User can see and edit generated code
- **LLMs assist, don't decide**: AI is a pattern detector, not an authority

## The User Experience

### Step 1: User Describes What They Want

```
User: "I want to track my mood from my journal entries.
       If I write something negative, update my Mood Variable to Low."
```

### Step 2: AI Generates Plugin (Draft)

AI generates:

- Plugin code (TypeScript)
- Plugin manifest (permissions, config)
- Tests (basic validation)
- README (explanation)

**Status**: Draft (not active)

### Step 3: User Reviews Generated Plugin

User sees:

- **Code Preview**: Full TypeScript code (readable, editable)
- **What It Does**: Plain language explanation
- **Permissions**: What the plugin can access
- **Config Required**: What user needs to configure
- **Validation Results**: Does it pass all checks?

### Step 4: User Approves or Edits

**Option A: Approve as-is**

- Plugin becomes active
- User configures it
- Plugin starts working

**Option B: Edit before approving**

- User edits code directly
- User modifies config schema
- User adds/removes features
- Then approves

**Option C: Reject**

- Plugin stays as draft
- User can ask AI to regenerate
- User can start over

## Safety Mechanisms

### 1. All Validation Still Applies

AI-generated plugins must pass:

- ✅ Manifest validation (permissions, config schema)
- ✅ TypeScript compilation
- ✅ DNA type validation (Observations match types)
- ✅ Membrane validation (constraints enforced)
- ✅ Security checks (no dangerous permissions)
- ✅ Test validation (tests pass)

### 2. Code Is Always Visible

**Never hidden**:

- Generated code is always visible
- User can read what plugin does
- User can edit before approving
- No "black box" plugins

**Transparency**:

- Code is formatted and readable
- Comments explain what each part does
- Plain language explanation provided
- Visual representation of data flow

### 3. Progressive Trust

**First-time user**:

- AI generates simple plugins
- More validation checks
- More explicit explanations
- More conservative permissions

**Experienced user**:

- Can request more complex plugins
- Can edit code confidently
- Can approve with less hand-holding
- Can trust AI more (but still reviews)

### 4. AI Constraints

**AI may**:

- Generate plugin code
- Suggest patterns from examples
- Explain what code does
- Propose improvements

**AI may NOT**:

- Activate plugins without approval
- Bypass validation
- Generate plugins with dangerous permissions
- Create optimization loops
- Generate plugins that violate doctrine

### 5. Human Always in Control

**User controls**:

- What plugin does (prompt)
- Whether to approve (decision)
- How plugin works (editing)
- When plugin runs (config)
- Whether plugin stays active (disable)

**System enforces**:

- Validation (safety)
- Membrane (constraints)
- Doctrine (principles)

## Implementation

### Phase 1: Basic AI Generation

**Features**:

- Natural language → plugin code
- Generate TypeScript from prompt
- Generate manifest from prompt
- Basic validation
- Code preview and editing

**AI Model**:

- Use existing LLM API (OpenAI, Anthropic, etc.)
- Prompt engineering for plugin generation
- Few-shot learning from example plugins
- Code generation with validation

**User Flow**:

```
User prompt → AI generates code → User reviews → User approves → Plugin active
```

### Phase 2: Interactive Refinement

**Features**:

- Iterative refinement ("make it simpler", "add error handling")
- Code explanation ("what does this do?")
- Pattern suggestions ("similar plugins do X")
- Test generation ("generate tests for this")

**User Flow**:

```
User prompt → AI generates → User reviews → User asks for changes → AI refines → User approves
```

### Phase 3: Visual Code Editor

**Features**:

- Visual representation of plugin logic
- Edit code visually (drag-and-drop)
- See data flow (Observations → Observations)
- Test in real-time

**User Flow**:

```
User prompt → AI generates → Visual editor → User edits → User approves
```

## Example: Mood Tracker Plugin

### User Prompt

```
"I want to track my mood from my journal entries.
If I write something negative, update my Mood Variable to Low.
If I write something positive, update it to High.
Otherwise, keep it InRange."
```

### AI Generates (Draft)

```typescript
import type {
  SensoriumPlugin,
  PluginContext,
  Observation,
  Result,
} from "@libs/plugins";

export class MoodTrackerPlugin implements SensoriumPlugin {
  readonly name = "mood-tracker";
  readonly version = "1.0.0";
  readonly description = "Tracks mood from journal entries";

  async sense(context: PluginContext): Promise<Result<Observation[]>> {
    // Get journal entries from Notes
    const notes = context.state.notes.filter((n) =>
      n.tags?.includes("journal"),
    );

    if (notes.length === 0) {
      return { ok: true, value: [] };
    }

    // Analyze latest journal entry
    const latestNote = notes[notes.length - 1];
    const content = latestNote.content.toLowerCase();

    // Simple sentiment analysis
    const negativeWords = ["sad", "angry", "frustrated", "tired", "stressed"];
    const positiveWords = ["happy", "excited", "grateful", "energized", "calm"];

    let status: "Low" | "InRange" | "High" = "InRange";

    if (negativeWords.some((word) => content.includes(word))) {
      status = "Low";
    } else if (positiveWords.some((word) => content.includes(word))) {
      status = "High";
    }

    // Get variable ID from config
    const variableId = context.config.variableId as string;
    if (!variableId) {
      return {
        ok: false,
        error: "Missing config: variableId",
      };
    }

    return {
      ok: true,
      value: [
        {
          type: "variableProxySignal",
          node: context.state.currentNode,
          variableId,
          status,
        },
      ],
    };
  }
}
```

### User Reviews

**Sees**:

- Code (formatted, readable)
- Explanation: "This plugin reads your journal Notes, analyzes sentiment, and updates your Mood Variable"
- Permissions: `read-state`, `write-observations`
- Config: `variableId` (required)
- Validation: ✅ All checks pass

### User Approves

Plugin becomes active. User configures:

- `variableId`: "var_mood"
- Plugin starts running

## Risks and Mitigations

### Risk 1: AI Generates Dangerous Code

**Mitigation**:

- Validation catches dangerous patterns
- Security scanner checks permissions
- Code review before activation
- User can edit before approving

### Risk 2: AI Creates Optimization Loops

**Mitigation**:

- AI trained on doctrine-aligned examples
- Validation checks for optimization patterns
- Membrane enforces constraints
- User reviews before approval

### Risk 3: User Doesn't Understand Code

**Mitigation**:

- Plain language explanation
- Visual representation
- Code comments
- Examples and patterns
- Progressive disclosure (simple → complex)

### Risk 4: AI Generates Brittle Code

**Mitigation**:

- AI trained on robust patterns
- Generated tests validate behavior
- Error handling required
- User can request improvements

### Risk 5: Proliferation of Low-Quality Plugins

**Mitigation**:

- Validation gates (must pass checks)
- User reviews before activation
- Community can review and improve
- Quality metrics visible

## Doctrine Alignment

### ✅ Anti-Capture

- AI-generated plugins can't bypass Membrane
- Validation prevents optimization loops
- User reviews before activation
- Code is visible (no hidden behavior)

### ✅ Agency

- User controls what plugin does (prompt)
- User controls whether to approve (decision)
- User can edit before approving (modification)
- User can disable anytime (control)

### ✅ Explicitness

- Code is always visible
- Plain language explanation provided
- Permissions are explicit
- Validation results are clear

### ✅ Viability

- Validation prevents broken plugins
- Error handling required
- Tests validate behavior
- User can fix before activating

### ✅ Baseline Quiet

- Plugins can be disabled
- No forced activation
- User controls when plugins run
- Failed plugins don't crash system

## Long-Term Vision

### Phase 1: Code Generation (Now)

- Natural language → TypeScript code
- Basic validation
- Code preview and editing

### Phase 2: Interactive Refinement (6-12 months)

- Iterative refinement
- Code explanation
- Pattern suggestions
- Test generation

### Phase 3: Visual Builder (12-18 months)

- Visual plugin builder
- Natural language → visual → code
- Drag-and-drop editing
- Real-time testing

### Phase 4: Community Patterns (18+ months)

- Learn from community plugins
- Suggest patterns from examples
- Collaborative refinement
- Shared plugin patterns

## Success Criteria

**User can**:

- Create plugin in < 5 minutes (prompt → active)
- Understand what plugin does (explanation)
- Edit plugin if needed (code editing)
- Trust plugin works (validation)

**System ensures**:

- All plugins pass validation
- All plugins respect doctrine
- All plugins are reviewable
- All plugins are editable

**Ecosystem benefits**:

- More plugins (lower barrier)
- Better plugins (AI learns from examples)
- Diverse plugins (non-technical users contribute)
- Quality maintained (validation gates)

## Notes

- This is a natural extension of the doctrine's "assistance" philosophy
- AI-generated plugins are draft artifacts, not active code
- All existing validation and safety mechanisms apply
- User always has final control
- Code is always visible and editable
- This enables non-technical users to extend the system while preserving all safety guarantees
