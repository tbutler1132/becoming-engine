// CLI: interpretive surface that orchestrates Sensorium → Membrane → Regulator → Memory
// The CLI owns no authority; it never mutates State directly.
// Observations from Sensorium are interpreted into Regulator mutations here.
// Episode mutations are gated through the Membrane before reaching the Regulator.

import { JsonStore } from "../../libs/memory/index.js";
import type { EpisodeType, NodeRef, State } from "../../libs/memory/index.js";
import { checkEpisodeConstraints } from "../../libs/membrane/index.js";
import type {
  MembraneResult,
  MembraneWarning,
} from "../../libs/membrane/index.js";
import { getStatusData, Regulator } from "../../libs/regulator/index.js";
import type { Result } from "../../libs/regulator/index.js";
import { parseCli, parseObservation } from "../../libs/sensorium/index.js";
import type { Observation } from "../../libs/sensorium/index.js";
import { formatStatus } from "./format.js";
import * as crypto from "node:crypto";

/**
 * Result of checking Membrane constraints for episode opening.
 * Contains the decision and any warnings/exceptions to log.
 */
interface MembraneCheckResult {
  proceed: boolean;
  /** Warnings to log as exceptions after mutation succeeds */
  warningsToLog: MembraneWarning[];
  /** Block override to log as exception after mutation succeeds */
  blockOverride?: { modelId: string; justification: string };
}

/**
 * Checks Membrane constraints for episode opening.
 *
 * @param state Current state
 * @param node Node to check
 * @param episodeType Type of episode being opened
 * @param override Optional justification for overriding a block
 * @returns MembraneCheckResult indicating whether to proceed and what to log
 */
function checkMembraneForEpisode(
  state: State,
  node: NodeRef,
  episodeType: EpisodeType,
  override?: string,
): MembraneCheckResult {
  const result: MembraneResult = checkEpisodeConstraints(state, {
    node,
    episodeType,
  });

  if (result.decision === "block") {
    // Check if override is provided and allowed
    if (override && override.trim().length > 0) {
      if (result.exceptionAllowed) {
        console.warn(
          `Override applied for [${result.modelId}]: ${result.reason}`,
        );
        console.warn(`Justification: ${override}`);
        return {
          proceed: true,
          warningsToLog: [],
          blockOverride: { modelId: result.modelId, justification: override },
        };
      } else {
        console.error(
          `Blocked by Normative Model [${result.modelId}]: ${result.reason}`,
        );
        console.error("This constraint does not allow exceptions.");
        process.exit(1);
      }
    }

    // No override provided, show how to override if allowed
    console.error(
      `Blocked by Normative Model [${result.modelId}]: ${result.reason}`,
    );
    if (result.exceptionAllowed) {
      console.error(
        'To override, add: --override "Your justification for proceeding"',
      );
    }
    process.exit(1);
  }

  if (result.decision === "warn") {
    // Collect warnings that allow exceptions
    const warningsToLog = result.warnings.filter((w) => w.exceptionAllowed);

    for (const warning of result.warnings) {
      console.warn(`Warning [${warning.modelId}]: ${warning.statement}`);
    }

    return { proceed: true, warningsToLog };
  }

  return { proceed: true, warningsToLog: [] };
}

/**
 * Logs membrane exceptions after a mutation succeeds.
 */
async function logMembraneExceptions(
  state: State,
  regulator: Regulator,
  store: JsonStore,
  mutationId: string,
  checkResult: MembraneCheckResult,
): Promise<State> {
  let currentState = state;

  // Log block override if present
  if (checkResult.blockOverride) {
    const exceptionId = crypto.randomUUID();
    const result = regulator.logException(currentState, {
      exceptionId,
      modelId: checkResult.blockOverride.modelId,
      originalDecision: "block",
      justification: checkResult.blockOverride.justification,
      mutationType: "episode",
      mutationId,
      createdAt: new Date().toISOString(),
    });
    if (result.ok) {
      currentState = result.value;
    }
  }

  // Log warnings as exceptions
  for (const warning of checkResult.warningsToLog) {
    const exceptionId = crypto.randomUUID();
    const result = regulator.logException(currentState, {
      exceptionId,
      modelId: warning.modelId,
      originalDecision: "warn",
      justification: "Acknowledged warning and proceeded",
      mutationType: "episode",
      mutationId,
      createdAt: new Date().toISOString(),
    });
    if (result.ok) {
      currentState = result.value;
    }
  }

  // Save if any exceptions were logged
  if (checkResult.blockOverride || checkResult.warningsToLog.length > 0) {
    await store.save(currentState);
  }

  return currentState;
}

