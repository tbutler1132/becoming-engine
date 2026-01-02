# Membrane

A living visualization of the Becoming Engine codebase.

## Philosophy

The Membrane embodies the doctrine: **"When nothing is wrong, the system disappears."**

This is not a dashboard. It's an organism you observe. When the system is in baseline, the visualization is calm and quiet. When pressure emerges, you see it as subtle perturbation—not alarms.

## Layers

### Organism Layer (Default)

Shows the two nodes—Personal and Org—as living membrane structures:

- **Variables** appear as cells within each node, pulsing gently when in range, trembling when drifting
- **Episodes** appear as temporary scaffolding arcs around nodes
- **Baseline state** contracts the node to minimal size—visual quietness is the reward

### Organs Layer (Scroll to zoom)

Shows the codebase as a network of organs:

- **Memory** — Ontology & Persistence
- **Regulator** — Cybernetic Control Loop
- **Sensorium** — Input Parsing
- **Cortex** — Interpretive Surface

Data flow arrows show how signals move: `Sensorium → Cortex → Regulator → Memory`

Code changes cause organs to pulse briefly, showing the living nature of the codebase.

## Usage

**1. Start the WebSocket server** (watches for state and code changes):

```bash
npm run membrane:server
```

**2. Start the visualization** (in a separate terminal):

```bash
npm run membrane:dev
```

The visualization will open at `http://localhost:3000`.

## Interaction

- **Scroll** to zoom between layers
- **Click** on nodes or organs to inspect
- **Esc** to zoom out or clear focus
- **1-4 keys** (in organs view) to quick-select organs

## Reactivity

The visualization reacts to:

- **State changes** in `data/state.json` (Variables, Episodes)
- **Code changes** in `src/libs/` and `src/apps/cortex/` (organ pulses)

## Aesthetic

- Deep slate background (#0a0e14)
- Bioluminescent teal for calm states
- Warm amber for attention
- Muted coral for tension
- Philosophy fragments float as ambient reminders

## Future

- **Code Graph Layer**: Click into an organ to see its internal function-call graph (AST visualization)
