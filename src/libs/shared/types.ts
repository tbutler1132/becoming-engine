// Shared type definitions for the Becoming Engine
// Used across multiple organs (Regulator, Sensorium, etc.)

/**
 * Result type for fallible operations.
 * Returns explicit success/error instead of throwing.
 *
 * **Usage:**
 * - All operations that can fail return `Result<T>` instead of throwing
 * - Makes errors explicit and composable without try/catch
 */
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };
