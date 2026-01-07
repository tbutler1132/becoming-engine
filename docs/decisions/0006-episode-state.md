You’ve found a real design pressure point. If you keep “only one Episode open” _literally_, long-running exploration will either (a) block regulation, or (b) force you to close Episodes prematurely and lose coherence.

The fix is to separate **“one active Episode”** from **“one open Episode.”**

## The right model

### 1) One **Active** Episode at a time

“Active” means: it currently has the system’s attention and is eligible to generate Actions.

This preserves your core principle: no permanent mobilization.

### 2) Multiple **Open** Episodes allowed, but most are **Dormant**

“Open but dormant” means: it’s still conceptually in progress, but it is not pulling attention, not generating actions, and not showing up as pressure.

Dormant Episodes are basically “running in the background.”

This maps to real life:

- You can be running an experiment while living normally.
- You can be waiting on a response while doing other things.

## Add an explicit state: Dormant / Waiting

For Explore Episodes, you add a state like:

- **Active** (we are working on it now)
- **Waiting** (blocked on time/external data; no actions required)
- **Paused** (intentionally parked)
- **Closed** (done; produces Model update)

Only **Active** counts toward your “only one at a time” constraint.

### What “Waiting” feels like (important)

Waiting should feel:

- like a held question
- not like unfinished business
- not like guilt

So it should be visible as _orientation_, not a task.

## How this appears in the UI

### Status lens

- Show **Active Episode** as the outer-field container (your normal episode visualization).
- Show **Waiting Explore** as a small orientation line (top/bottom):
  - “Exploring (waiting): X — next check-in Jan 12”

- Don’t attach it to a Variable unless it truly is Variable-anchored.

### World Model lens

- Explore Episodes list can show:
  - Active / Waiting / Paused
  - next check-in date
  - evidence collected so far

## How you “keep it alive” without actions

For long-running explores, define two lightweight mechanisms:

### A) Check-in cadence (not a task stream)

When you mark an Explore as Waiting, you set:

- **Next check-in date** (or condition)
- optional “What would count as evidence?”

Then the system is quiet until check-in.

This is cybernetic: sample the environment at a sensible frequency.

### B) Evidence accumulation (passive)

Observations/notes can still attach to the Episode while it’s waiting, but nothing forces action.

## What you do when it’s time to resume

At the check-in, you either:

- **Resume** it (it becomes Active, displacing the previously active Episode)
- **Close** it (produce a Model update)
- **Extend waiting** (new check-in)
- **Convert** it (it’s actually a Stabilize need or a different Explore)

## Why this preserves your philosophy

This keeps:

- bounded attention (one active)
- legibility (open vs waiting is explicit)
- continuity (you don’t “lose” explorations)
- anti-capture (no backlog pressure)

And it matches homeorhesis: some growth processes are slow, and that’s normal.

## A tight rule you can adopt

> **Only one Episode may be Active at a time; any number may be Open if they are explicitly in Waiting/Paused states and generate no Actions.**

That resolves your scenario cleanly.

If you want, I can help you decide:

- the exact Episode state machine (Active/Waiting/Paused/Closed)
- how “Waiting” differs from “Paused”
- and what data fields are needed (nextCheckIn, blocker, evidenceRefs, etc.)
