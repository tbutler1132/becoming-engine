// Cortex CLI: interpretive surface that orchestrates Sensorium → Regulator → Memory
// Cortex owns no authority; it never mutates State directly.

import { JsonStore } from "../../libs/memory/index.js";
import {
  DEFAULT_PERSONAL_NODE,
  EPISODE_STATUSES,
  type NodeRef,
  type State,
} from "../../libs/memory/index.js";
import { Regulator } from "../../libs/regulator/index.js";
import { parseCli } from "../../libs/sensorium/index.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];

function isNodeInBaseline(state: State, node: NodeRef): boolean {
  const hasActiveEpisode = state.episodes.some(
    (e) =>
      e.node.type === node.type &&
      e.node.id === node.id &&
      e.status === ACTIVE_STATUS,
  );
  return !hasActiveEpisode;
}

function printStatus(state: State, node: NodeRef): void {
  if (isNodeInBaseline(state, node)) {
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
    printStatus(state, command.node ?? DEFAULT_PERSONAL_NODE);
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
    const result = regulator.act(state, {
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
}

main().catch((err: unknown) => {
  console.error("Cortex CLI error:", err);
  process.exit(1);
});
