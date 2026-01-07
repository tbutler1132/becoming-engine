/**
 * Import Parser
 *
 * Scans TypeScript files to extract import relationships.
 * Uses regex parsing (no full AST needed for this layer).
 */

import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

/** Directories to skip when scanning for imports */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "__tests__"]);

/** File extensions to scan */
const TS_EXTENSIONS = new Set([".ts", ".tsx"]);

/**
 * Result of scanning a directory for imports.
 */
export interface ImportScanResult {
  /** IDs of organs/modules this directory imports from */
  imports: string[];
}

/**
 * Scans a directory for TypeScript files and extracts import relationships.
 * Returns unique organ IDs that are imported.
 */
export async function scanImports(dirPath: string): Promise<ImportScanResult> {
  const importedOrgans = new Set<string>();

  await scanDirectory(dirPath, importedOrgans);

  return {
    imports: Array.from(importedOrgans).sort(),
  };
}

/**
 * Recursively scans a directory for TypeScript files.
 */
async function scanDirectory(
  dirPath: string,
  importedOrgans: Set<string>,
): Promise<void> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, importedOrgans);
      } else if (entry.isFile() && TS_EXTENSIONS.has(extname(entry.name))) {
        await scanFile(fullPath, importedOrgans);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
}

/**
 * Scans a single TypeScript file for imports.
 */
async function scanFile(
  filePath: string,
  importedOrgans: Set<string>,
): Promise<void> {
  try {
    const content = await readFile(filePath, "utf-8");
    extractImports(content, importedOrgans);
  } catch {
    // File can't be read
  }
}

/**
 * Extracts organ imports from file content.
 *
 * Matches patterns like:
 * - import { X } from "@libs/memory"
 * - import { X } from "@libs/memory/index.js"
 * - import type { X } from "@libs/regulator"
 * - export { X } from "@libs/shared"
 */
function extractImports(content: string, importedOrgans: Set<string>): void {
  // Match @libs/organName imports
  // Captures the organ name from patterns like @libs/memory or @libs/memory/...
  const libsPattern = /@libs\/([a-z-]+)/g;

  let match: RegExpExecArray | null;
  while ((match = libsPattern.exec(content)) !== null) {
    const organId = match[1];
    importedOrgans.add(organId);
  }
}

/**
 * Computes the reverse relationship (importedBy) from a set of import relationships.
 *
 * @param organIds - List of all organ IDs
 * @param importsMap - Map of organId -> list of imported organ IDs
 * @returns Map of organId -> list of organ IDs that import it
 */
export function computeImportedBy(
  organIds: string[],
  importsMap: Map<string, string[]>,
): Map<string, string[]> {
  const importedByMap = new Map<string, string[]>();

  // Initialize all organs with empty arrays
  for (const organId of organIds) {
    importedByMap.set(organId, []);
  }

  // For each organ that imports others, add reverse relationship
  for (const [importerId, imports] of importsMap) {
    for (const importedId of imports) {
      const importers = importedByMap.get(importedId);
      if (importers && !importers.includes(importerId)) {
        importers.push(importerId);
      }
    }
  }

  return importedByMap;
}
