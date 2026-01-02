// CLI: interpretive surface that orchestrates Sensorium → Regulator → Memory
// The CLI owns no authority; it never mutates State directly.
// Observations from Sensorium are interpreted into Regulator mutations here.

import { JsonStore } from "../../libs/memory/index.js";
import type { NodeRef, State } from "../../libs/memory/index.js";
import { getStatusData, Regulator } from "../../libs/regulator/index.js";
import type { Result } from "../../libs/regulator/index.js";
import { parseCli, parseObservation } from "../../libs/sensorium/index.js";
import type { Observation } from "../../libs/sensorium/index.js";
import { formatStatus } from "./format.js";
import * as crypto from "node:crypto";

function printStatus(state: State, node: NodeRef): void {
  const data = getStatusData(state, node);
  console.log(formatStatus(data));
}

/**
 * Interprets an Observation into a Regulator mutation.
 *
 * **Intent:** The CLI interprets what Sensorium sensed and calls the
 * appropriate Regulator method. This maintains the invariant that
 * "Sensorium never triggers Actions directly" — the CLI does.
 *
 * **Contract:**
 * - Returns: Result<State> with new state if mutation succeeds
 * - Parameters: observation (what was sensed), state (current), regulator
 * - Maps observation types to Regulator methods:
 *   - variableProxySignal → signal()
 *   - freeformNote → createNote()
 *   - episodeProposal → openEpisode()
 */
function interpretObservation(
  observation: Observation,
  state: State,
  regulator: Regulator,
): Result<State> {
  switch (observation.type) {
    case "variableProxySignal":
      return regulator.signal(state, {
        node: observation.node,
        variableId: observation.variableId,
        status: observation.status,
      });

    case "freeformNote": {
      const noteId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      return regulator.createNote(state, {
        noteId,
        content: observation.content,
        createdAt,
        ...(observation.tags ? { tags: observation.tags } : {}),
      });
    }

    case "episodeProposal": {
      const episodeId = crypto.randomUUID();
      const openedAt = new Date().toISOString();

      if (observation.episodeType === "Stabilize") {
        return regulator.openEpisode(state, {
          episodeId,
          node: observation.node,
          type: observation.episodeType,
          variableId: observation.variableId as string,
          objective: observation.objective,
          openedAt,
        });
      }

      return regulator.openEpisode(state, {
        episodeId,
        node: observation.node,
        type: observation.episodeType,
        objective: observation.objective,
        openedAt,
      });
    }
  }
}

async function main(): Promise<void> {
  const store = new JsonStore();
  const regulator = new Regulator();

  const state = await store.load();

  // argv: node process args → remove node + script path
  const argv = process.argv.slice(2);

  // Handle "observe" command through the new Observation flow
  if (argv[0] === "observe") {
    const observationResult = parseObservation(argv);
    if (!observationResult.ok) {
      console.error(observationResult.error);
      process.exit(1);
    }

    const observation = observationResult.value;
    const result = interpretObservation(observation, state, regulator);

    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }

    await store.save(result.value);

    // Confirmation message based on observation type
    switch (observation.type) {
      case "variableProxySignal":
        console.log(
          `Observation processed: signal ${observation.variableId} → ${observation.status}`,
        );
        break;
      case "freeformNote":
        console.log("Observation processed: note created.");
        break;
      case "episodeProposal":
        console.log(
          `Observation processed: ${observation.episodeType} episode opened.`,
        );
        break;
    }
    return;
  }

  // Legacy command flow (backward compatible)
  const parsed = parseCli(argv);
  if (!parsed.ok) {
    console.error(parsed.error);
    process.exit(1);
  }

  const command = parsed.value;

  if (command.kind === "status") {
    printStatus(state, command.node);
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
