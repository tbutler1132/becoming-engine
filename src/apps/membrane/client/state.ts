// Client state manager: WebSocket connection and state derivation

import type {
  State,
  Variable,
  Episode,
  NodeRef,
} from "../../../libs/memory/index.js";
import type { ServerMessage } from "../server/types.js";
import type { ClientState, NodeState, OrganPulse } from "./types.js";
import { INITIAL_CLIENT_STATE } from "./types.js";

export type StateChangeHandler = (state: ClientState) => void;

const PULSE_DECAY_MS = 3000;
const WS_URL = "ws://localhost:8081";

function isNodeMatch(a: NodeRef, b: NodeRef): boolean {
  return a.type === b.type && a.id === b.id;
}

function deriveNodeState(
  state: State,
  nodeType: "Personal" | "Org",
  nodeId: string,
): NodeState {
  const node: NodeRef = { type: nodeType, id: nodeId };

  const variables = state.variables.filter((v: Variable) =>
    isNodeMatch(v.node, node),
  );

  const activeEpisodes = state.episodes.filter(
    (e: Episode) => isNodeMatch(e.node, node) && e.status === "Active",
  );

  return {
    node,
    variables,
    activeEpisodes,
    isBaseline: activeEpisodes.length === 0,
  };
}

function pruneOldPulses(
  pulses: readonly OrganPulse[],
  now: number,
): OrganPulse[] {
  return pulses
    .filter((p) => now - p.timestamp < PULSE_DECAY_MS)
    .map((p) => ({
      ...p,
      intensity: 1 - (now - p.timestamp) / PULSE_DECAY_MS,
    }));
}

export class StateManager {
  private state: ClientState = INITIAL_CLIENT_STATE;
  private ws: WebSocket | null = null;
  private handlers: Set<StateChangeHandler> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = (): void => {
        this.updateState({ connected: true });
        console.log("[Membrane] Connected to server");
      };

      this.ws.onclose = (): void => {
        this.updateState({ connected: false });
        console.log("[Membrane] Disconnected, reconnecting in 2s...");
        this.scheduleReconnect();
      };

      this.ws.onerror = (): void => {
        // Error will trigger close, which handles reconnect
      };

      this.ws.onmessage = (event: MessageEvent): void => {
        try {
          const message = JSON.parse(event.data as string) as ServerMessage;
          this.handleMessage(message);
        } catch {
          // Ignore malformed messages
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  private handleMessage(message: ServerMessage): void {
    switch (message.type) {
      case "state":
        this.handleStateUpdate(message.payload);
        break;
      case "codeChange":
        this.handleCodeChange(message.organ, message.timestamp);
        break;
      case "connected":
        // Already handled via onopen
        break;
    }
  }

  private handleStateUpdate(serverState: State): void {
    const personalNode = deriveNodeState(serverState, "Personal", "personal");
    const orgNode = deriveNodeState(serverState, "Org", "org");

    this.updateState({
      personalNode,
      orgNode,
    });
  }

  private handleCodeChange(organId: string, timestamp: number): void {
    const now = Date.now();
    const prunedPulses = pruneOldPulses(this.state.organPulses, now);

    const newPulse: OrganPulse = {
      organId,
      timestamp,
      intensity: 1,
    };

    this.updateState({
      organPulses: [...prunedPulses, newPulse],
    });
  }

  private updateState(partial: Partial<ClientState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyHandlers();
  }

  private notifyHandlers(): void {
    for (const handler of this.handlers) {
      handler(this.state);
    }
  }

  subscribe(handler: StateChangeHandler): () => void {
    this.handlers.add(handler);
    // Immediately call with current state
    handler(this.state);

    return (): void => {
      this.handlers.delete(handler);
    };
  }

  getState(): ClientState {
    return this.state;
  }

  setViewLevel(level: ClientState["viewLevel"]): void {
    this.updateState({ viewLevel: level });
  }

  setFocusedOrgan(organId: string | null): void {
    this.updateState({ focusedOrgan: organId });
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
    this.ws = null;
  }
}
