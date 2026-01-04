/**
 * Sensorium Organ — Input Parsing
 *
 * The Sensorium parses external input (CLI arguments, future: natural language)
 * into typed commands and observations. It validates but never executes —
 * that's the CLI's job.
 *
 * @example
 * ```typescript
 * import { parseCli, parseObservation } from '@libs/sensorium';
 *
 * const cmd = parseCli(['open', '--type', 'Explore', '--objective', 'Learn X']);
 * if (cmd.ok && cmd.value.kind === 'open') {
 *   console.log(cmd.value.objective);
 * }
 * ```
 *
 * @module Sensorium
 */
export * from "./types.js";
export * from "./cli.js";