function printStatus(state: State, node: NodeRef): void {
  const data = getStatusData(state, node);
  console.log(formatStatus(data));
}

/**
 * Result of interpreting an observation, includes both state and membrane context.
 */
interface InterpretResult {
  result: Result<State>;
  episodeId?: string;
  membraneCheck?: MembraneCheckResult;
}

/**
 * Interprets an Observation into a Regulator mutation.
 *
 * **Intent:** The CLI interprets what Sensorium sensed and calls the
 * appropriate Regulator method. This maintains the invariant that
 * "Sensorium never triggers Actions directly" — the CLI does.
 *
 * **Contract:**
 * - Returns: InterpretResult with mutation result and membrane context
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
): InterpretResult {
  switch (observation.type) {
    case "variableProxySignal":
      return {
        result: regulator.signal(state, {
          node: observation.node,
          variableId: observation.variableId,
          status: observation.status,
        }),
      };

    case "freeformNote": {
      const noteId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      return {
        result: regulator.createNote(state, {
          noteId,
          content: observation.content,
          createdAt,
          ...(observation.tags ? { tags: observation.tags } : {}),
        }),
      };
    }

    case "episodeProposal": {
      // Gate through Membrane before opening episode (observe flow has no override)
      const membraneCheck = checkMembraneForEpisode(
        state,
        observation.node,
        observation.episodeType,
      );

      const episodeId = crypto.randomUUID();
      const openedAt = new Date().toISOString();

      if (observation.episodeType === "Stabilize") {
        return {
          result: regulator.openEpisode(state, {
            episodeId,
            node: observation.node,
            type: observation.episodeType,
            variableId: observation.variableId as string,
            objective: observation.objective,
            openedAt,
          }),
          episodeId,
          membraneCheck,
        };
      }

      return {
        result: regulator.openEpisode(state, {
          episodeId,
          node: observation.node,
          type: observation.episodeType,
          objective: observation.objective,
          openedAt,
        }),
        episodeId,
        membraneCheck,
      };
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
    const interpreted = interpretObservation(observation, state, regulator);

    if (!interpreted.result.ok) {
      console.error(interpreted.result.error);
      process.exit(1);
    }

    let finalState = interpreted.result.value;
    await store.save(finalState);

    // Log membrane exceptions if this was an episode proposal
    if (interpreted.membraneCheck && interpreted.episodeId) {
      finalState = await logMembraneExceptions(
        finalState,
        regulator,
        store,
        interpreted.episodeId,
        interpreted.membraneCheck,
      );
    }

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
    // Gate through Membrane before opening episode (with optional override)
    const membraneCheck = checkMembraneForEpisode(
      state,
      command.node,
      command.type,
      command.override,
    );

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

    let finalState = result.value;
    await store.save(finalState);

    // Log membrane exceptions after successful mutation
    finalState = await logMembraneExceptions(
      finalState,
      regulator,
      store,
      episodeId,
      membraneCheck,
    );

    console.log(`Episode opened: ${episodeId}`);
    return;
  }

  if (command.kind === "close") {
    const closedAt = new Date().toISOString();
    const noteId = crypto.randomUUID();

    // Build modelUpdates if model was provided
    const modelUpdates = command.model
      ? [
          {
            id: crypto.randomUUID(),
            type: command.model.type,
            statement: command.model.statement,
          },
        ]
      : undefined;

    const result = regulator.closeEpisode(state, {
      episodeId: command.episodeId,
      closedAt,
      closureNote: { id: noteId, content: command.noteContent },
      ...(modelUpdates ? { modelUpdates } : {}),
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
