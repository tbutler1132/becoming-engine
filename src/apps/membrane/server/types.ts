/**
 * Membrane Visualization — Server Types
 *
 * Types for the auto-discovery system that scans the codebase
 * and extracts organ/surface metadata.
 */

/**
 * An Organ is a core system module in src/libs/.
 * Organs have clear responsibilities and boundaries.
 */
export interface Organ {
  /** Unique identifier derived from directory name (e.g. "memory") */
  id: string;
  /** Human-readable name from README (e.g. "Memory Organ") */
  name: string;
  /** Relative path to the organ directory (e.g. "src/libs/memory") */
  path: string;
  /** First paragraph after the title in README */
  description: string;
  /** List of responsibilities extracted from README */
  responsibilities: string[];
  /** IDs of organs this organ imports from */
  imports: string[];
  /** IDs of organs that import this organ */
  importedBy: string[];
}

/**
 * A Surface is a user-facing application in src/apps/.
 * Surfaces consume organs but are not consumed by other modules.
 */
export interface Surface {
  /** Unique identifier derived from directory name (e.g. "web") */
  id: string;
  /** Human-readable name from README or directory (e.g. "Web UI") */
  name: string;
  /** Relative path to the surface directory (e.g. "src/apps/web") */
  path: string;
  /** Description from README if available */
  description: string;
  /** IDs of organs this surface imports from */
  imports: string[];
}

/**
 * Result of scanning the codebase for organs and surfaces.
 */
export interface DiscoveryResult {
  /** Core system modules from src/libs/ */
  organs: Organ[];
  /** User-facing applications from src/apps/ */
  surfaces: Surface[];
  /** Timestamp of when discovery was performed */
  discoveredAt: string;
}

/**
 * Metadata extracted from a README.md file.
 */
export interface ReadmeMetadata {
  /** Title from the first # heading */
  name: string;
  /** First paragraph after the title */
  description: string;
  /** Items from the Responsibilities section */
  responsibilities: string[];
}
