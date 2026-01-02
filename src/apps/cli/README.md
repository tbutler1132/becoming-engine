# CLI App

The CLI is the **command-line interface** of the system. It owns no authority.

## Role

Orchestrates the organ flow:

`Sensorium (Input) → Membrane (Constraints) → Regulator (Decision/Mutation) → Memory (Persist)`

The CLI interprets what Sensorium senses and calls the appropriate Regulator methods. Sensorium never triggers Actions directly—the CLI does.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLI                                    │
│  (Orchestrator — owns no authority, never mutates State)        │
└────────┬────────────────┬──────────────────┬──────────────┬─────┘
         │                │                  │              │
         ▼                ▼                  ▼              ▼
    ┌─────────┐     ┌──────────┐      ┌───────────┐   ┌─────────┐
    │Sensorium│     │ Membrane │      │ Regulator │   │ Memory  │
    │(parsing)│────▶│(gating)  │─────▶│(mutation) │──▶│(persist)│
    └─────────┘     └──────────┘      └───────────┘   └─────────┘
```

## Usage

Run the CLI via scripts:

```bash
# General entrypoint (dev)
npm run becoming:dev -- status

# Status convenience
npm run becoming:status
```

## Command Reference

### `status`

Shows a minimal dashboard for a node. If a node is in baseline (no active episodes), output is intentionally quiet ("Silence is Success").

```bash
npm run becoming:dev -- status --node Personal:personal
```

**Organ flow:** Sensorium → Regulator (`getStatusData`) → Memory (load)

### `signal`

Updates a Variable status via the Regulator.

```bash
npm run becoming:dev -- signal --node Personal:personal --variableId <id> --status InRange
```

**Organ flow:** Sensorium → Regulator (`signal`) → Memory (save)

### `act`

Attempts to add an Action via the Regulator.

- If `--episodeId` is provided, the Episode must exist and be Active (episode-scoped action).
- If `--episodeId` is omitted, the Action is unscoped (low-authority by default).

```bash
npm run becoming:dev -- act --node Personal:personal --description "Do the thing"
npm run becoming:dev -- act --node Personal:personal --episodeId <id> --description "Do the thing"
```

**Organ flow:** Sensorium → Regulator (`act`) → Memory (save)

### `open`

Opens a new Episode. Episode opening is gated through the Membrane.

```bash
# Explore episode
npm run becoming:dev -- open --node Personal:personal --type Explore --objective "Learn X"

# Stabilize episode (requires variableId)
npm run becoming:dev -- open --node Personal:personal --type Stabilize --variableId <id> --objective "Restore Y"

# Override a Membrane block (if exception allowed)
npm run becoming:dev -- open --node Personal:personal --type Explore --objective "Learn X" --override "Justification"
```

**Organ flow:** Sensorium → Membrane (`checkEpisodeConstraints`) → Regulator (`openEpisode`) → Memory (save)

### `close`

Closes an Episode with a closure note. Explore episodes must produce at least one Model update.

```bash
npm run becoming:dev -- close --episodeId <id> --note "Closure summary"
```

**Organ flow:** Sensorium → Regulator (`closeEpisode`) → Memory (save)

### `observe` (Observation Flow)

The `observe` command uses a structured observation flow where Sensorium produces typed Observations that the CLI interprets into Regulator mutations.

#### `observe signal`

```bash
npm run becoming:dev -- observe signal --variableId <id> --status InRange
```

#### `observe note`

```bash
npm run becoming:dev -- observe note --content "Some observation"
npm run becoming:dev -- observe note --content "Tagged note" --tags "insight,question"
```

#### `observe episode`

```bash
npm run becoming:dev -- observe episode --type Explore --objective "Learn X"
```

## Error Handling

All commands use `Result<T>` types. On error:

- Error message is printed to stderr
- Process exits with code 1

Example errors:

- `Unknown command 'foo'. Expected one of: status, signal, act, open, close, observe`
- `Missing required flag: --variableId`
- `Variable 'nonexistent' not found`
- `Blocked by Normative Model [model-id]: reason`
