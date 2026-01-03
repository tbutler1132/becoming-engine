// CLI input parsing: converts raw argv into typed commands.
// Exports both CliCommand (direct regulator commands) and Observation (sensed input).
// The CLI orchestrator routes these to the appropriate subsystem:
//   - CliCommand → Membrane → Regulator (direct mutation path)
//   - Observation → interpreted by CLI → Regulator (sensing flow)

import {
  DEFAULT_PERSONAL_NODE,
  EPISODE_TYPES,
  MODEL_TYPES,
  NODE_TYPES,
  NOTE_TAGS,
  VARIABLE_STATUSES,
} from "../memory/index.js";
import type {
  EpisodeType,
  ModelType,
  NodeRef,
  NodeType,
  NoteTag,
  VariableStatus,
} from "../memory/index.js";
import type { Observation, Result } from "./types.js";

export type CliCommand =
  | { kind: "status"; node: NodeRef }
  | {
      kind: "signal";
      node: NodeRef;
      variableId: string;
      status: VariableStatus;
    }
  | {
      kind: "act";
      node: NodeRef;
      episodeId?: string;
      description: string;
    }
  | {
      kind: "open";
      node: NodeRef;
      type: EpisodeType;
      variableId?: string;
      objective: string;
      /** Override justification for bypassing a Membrane block */
      override?: string;
    }
  | {
      kind: "close";
      node: NodeRef;
      episodeId: string;
      noteContent: string;
      /** Optional model for Explore episode closure (type + statement) */
      model?: { type: ModelType; statement: string };
    };

function isNodeType(value: string): value is NodeType {
  return (NODE_TYPES as readonly string[]).includes(value);
}

function isEpisodeType(value: string): value is EpisodeType {
  return (EPISODE_TYPES as readonly string[]).includes(value);
}

function isNoteTag(value: string): value is NoteTag {
  return (NOTE_TAGS as readonly string[]).includes(value);
}

function isVariableStatus(value: string): value is VariableStatus {
  return (VARIABLE_STATUSES as readonly string[]).includes(value);
}

function isModelType(value: string): value is ModelType {
  return (MODEL_TYPES as readonly string[]).includes(value);
}

export function parseNodeRef(input: string): Result<NodeRef> {
  const parts = input.split(":");
  if (parts.length !== 2) {
    return {
      ok: false,
      error: `Invalid node format '${input}'. Expected 'Type:Id' (e.g., Personal:personal)`,
    };
  }

  const [typeRaw, idRaw] = parts;
  const type = (typeRaw ?? "").trim();
  const id = (idRaw ?? "").trim();

  if (!isNodeType(type)) {
    return {
      ok: false,
      error: `Invalid node type '${type}'. Expected one of: ${NODE_TYPES.join(", ")}`,
    };
  }

  if (id.length === 0) {
    return { ok: false, error: "Node id cannot be empty" };
  }

  return { ok: true, value: { type, id } };
}

function getFlagValue(
  argv: readonly string[],
  flag: string,
): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx < 0) return undefined;
  const value = argv[idx + 1];
  if (!value) return undefined;
  return value;
}

