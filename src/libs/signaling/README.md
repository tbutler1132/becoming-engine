# Signaling Organ

The Signaling organ handles **inter-node communication** through an append-only event log. This is the foundation for federation — enabling nodes to exchange signals without sharing internal state.

## Responsibilities

- **Event Envelope**: Defines the minimal signal format (nodeId, eventId, type, payload, timestamp)
- **Append-Only Log**: Events are persisted to `data/events.jsonl` in order
- **Idempotency**: Emitting the same eventId twice is a no-op
- **Local-Only (v0)**: This version operates locally; network federation is future work

## Public API

The organ exposes its API via `index.ts`.

### `EventLog`

The primary class for event management.

- `emit(event)`: Appends event to log. Returns `Result<boolean>`:
  - `ok(true)`: Event was appended (new)
  - `ok(false)`: Event already exists (idempotent no-op)
  - `error`: I/O failure
- `consume(predicate?)`: Returns all events, optionally filtered

### `SignalEvent`

The event envelope interface:

```typescript
interface SignalEvent {
  eventId: string; // Unique, used for idempotency
  nodeId: string; // Source node identity
  type: SignalEventType; // "intent" | "status" | "completion"
  payload: unknown; // Event-specific data
  timestamp: string; // ISO-8601
}
```

### Pure Functions

- `createEvent(params)`: Constructs a valid SignalEvent
- `isValidEvent(data)`: Type guard for validating unknown data

## Event Types

| Type         | Purpose                      |
| ------------ | ---------------------------- |
| `intent`     | Node signals intent to act   |
| `status`     | Node shares current status   |
| `completion` | Node signals task completion |

## Storage

Events are stored in `data/events.jsonl` (JSON Lines format):

- One JSON object per line
- Append-only (events are never modified or deleted)
- Atomic writes with file locking

## Doctrine Alignment

- **Separation of Organisms**: Nodes interact via signals, not shared state
- **Baseline is Quiet**: Empty event log is the default; no noise
- **Explicit Over Implicit**: Event types are enumerated, payloads are typed

## Testing

- **Unit Tests**: `logic.test.ts` — tests pure functions
- **Store Tests**: `store.test.ts` — tests emit/consume and proves idempotency
