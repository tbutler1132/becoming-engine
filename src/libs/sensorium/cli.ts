// Sensorium organ: minimal CLI input parsing
// Converts raw argv into typed commands for the CLI to orchestrate.
// Also produces structured Observations for the new sensing flow.

import {
  DEFAULT_PERSONAL_NODE,
  EPISODE_TYPES,
  NODE_TYPES,
  NOTE_TAGS,
  VARIABLE_STATUSES,
} from "../memory/index.js";
import type {
  EpisodeType,
  NodeRef,
  NodeType,
  NoteTag,
  VariableStatus,
} from "../memory/index.js";
import type { Observation, SensoriumResult } from "./types.js";

export type SensoriumCommand =
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
    }
  | {
      kind: "close";
      node: NodeRef;
      episodeId: string;
      noteContent: string;
    };

export type SensoriumParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

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

export function parseNodeRef(input: string): SensoriumParseResult<NodeRef> {
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

export function parseCli(
  argv: readonly string[],
): SensoriumParseResult<SensoriumCommand> {
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

    return {
      ok: true,
      value: {
        kind: "open",
        node,
        type: typeRaw,
        ...(variableId ? { variableId } : {}),
        objective,
      },
    };
  }

  if (command === "close") {
    const episodeId = getFlagValue(argv, "--episodeId");
    const noteContent = getFlagValue(argv, "--note");

    if (!episodeId) {
      return { ok: false, error: "Missing required flag: --episodeId" };
    }
    if (!noteContent || noteContent.trim().length === 0) {
      return { ok: false, error: "Missing required flag: --note" };
    }

    return {
      ok: true,
      value: {
        kind: "close",
        node,
        episodeId,
        noteContent,
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
 * - Returns: SensoriumResult<Observation> with parsed observation or error
 * - Validates: All inputs are validated before producing Observation
 * - Error handling: Invalid input returns error, never silently mutates ontology
 *
 * Usage:
 *   observe signal --variableId v1 --status InRange
 *   observe note --content "Some observation"
 *   observe episode --type Explore --objective "Learn X"
 */
export function parseObservation(
  argv: readonly string[],
): SensoriumResult<Observation> {
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
): SensoriumResult<Observation> {
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
): SensoriumResult<Observation> {
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
): SensoriumResult<Observation> {
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
