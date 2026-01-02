// Sensorium organ: minimal CLI input parsing
// Converts raw argv into typed commands for the CLI to orchestrate.

import {
  DEFAULT_PERSONAL_NODE,
  EPISODE_TYPES,
  NODE_TYPES,
  VARIABLE_STATUSES,
} from "../memory/index.js";
import type {
  EpisodeType,
  NodeRef,
  NodeType,
  VariableStatus,
} from "../memory/index.js";

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
    error: `Unknown command '${command}'. Expected one of: status, signal, act, open, close`,
  };
}
