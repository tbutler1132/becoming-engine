// Shared logger infrastructure
// Used by Memory and Regulator organs for optional logging

/**
 * Logger interface for optional observability.
 * Defaults to silent (cybernetic quiet baseline).
 */
export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

/**
 * Silent logger implementation — the default.
 * Baseline is quiet; logging is opt-in.
 */
export const silentLogger: Logger = {
  info(): void {},
  warn(): void {},
  error(): void {},
};
