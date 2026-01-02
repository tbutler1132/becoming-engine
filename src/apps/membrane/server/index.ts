// Membrane server entry point: WebSocket relay + file watchers

import { WebSocketServer, WebSocket } from "ws";
import { resolve } from "node:path";
import { createWatcher } from "./watcher.js";
import type { ServerMessage } from "./types.js";

const PORT = 8081;
const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../");

const STATE_FILE = resolve(PROJECT_ROOT, "data/state.json");
const SOURCE_GLOBS = [
  resolve(PROJECT_ROOT, "src/libs/**/*.ts"),
  resolve(PROJECT_ROOT, "src/apps/cortex/**/*.ts"),
];

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });
const clients = new Set<WebSocket>();

console.log(`[Membrane] WebSocket server listening on ws://localhost:${PORT}`);

// Broadcast message to all connected clients
function broadcast(message: ServerMessage): void {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Handle new connections
wss.on("connection", (ws: WebSocket) => {
  clients.add(ws);
  console.log(`[Membrane] Client connected (${clients.size} total)`);

  // Send connection confirmation
  ws.send(
    JSON.stringify({
      type: "connected",
      timestamp: Date.now(),
    } satisfies ServerMessage),
  );

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[Membrane] Client disconnected (${clients.size} total)`);
  });

  ws.on("error", (error: Error) => {
    console.error("[Membrane] WebSocket error:", error.message);
    clients.delete(ws);
  });
});

// Start file watchers
const stopWatching = createWatcher({
  stateFilePath: STATE_FILE,
  sourceGlobs: SOURCE_GLOBS,
  onMessage: (message: ServerMessage) => {
    if (message.type === "state") {
      console.log("[Membrane] State change detected, broadcasting...");
    } else if (message.type === "codeChange") {
      console.log(
        `[Membrane] Code change in ${message.organ}: ${message.file}`,
      );
    }
    broadcast(message);
  },
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Membrane] Shutting down...");
  stopWatching();
  wss.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopWatching();
  wss.close();
  process.exit(0);
});
