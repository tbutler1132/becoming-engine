// CLI: interpretive surface that orchestrates Sensorium → Regulator → Memory
// The CLI owns no authority; it never mutates State directly.

import { JsonStore } from "../../libs/memory/index.js";
import {
  EPISODE_STATUSES,
  type NodeRef,
  type State,
} from "../../libs/memory/index.js";
import { Regulator } from "../../libs/regulator/index.js";
import { parseCli } from "../../libs/sensorium/index.js";
import * as crypto from "node:crypto";

const ACTIVE_STATUS = EPISODE_STATUSES[0];

function printStatus(state: State, node: NodeRef, regulator: Regulator): void {
  if (regulator.isBaseline(state, node)) {
    // Silence is Success: minimal output.
    console.log(`becoming status ${node.type}:${node.id}`);
    console.log("Silence is Success (baseline).");
    return;
  }

  console.log(`becoming status ${node.type}:${node.id}`);
  console.log("");
  console.log("Active Episodes:");
  for (const e of state.episodes) {
    if (
      e.node.type === node.type &&
      e.node.id === node.id &&
      e.status === ACTIVE_STATUS
    ) {
      console.log(`- ${e.id}: ${e.type} — ${e.objective}`);
    }
  }

  console.log("");
  console.log("Variables:");
  for (const v of state.variables) {
    if (v.node.type === node.type && v.node.id === node.id) {
      console.log(`- ${v.id}: ${v.name} = ${v.status}`);
    }
  }
}

async function main(): Promise<void> {
  const store = new JsonStore();
  const regulator = new Regulator();

  const state = await store.load();

  // argv: node process args → remove node + script path
  const argv = process.argv.slice(2);
  const parsed = parseCli(argv);
  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }

  const command = parsed.value;

  if (command.kind === "status") {
    printStatus(state, command.node, regulator);
    return;
  }

  if (command.kind === "signal") {
    const result = regulator.signal(state, {
      node: command.node,
      variableId: command.variableId,
      status: command.status,
    });

    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }

    await store.save(result.value);
    console.log("Signal applied.");
    return;
  }

  if (command.kind === "act") {
    const actionId = crypto.randomUUID();
    const result = regulator.act(state, {
      actionId,
      node: command.node,
      ...(command.episodeId ? { episodeId: command.episodeId } : {}),
      description: command.description,
    });

    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }

    await store.save(result.value);
    console.log("Action created.");
    return;
  }

  if (command.kind === "open") {
    const episodeId = crypto.randomUUID();
    const openedAt = new Date().toISOString();

    const params =
      command.type === "Stabilize"
        ? {
            episodeId,
            node: command.node,
            type: command.type,
            variableId: command.variableId as string,
            objective: command.objective,
            openedAt,
          }
        : {
            episodeId,
            node: command.node,
            type: command.type,
            objective: command.objective,
            openedAt,
          };

    const result = regulator.openEpisode(state, params);

    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }

    await store.save(result.value);
    console.log(`Episode opened: ${episodeId}`);
    return;
  }

  if (command.kind === "close") {
    const closedAt = new Date().toISOString();
    const noteId = crypto.randomUUID();

    const result = regulator.closeEpisode(state, {
      episodeId: command.episodeId,
      closedAt,
      closureNote: { id: noteId, content: command.noteContent },
    });

    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }

    await store.save(result.value);
    console.log(`Episode closed: ${command.episodeId}`);
    return;
  }
}

main().catch((err: unknown) => {
  console.error("CLI error:", err);
  process.exit(1);
});
