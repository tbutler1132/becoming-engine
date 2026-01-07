/**
 * Centralized configuration for the Becoming Engine.
 *
 * This module provides a single source of truth for environment-dependent
 * configuration values. All modules should import config from here rather
 * than reading process.env directly.
 *
 * **Intent:** Make configuration explicit, testable, and easy to change.
 */

/**
 * Environment type for the application.
 * - 'dev': Development mode (uses state-dev.json)
 * - 'prod': Production mode (uses state.json)
 */
export type Environment = "dev" | "prod";

/**
 * Application configuration.
 */
export interface Config {
  /** Current environment */
  env: Environment;
  /** Directory for data files (relative to project root) */
  dataDir: string;
  /** State file name (depends on environment) */
  stateFile: string;
}

/**
 * Detects the current environment from process.env.
 * Defaults to 'prod' if BECOMING_ENV is not set.
 */
function detectEnvironment(): Environment {
  const env = process.env.BECOMING_ENV;
  if (env === "dev") {
    return "dev";
  }
  return "prod";
}

/**
 * Gets the application configuration.
 *
 * **Intent:** Provide a single, consistent way to access configuration
 * values throughout the application.
 *
 * **Contract:**
 * - Returns: Config object with all configuration values
 * - Pure: Does not mutate any state
 * - Deterministic for a given environment
 */
export function getConfig(): Config {
  const env = detectEnvironment();
  return {
    env,
    dataDir: "data",
    stateFile: env === "dev" ? "state-dev.json" : "state.json",
  };
}

/**
 * Default configuration (production mode).
 * Use getConfig() for runtime configuration that respects environment variables.
 */
export const DEFAULT_CONFIG: Config = {
  env: "prod",
  dataDir: "data",
  stateFile: "state.json",
};
