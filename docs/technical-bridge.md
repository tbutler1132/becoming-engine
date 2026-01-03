# Technical Bridge: Phase 1 → Civilization

> What architectural decisions matter now for the long-term vision?

Short answer: **most can wait, but a few are load-bearing.**

---

## Current Architecture Assessment

What exists now:

```typescript
// Node identity: local-only, no federation
interface NodeRef {
  type: "Personal" | "Org";
  id: string; // Just a local string
}

// Signal envelope: minimal, no authentication
interface SignalEvent {
  eventId: string;
  nodeId: string; // Just a string, not cryptographically verified
  type: SignalEventType;
  payload: unknown;
  timestamp: string;
}

// State: flat JSON file, local storage
interface State {
  schemaVersion: SchemaVersion;
  variables: Variable[];
  episodes: Episode[];
  // ...
}
```

**Verdict:** This is fine for Phase 1. The question is whether it blocks Phase 2+.

---

## Load-Bearing Decisions (Get Right Now)

### 1. Local-First Data Sovereignty ✅ Already Correct

Current: State lives in a local JSON file. User owns their data.

This is **exactly right** for the civilizational vision. Federation must be peer-to-peer, not cloud-mediated. The current design doesn't need to change—it needs to stay this way.

**Don't break:** Never move to a model where state lives on "our servers."

### 2. Node Identity Model ⚠️ Needs Extension Path

Current: `NodeRef = { type, id }` where `id` is a local string like `"personal"`.

For federation, nodes need cryptographic identity:

```typescript
// Future extension (don't implement yet, just don't block)
interface FederatedNodeRef extends NodeRef {
  publicKey?: string; // For signature verification
  endpoint?: string; // For direct communication
}
```

**Current decision:** Keep `NodeRef` as-is, but ensure nothing assumes IDs are purely local. The current `id: string` should be able to become a longer, globally-unique identifier (like a public key hash) without breaking anything.

**Check:** Grep for hardcoded assumptions about node ID format.

### 3. Signal Envelope ⚠️ Needs Signature Field

Current: `SignalEvent` has no authentication.

For federation, signals must be signed:

```typescript
// Future extension
interface SignalEvent {
  eventId: string;
  nodeId: string;
  type: SignalEventType;
  payload: unknown;
  timestamp: string;
  signature?: string; // Signs: eventId + nodeId + type + payload + timestamp
}
```

**Current decision:** The envelope is minimal, which is good. Adding `signature` later is additive, not breaking. Just don't build anything that assumes unsigned signals are trusted across nodes.

### 4. ID Generation Strategy ⚠️ Matters for Merge

Current: IDs are presumably UUIDs or similar.

For federation, IDs must be:

- Globally unique (no collisions between nodes)
- Deterministic enough to detect duplicates
- Ideally content-addressable for immutable objects

**Current decision:** If you're using UUIDv4, you're fine. If you're using incrementing integers or short strings, that blocks federation.

**Check:** How are IDs generated? `crypto.randomUUID()` is good.

---

## Can Safely Defer

### Cryptographic Implementation

Don't implement signing, key management, or encryption now. Just don't design in ways that prevent adding them:

- No binary formats that can't accommodate new fields
- No assumptions that all nodes share a database
- No trust assumptions that only work locally

### Signal Transport Protocol

Whether signals travel via files, HTTP, WebSocket, or carrier pigeon can be decided later. The envelope format is what matters, and it's fine.

### Model Propagation Mechanics

How Models spread between nodes (pull vs push, attribution, licensing) is a Phase 3 problem. Current Model structure is fine.

### Economic Primitives

Resource accounting, value flows, mutual credit—all Phase 3+. Don't build now.

### Schema for World Model Layer

The extensible entity/schema system can wait. The current flat State works for Phase 1-2.

---

## Anti-Patterns to Avoid

### ❌ Platform Coupling

Don't build dependencies on:

- Specific cloud providers (Firebase, Supabase, etc.)
- Proprietary sync protocols
- Centralized identity providers (OAuth with Google/GitHub as only option)

These create capture vectors that block the civilizational vision.

### ❌ Server-Authoritative State

Don't build a model where "the server" is the source of truth. Even if you have a server, clients should be able to operate independently and sync later.

### ❌ Opaque Binary State

Keep state in human-readable formats (JSON) so users can inspect, export, and migrate. Binary formats create lock-in.

### ❌ Mandatory Network

The system should work fully offline. Network is for federation, not basic operation.

---

## Specific Code Checks

Before Phase 2, verify these aren't problems:

```bash
# Check if node IDs have length/format assumptions
grep -r "node.id" src/ | grep -v "test"

# Check if anything assumes single-node operation
grep -r "DEFAULT_PERSONAL_NODE" src/

# Check ID generation
grep -r "randomUUID\|uuid\|nanoid" src/

# Check for hardcoded file paths
grep -r "data/state.json" src/
```

If these checks reveal assumptions that block federation, fix them in Phase 1 while the codebase is small.

---

## Migration Path Sketch

When it's time to add federation (Phase 2-3):

### Step 1: Cryptographic Identity

```typescript
// Generate keypair on first run
interface NodeIdentity {
  nodeRef: NodeRef;
  publicKey: string;
  privateKey: string; // Stored securely, never exported
}

// NodeRef.id becomes hash of public key for federated nodes
const federatedId = sha256(publicKey).slice(0, 16);
```

### Step 2: Signal Signing

```typescript
function signSignal(event: SignalEvent, privateKey: string): SignedSignalEvent {
  const payload = JSON.stringify({
    eventId: event.eventId,
    nodeId: event.nodeId,
    type: event.type,
    payload: event.payload,
    timestamp: event.timestamp,
  });
  return {
    ...event,
    signature: sign(payload, privateKey),
  };
}
```

### Step 3: Signal Transport

```typescript
// Start simple: file drop in shared folder
// Then: HTTP POST to known endpoints
// Then: Discovery protocol

interface SignalTransport {
  send(event: SignedSignalEvent, target: NodeRef): Promise<Result<void>>;
  receive(): AsyncIterable<SignedSignalEvent>;
}
```

### Step 4: State Sync (Hard Problem)

This is where it gets complex. Options:

- CRDTs (conflict-free merge, complex implementation)
- Append-only logs (simpler, requires compaction)
- Manual merge (user resolves conflicts)

**Recommendation:** Start with append-only signal logs. Internal state doesn't sync—only signals do. Each node maintains its own state, informed by signals from other nodes.

---

## Summary: What to Do Now

| Concern           | Action                                 |
| ----------------- | -------------------------------------- |
| Data sovereignty  | ✅ Keep local-first, don't break       |
| Node ID format    | ⚠️ Verify no length/format assumptions |
| Signal envelope   | ✅ Fine, signature field is additive   |
| ID generation     | ⚠️ Verify globally-unique (UUID)       |
| File paths        | ⚠️ Verify configurable, not hardcoded  |
| Platform coupling | ✅ Avoid, you're fine currently        |

**Bottom line:** The current architecture doesn't block the civilizational vision. Just run the grep checks, fix any hardcoded assumptions, and keep building Phase 1. The extension points are there when needed.
