/**
 * Membrane Server — Public API
 *
 * Exports the discovery system for use by other parts of the membrane app.
 */

export { discover } from "./discovery.js";
export { parseReadme, nameFromDirectory } from "./readme-parser.js";
export { scanImports, computeImportedBy } from "./import-parser.js";
export { createWatcher } from "./watcher.js";
export { startServer } from "./ws-server.js";
export type {
  DiscoveryResult,
  Organ,
  Surface,
  ReadmeMetadata,
} from "./types.js";
export type { ImportScanResult } from "./import-parser.js";
export type {
  WatcherEvent,
  WatcherEventType,
  WatcherEmitter,
} from "./watcher.js";
export type { ServerMessage, ServerConfig } from "./ws-server.js";
