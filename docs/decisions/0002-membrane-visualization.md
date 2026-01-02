# ADR 0002: Membrane Visualization (Proposal)

## Status

Proposed (not yet implemented)

## Context

Codebases are opaque. You either read the code or you don't understand it. Traditional documentation goes stale. Architecture diagrams are static and disconnected from reality.

The Becoming Engine uses an **organ metaphor**: Memory, Regulator, Sensorium. Each is a module with clear responsibilities and boundaries. This metaphor is powerful for understanding—but currently it only exists in documentation.

We want a **living visualization** that:

- Shows the codebase as an organism, not a file tree
- Updates automatically as the code changes
- Is understandable by non-technical people
- Requires zero configuration—just works as the codebase grows

## Decision

Propose a web-based visualization called **Membrane** that renders the codebase structure as a living organism.

### Core Principles

1. **Self-Discovering**: Scans directories, parses READMEs, infers imports—no manual configuration
2. **Code-Focused**: Visualizes code structure, not application state (that's the UI's job)
3. **Generic**: Works for any TypeScript codebase with the same conventions
4. **Accessible**: Non-technical viewers understand what modules do through plain language

### What It Visualizes

| Layer          | What You See                                         | Who It's For      |
| -------------- | ---------------------------------------------------- | ----------------- |
| **Organs**     | Auto-discovered modules with data flow arrows        | Anyone            |
| **Files**      | Files within an organ as smaller cells               | Curious observers |
| **Code Graph** | Functions, types, and their call relationships (AST) | Developers        |

### What It Does NOT Visualize

- Application state (Variables, Episodes, Actions) → belongs in Web UI
- Runtime behavior → this is static code structure
- Performance metrics → not a dashboard

### Self-Discovery Mechanism

```
Convention:
  src/libs/*   → "Organs" (core system modules)
  src/apps/*   → "Surfaces" (user-facing applications)

Discovery:
  1. Scan directories matching patterns
  2. Parse README.md for name, role, description, philosophy
  3. Parse imports to infer data flow relationships
  4. Watch for new directories → visualization updates automatically
```

### Aesthetic Principles

- **Bioluminescent depths**: Dark slate background, soft teal for calm, amber for activity
- **Breathing motion**: Slow, continuous animation that feels alive
- **Sparse typography**: Labels only where necessary, plain-language descriptions
- **Reactive pulses**: Code changes cause the affected organ to glow briefly

### Technical Architecture

```
src/apps/membrane/
├── index.html              # Entry point
├── main.ts                 # Client bootstrap
├── vite.config.ts          # Vite dev server config
├── server/
│   ├── index.ts            # WebSocket server (discovery + file watcher)
│   ├── discovery.ts        # Auto-discover organs from filesystem
│   ├── watcher.ts          # Watch source files for changes
│   └── types.ts            # Server message types
├── client/
│   ├── state.ts            # Client state manager
│   ├── renderer.ts         # Canvas orchestrator
│   ├── interaction.ts      # Mouse/keyboard handlers
│   └── types.ts            # Client types
├── canvas/
│   ├── organs.ts           # Organs layer rendering
│   ├── files.ts            # Files layer rendering
│   ├── codeGraph.ts        # Code graph rendering (AST)
│   ├── animation.ts        # Spring physics, breathing
│   └── layout.ts           # Positioning calculations
└── parser/
    ├── readme.ts           # Parse README.md for metadata
    ├── imports.ts          # Parse imports for data flow
    └── ast.ts              # TypeScript AST for code graph
```

### Why Canvas, Not SVG/DOM

- Organic animations require smooth, continuous rendering
- Canvas is better for particle effects and fluid motion
- Pure computation (animation, layout) stays separate from rendering side effects

## Consequences

**Pros**

- Documentation that doesn't feel like docs—you understand the system by looking at it
- Grows with the codebase automatically—zero maintenance
- Non-technical people can understand code structure through visual metaphor
- Reactive to your work—save a file, see the organism respond

**Cons**

- Additional dev dependency (Vite, chokidar, ws)
- Requires WebSocket server running alongside dev server
- Canvas rendering is harder to debug than DOM
- README parsing assumes consistent documentation format

## Dependencies

- None required—this is orthogonal to the core MP track
- Could be built at any time as a side project

## Notes

This is a "nice to have" enhancement that makes the codebase legible. It's not core to the regulatory machinery but could be valuable for:

- Onboarding new developers to the architecture
- Explaining the system to non-technical stakeholders
- Making the abstract organ metaphor concrete
- Catching "where does this belong?" questions early

A prototype was built and validated the concept. Implementation can proceed when capacity allows.
