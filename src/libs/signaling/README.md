# Signaling Organ

The Signaling organ handles **inter-node communication** through an append-only event log. This is the foundation for federation — enabling nodes to exchange signals without sharing internal state.

## Why Signaling Exists

The system is designed for a future where multiple nodes (organisms) need to coordinate. They can't share internal state (that would violate encapsulation), so they need a neutral communication channel. Signaling provides that: an append-only log where nodes emit events and consume events from others. Even in single-node mode, this architecture is in place — ready for federation without refactoring.

## 🧠 Responsibilities

- **Event Envelope**: Defines the minimal signal format (nodeId, eventId, type, payload, timestamp)
- **Append-Only Log**: Events are persisted to `data/events.jsonl` in order
- **Idempotency**: Emitting the same eventId twice is a no-op
- **Local-Only (v0)**: This version operates locally; network federation is future work

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `EventLog` Class

The primary class for event management:

```typescript
import { EventLog, createEvent } from "./libs/signaling/index.js";

const log = new EventLog({ basePath: process.cwd() });

// Emit an event
const event = createEvent({
  eventId: "evt-123",
  nodeId: "Personal:personal",
  type: "intent",
  payload: { action: "start-episode" },
  timestamp: new Date().toISOString(),
});

const result = await log.emit(event);
if (result.ok) {
  console.log(result.value ? "Event added" : "Already existed (idempotent)");
}

// Consume events
const events = await log.consume((e) => e.type === "intent");
```

### Pure Functions

- `createEvent(params)`: Constructs a valid SignalEvent from parameters
- `isValidEvent(data)`: Type guard for validating unknown data as SignalEvent

```typescript
import { createEvent, isValidEvent } from "./libs/signaling/index.js";

const event = createEvent({ ... });
const isValid = isValidEvent(someUnknownData); // type guard
```

### Types

| Type                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `SignalEvent`             | The event envelope (eventId, nodeId, type, payload, timestamp) |
| `SignalEventType`         | Event type: "intent", "status", "completion"                   |
| `CreateSignalEventParams` | Parameters for createEvent()                                   |

### Constants

- `SIGNAL_EVENT_TYPES`: Valid event type values (from DNA)

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

## 🧪 Testing

- **Unit Tests**: `logic.test.ts` — tests pure functions
- **Store Tests**: `store.test.ts` — tests emit/consume and proves idempotency
