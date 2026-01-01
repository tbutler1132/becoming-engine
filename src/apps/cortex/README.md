# Cortex (CLI App)

The Cortex is the **interpretive surface** of the system. It owns no authority.

## Role

Orchestrates the organ flow:

`Sensorium (Input) → Regulator (Decision/Mutation) → Memory (Persist)`

## Usage

Run the CLI via scripts:

```bash
# General entrypoint (dev)
npm run becoming:dev -- status

# Status convenience
npm run becoming:status
```

### Commands

#### `status`

Shows a minimal dashboard for a node. If a node is in baseline (no active episodes), output is intentionally quiet (“Silence is Success”).

```bash
npm run becoming:dev -- status --node Personal:personal
```

#### `signal`

Updates a Variable status via the Regulator.

```bash
npm run becoming:dev -- signal --node Personal:personal --variableId <id> --status InRange
```

#### `act`

Attempts to add an Action via the Regulator.

- If `--episodeId` is provided, the Episode must exist and be Active (episode-scoped action).
- If `--episodeId` is omitted, the Action is unscoped (low-authority by default).

```bash
npm run becoming:dev -- act --node Personal:personal --description "Do the thing"
npm run becoming:dev -- act --node Personal:personal --episodeId <id> --description "Do the thing"
```
