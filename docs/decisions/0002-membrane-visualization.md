# ADR 0002: Membrane Visualization (Proposal)

## Status

Proposed (not yet implemented)

## Context

The Becoming Engine has a rich philosophy that's currently expressed only through documentation and CLI output. The doctrine emphasizes:

- "When nothing is wrong, the system disappears"
- "Idleness is a success state"
- Organisms as living, breathing entities
- Two separate nodes (Personal, Org) that regulate independently
- Episodes as explicitly temporary structures

A traditional dashboard would contradict this philosophy—dashboards imply constant monitoring, metrics, and optimization pressure. Instead, we want a **living visualization** that embodies the doctrine visually.

## Decision

Propose a web-based visualization called **Membrane** that:

1. Renders the system as a **living organism**, not a dashboard
2. Is **quiet at baseline**—when nothing is wrong, the visualization is calm and minimal
3. Shows **pressure as perturbation**, not alarms or red alerts
4. Visualizes **Episodes as temporary scaffolding** that dissolves when closed
5. Represents **organs** (Memory, Regulator, Sensorium, Cortex) as interconnected modules
6. Is **reactive to code changes**—recent edits pulse through the affected organ

### Visual Layers

| Layer                   | What You See                                        | Who It's For      |
| ----------------------- | --------------------------------------------------- | ----------------- |
| **Organism**            | Personal/Org nodes, Variables, Episodes             | Anyone            |
| **Organs**              | Memory, Regulator, Sensorium, Cortex with data flow | Curious observers |
| **Files** (future)      | Files within an organ                               | Developers        |
| **Code Graph** (future) | Functions, types, call relationships (AST)          | Deep dives        |

### Aesthetic Principles

- **Bioluminescent depths**: Dark slate background, soft teal for calm, amber for attention
- **Breathing motion**: Slow, continuous animation that feels alive
- **Sparse typography**: Labels only where necessary
- **Philosophy as ambient text**: Doctrine fragments float near relevant elements

### Technical Architecture

```
src/apps/membrane/
├── index.html              # Entry point
├── main.ts                 # Client bootstrap
├── vite.config.ts          # Vite dev server config
├── server/
│   ├── index.ts            # WebSocket server (file watcher relay)
│   ├── watcher.ts          # Chokidar watching state + source files
│   └── types.ts            # Server message types
├── client/
│   ├── state.ts            # State manager with WebSocket
│   ├── renderer.ts         # Canvas orchestrator
│   ├── interaction.ts      # Mouse/keyboard handlers
│   └── types.ts            # Client types
├── canvas/
│   ├── organism.ts         # Organism layer rendering
│   ├── organs.ts           # Organs layer rendering
│   ├── animation.ts        # Spring physics, breathing
│   └── layout.ts           # Positioning calculations
└── data/
    └── organs.json         # Static organ metadata
```

### Reactivity

1. **State changes**: Watch `data/state.json`, broadcast via WebSocket
2. **Code changes**: Watch `src/**/*.ts`, pulse the affected organ
3. **Future**: Could integrate with git for commit-level visualization

### Why Canvas, Not SVG/DOM

- Organic animations require smooth, continuous rendering
- Canvas is better for particle effects and fluid motion
- Pure computation (animation, layout) stays separate from rendering side effects

## Consequences

**Pros**

- Documentation that doesn't feel like docs—you understand the system by looking at it
- Philosophy made tangible—quietness is the reward
- Reactive to your work—reflects the living codebase
- Low authority—visualization only, no planning affordances

**Cons**

- Additional maintenance surface
- Requires WebSocket server running alongside dev server
- Canvas rendering is harder to debug than DOM

## Dependencies

- MP4+ (Episodes with lifecycle) for meaningful visualization
- Ideally after MP6 (Models) so we can visualize beliefs
- Could be built in parallel with or after MP12 (Cortex UI) as an alternative surface

## Notes

This is a "nice to have" enhancement that embodies the philosophy visually. It's not core to the regulatory machinery but could be valuable for:

- Onboarding new users to the philosophy
- Demonstrating the system's living nature
- Making the abstract concrete

A prototype was built and validated the concept. Implementation can proceed when capacity allows.
