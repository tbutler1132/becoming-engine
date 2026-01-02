// Server message types for WebSocket communication

import type { State } from "../../../libs/memory/index.js";

export const MESSAGE_TYPES = ["state", "codeChange", "connected"] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export type StateMessage = {
  readonly type: "state";
  readonly payload: State;
};

export type CodeChangeMessage = {
  readonly type: "codeChange";
  readonly organ: string;
  readonly file: string;
  readonly timestamp: number;
};

export type ConnectedMessage = {
  readonly type: "connected";
  readonly timestamp: number;
};

export type ServerMessage = StateMessage | CodeChangeMessage | ConnectedMessage;

/**
 * Maps a file path to its organ identifier.
 * Returns null if the file is not within a known organ.
 */
export function pathToOrgan(filePath: string): string | null {
  const organPatterns: readonly [string, string][] = [
    ["src/libs/memory", "memory"],
    ["src/libs/regulator", "regulator"],
    ["src/libs/sensorium", "sensorium"],
    ["src/apps/cortex", "cortex"],
  ] as const;

  for (const [pattern, organ] of organPatterns) {
    if (filePath.includes(pattern)) {
      return organ;
    }
  }
  return null;
}
