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

// ═══════════════════════════════════════════════════════════════════════════
// RESULT HELPERS — Cleaner Result construction
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a successful Result.
 *
 * @example
 * ```typescript
 * return ok(newState);  // instead of { ok: true, value: newState }
 * ```
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Creates a failed Result.
 *
 * @example
 * ```typescript
 * return err("Not found");  // instead of { ok: false, error: "Not found" }
 * ```
 */
export function err<E = string>(error: E): Result<never, E> {
  return { ok: false, error };
}