export function parseCli(argv: readonly string[]): Result<CliCommand> {
  // Expect argv to be process.argv slice starting at the command, e.g. ["status", "--node", ...]
  const [commandRaw] = argv;
  const command = (commandRaw ?? "status").trim();

  // Node handling
  const nodeFlag = getFlagValue(argv, "--node");
  let node: NodeRef = DEFAULT_PERSONAL_NODE;
  if (nodeFlag) {
    const parsed = parseNodeRef(nodeFlag);
    if (!parsed.ok) return parsed;
    node = parsed.value;
  } else {
    // If user explicitly asks for org status, allow shorthand: command "status:org"
    // (Optional; keep minimal. Default remains Personal.)
    node = DEFAULT_PERSONAL_NODE;
  }

  if (command === "status") {
    return { ok: true, value: { kind: "status", node } };
  }

  if (command === "signal") {
    const variableId = getFlagValue(argv, "--variableId");
    const statusRaw = getFlagValue(argv, "--status");

    if (!variableId) {
      return { ok: false, error: "Missing required flag: --variableId" };
    }
    if (!statusRaw) {
      return { ok: false, error: "Missing required flag: --status" };
    }

    const status = statusRaw.trim();
    if (!(VARIABLE_STATUSES as readonly string[]).includes(status)) {
      return {
        ok: false,
        error: `Invalid status '${status}'. Expected one of: ${VARIABLE_STATUSES.join(", ")}`,
      };
    }

    return {
      ok: true,
      value: {
        kind: "signal",
        node,
        variableId,
        status: status as VariableStatus,
      },
    };
  }

  if (command === "act") {
    const episodeId = getFlagValue(argv, "--episodeId");
    const description = getFlagValue(argv, "--description");

    if (!description || description.trim().length === 0) {
      return { ok: false, error: "Missing required flag: --description" };
    }

    return {
      ok: true,
      value: {
        kind: "act",
        node,
        ...(episodeId ? { episodeId } : {}),
        description,
      },
    };
  }

  if (command === "open") {
    const typeRaw = getFlagValue(argv, "--type");
    const variableId = getFlagValue(argv, "--variableId");
    const objective = getFlagValue(argv, "--objective");

    if (!typeRaw) {
      return { ok: false, error: "Missing required flag: --type" };
    }
    if (!isEpisodeType(typeRaw)) {
      return {
        ok: false,
        error: `Invalid episode type '${typeRaw}'. Expected one of: ${EPISODE_TYPES.join(", ")}`,
      };
    }
    if (!objective || objective.trim().length === 0) {
      return { ok: false, error: "Missing required flag: --objective" };
    }
    // Stabilize requires variableId
    if (typeRaw === "Stabilize" && !variableId) {
      return {
        ok: false,
        error: "Stabilize episodes require --variableId",
      };
    }

    // Optional override flag for bypassing Membrane blocks
    const override = getFlagValue(argv, "--override");

    return {
      ok: true,
      value: {
        kind: "open",
        node,
        type: typeRaw,
        ...(variableId ? { variableId } : {}),
        objective,
        ...(override ? { override } : {}),
      },
    };
  }

  if (command === "close") {
    const episodeId = getFlagValue(argv, "--episodeId");
    const noteContent = getFlagValue(argv, "--note");
    const modelTypeRaw = getFlagValue(argv, "--model-type");
    const modelStatement = getFlagValue(argv, "--model-statement");

    if (!episodeId) {
      return { ok: false, error: "Missing required flag: --episodeId" };
    }
    if (!noteContent || noteContent.trim().length === 0) {
      return { ok: false, error: "Missing required flag: --note" };
    }

    // Validate model flags: both or neither must be provided
    if (modelTypeRaw && !modelStatement) {
      return {
        ok: false,
        error: "--model-type requires --model-statement",
      };
    }
    if (modelStatement && !modelTypeRaw) {
      return {
        ok: false,
        error: "--model-statement requires --model-type",
      };
    }

    // Validate model type if provided
    let model: { type: ModelType; statement: string } | undefined;
    if (modelTypeRaw && modelStatement) {
      if (!isModelType(modelTypeRaw)) {
        return {
          ok: false,
          error: `Invalid model type '${modelTypeRaw}'. Expected one of: ${MODEL_TYPES.join(", ")}`,
        };
      }
      if (modelStatement.trim().length === 0) {
        return { ok: false, error: "Model statement cannot be empty" };
      }
      model = { type: modelTypeRaw, statement: modelStatement };
    }

    return {
      ok: true,
      value: {
        kind: "close",
        node,
        episodeId,
        noteContent,
        ...(model ? { model } : {}),
      },
    };
  }

  return {
    ok: false,
    error: `Unknown command '${command}'. Expected one of: status, signal, act, open, close, observe`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OBSERVATION PARSING — Structured observations from user input
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parses CLI arguments into a structured Observation.
 *
 * **Intent:** Sensorium produces Observations (what was sensed from input).
 * The CLI then interprets these Observations into Regulator mutations.
 *
 * **Contract:**
 * - Returns: Result<Observation> with parsed observation or error
 * - Validates: All inputs are validated before producing Observation
 * - Error handling: Invalid input returns error, never silently mutates ontology
 *
 * Usage:
 *   observe signal --variableId v1 --status InRange
 *   observe note --content "Some observation"
 *   observe episode --type Explore --objective "Learn X"
 */
export function parseObservation(argv: readonly string[]): Result<Observation> {
  // Expect argv like ["observe", "signal", "--variableId", "v1", "--status", "InRange"]
  const [commandRaw, subcommandRaw] = argv;
  const command = (commandRaw ?? "").trim();

  if (command !== "observe") {
    return {
      ok: false,
      error: `Expected 'observe' command, got '${command}'`,
    };
  }

  const subcommand = (subcommandRaw ?? "").trim();

  // Node handling (default to personal node)
  const nodeFlag = getFlagValue(argv, "--node");
  let node: NodeRef = DEFAULT_PERSONAL_NODE;
  if (nodeFlag) {
    const parsed = parseNodeRef(nodeFlag);
    if (!parsed.ok) return parsed;
    node = parsed.value;
  }

  if (subcommand === "signal") {
    return parseVariableProxySignal(argv, node);
  }

  if (subcommand === "note") {
    return parseFreeformNote(argv, node);
  }

  if (subcommand === "episode") {
    return parseEpisodeProposal(argv, node);
  }

  return {
    ok: false,
    error: `Unknown observe subcommand '${subcommand}'. Expected one of: signal, note, episode`,
  };
}

function parseVariableProxySignal(
  argv: readonly string[],
  node: NodeRef,
): Result<Observation> {
  const variableId = getFlagValue(argv, "--variableId");
  const statusRaw = getFlagValue(argv, "--status");

  if (!variableId || variableId.trim().length === 0) {
    return { ok: false, error: "Missing required flag: --variableId" };
  }

  if (!statusRaw) {
    return { ok: false, error: "Missing required flag: --status" };
  }

  const status = statusRaw.trim();
  if (!isVariableStatus(status)) {
    return {
      ok: false,
      error: `Invalid status '${status}'. Expected one of: ${VARIABLE_STATUSES.join(", ")}`,
    };
  }

  return {
    ok: true,
    value: {
      type: "variableProxySignal",
      node,
      variableId,
      status,
    },
  };
}

function parseFreeformNote(
  argv: readonly string[],
  node: NodeRef,
): Result<Observation> {
  const content = getFlagValue(argv, "--content");
  const tagsRaw = getFlagValue(argv, "--tags");

  if (!content || content.trim().length === 0) {
    return { ok: false, error: "Missing required flag: --content" };
  }

  // Parse optional tags (comma-separated)
  let tags: NoteTag[] | undefined;
  if (tagsRaw) {
    const tagStrings = tagsRaw.split(",").map((t) => t.trim());
    const validatedTags: NoteTag[] = [];
    for (const tag of tagStrings) {
      if (!isNoteTag(tag)) {
        return {
          ok: false,
          error: `Invalid tag '${tag}'. Expected one of: ${NOTE_TAGS.join(", ")}`,
        };
      }
      validatedTags.push(tag);
    }
    tags = validatedTags;
  }

  return {
    ok: true,
    value: {
      type: "freeformNote",
      node,
      content,
      ...(tags && tags.length > 0 ? { tags } : {}),
    },
  };
}

function parseEpisodeProposal(
  argv: readonly string[],
  node: NodeRef,
): Result<Observation> {
  const typeRaw = getFlagValue(argv, "--type");
  const variableId = getFlagValue(argv, "--variableId");
  const objective = getFlagValue(argv, "--objective");

  if (!typeRaw) {
    return { ok: false, error: "Missing required flag: --type" };
  }

  if (!isEpisodeType(typeRaw)) {
    return {
      ok: false,
      error: `Invalid episode type '${typeRaw}'. Expected one of: ${EPISODE_TYPES.join(", ")}`,
    };
  }

  if (!objective || objective.trim().length === 0) {
    return { ok: false, error: "Missing required flag: --objective" };
  }

  // Stabilize requires variableId
  if (typeRaw === "Stabilize" && !variableId) {
    return {
      ok: false,
      error: "Stabilize episodes require --variableId",
    };
  }

  return {
    ok: true,
    value: {
      type: "episodeProposal",
      node,
      episodeType: typeRaw,
      ...(variableId ? { variableId } : {}),
      objective,
    },
  };
}
