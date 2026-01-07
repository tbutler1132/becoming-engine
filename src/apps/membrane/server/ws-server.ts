/**
 * WebSocket Server
 *
 * Serves discovery data to clients and pushes updates on file changes.
 */

import { WebSocketServer, WebSocket } from "ws";
import { resolve } from "path";
import { discover } from "./discovery.js";
import { createWatcher, type WatcherEvent } from "./watcher.js";
import type { DiscoveryResult } from "./types.js";

/**
 * Messages sent from server to client.
 */
export type ServerMessage =
  | { type: "discovery"; data: DiscoveryResult }
  | { type: "change"; event: WatcherEvent }
  | { type: "error"; message: string };

/**
 * Configuration for the WebSocket server.
 */
export interface ServerConfig {
  port: number;
  basePath: string;
}

const DEFAULT_CONFIG: ServerConfig = {
  port: 3030,
  basePath: resolve(import.meta.dirname, "../../../../"),
};

/**
 * Starts the Membrane WebSocket server.
 */
export function startServer(config: Partial<ServerConfig> = {}): void {
  const { port, basePath } = { ...DEFAULT_CONFIG, ...config };

  console.log(`[Membrane] Starting server...`);
  console.log(`[Membrane] Base path: ${basePath}`);
  console.log(`[Membrane] Port: ${port}`);

  const wss = new WebSocketServer({ port });
  const clients = new Set<WebSocket>();

  // Initial discovery
  let latestDiscovery: DiscoveryResult | null = null;

  async function runDiscovery(): Promise<void> {
    try {
      latestDiscovery = await discover(basePath);
      console.log(
        `[Membrane] Discovery complete: ${latestDiscovery.organs.length} organs, ${latestDiscovery.surfaces.length} surfaces`,
      );
    } catch (error) {
      console.error(`[Membrane] Discovery failed:`, error);
    }
  }

  // Run initial discovery
  void runDiscovery();

  // Set up file watcher
  const watcher = createWatcher(basePath);

  watcher.on("change", (event) => {
    console.log(
      `[Membrane] File ${event.type}: ${event.path}` +
        (event.moduleId ? ` (${event.moduleType}: ${event.moduleId})` : ""),
    );

    // Broadcast change to all clients
    const message: ServerMessage = { type: "change", event };
    broadcast(message);

    // Re-run discovery for significant changes
    if (isSignificantChange(event)) {
      void runDiscovery().then(() => {
        if (latestDiscovery) {
          broadcast({ type: "discovery", data: latestDiscovery });
        }
      });
    }
  });

  // Handle new connections
  wss.on("connection", (ws) => {
    console.log(`[Membrane] Client connected (${clients.size + 1} total)`);
    clients.add(ws);

    // Send current discovery data
    if (latestDiscovery) {
      send(ws, { type: "discovery", data: latestDiscovery });
    }

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`[Membrane] Client disconnected (${clients.size} remaining)`);
    });

    ws.on("error", (error) => {
      console.error(`[Membrane] Client error:`, error);
      clients.delete(ws);
    });
  });

  wss.on("listening", () => {
    console.log(
      `[Membrane] WebSocket server listening on ws://localhost:${port}`,
    );
    console.log(`[Membrane] Watching for file changes...`);
  });

  function send(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  function broadcast(message: ServerMessage): void {
    const json = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    }
  }
}

/**
 * Determines if a change should trigger a full re-discovery.
 * Significant changes include new/deleted files and README changes.
 */
function isSignificantChange(event: WatcherEvent): boolean {
  // New or deleted files always trigger re-discovery
  if (event.type === "add" || event.type === "unlink") {
    return true;
  }

  // README changes affect metadata
  if (event.path.endsWith("README.md")) {
    return true;
  }

  // index.ts changes might affect exports/imports
  if (event.path.endsWith("index.ts")) {
    return true;
  }

  // Regular .ts file changes within a module don't need full re-discovery
  return false;
}

/**
 * CLI entry point.
 * Run with: npx tsx src/apps/membrane/server/ws-server.ts
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
