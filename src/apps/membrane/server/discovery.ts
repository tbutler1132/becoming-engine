/**
 * Membrane Discovery
 *
 * Scans the codebase to discover organs (src/libs/*) and surfaces (src/apps/*).
 * Extracts metadata from README files and infers import relationships.
 *
 * Usage: npx tsx src/apps/membrane/server/discovery.ts
 */

import { readdir } from "fs/promises";
import { join, resolve } from "path";
import type { DiscoveryResult, Organ, Surface } from "./types.js";
import { parseReadme, nameFromDirectory } from "./readme-parser.js";
import { scanImports, computeImportedBy } from "./import-parser.js";

/** Directories to skip when scanning */
const SKIP_DIRS = new Set(["node_modules", "internal", ".git", "dist"]);

/**
 * Discovers organs and surfaces in the codebase.
 */
export async function discover(basePath: string): Promise<DiscoveryResult> {
  const libsPath = join(basePath, "src", "libs");
  const appsPath = join(basePath, "src", "apps");

  const [organs, surfaces] = await Promise.all([
    discoverOrgans(libsPath),
    discoverSurfaces(appsPath),
  ]);

  // Compute import relationships
  await populateImports(organs, surfaces, basePath);

  return {
    organs,
    surfaces,
    discoveredAt: new Date().toISOString(),
  };
}

/**
 * Populates import relationships for all organs and surfaces.
 */
async function populateImports(
  organs: Organ[],
  surfaces: Surface[],
  basePath: string,
): Promise<void> {
  const organIds = organs.map((o) => o.id);
  const importsMap = new Map<string, string[]>();

  // Scan imports for each organ
  for (const organ of organs) {
    const fullPath = join(basePath, organ.path);
    const result = await scanImports(fullPath);
    // Filter to only include imports of known organs (not self-imports)
    organ.imports = result.imports.filter(
      (id) => organIds.includes(id) && id !== organ.id,
    );
    importsMap.set(organ.id, organ.imports);
  }

  // Scan imports for each surface
  for (const surface of surfaces) {
    const fullPath = join(basePath, surface.path);
    const result = await scanImports(fullPath);
    // Filter to only include imports of known organs
    surface.imports = result.imports.filter((id) => organIds.includes(id));
  }

  // Compute reverse relationships (importedBy) for organs
  const importedByMap = computeImportedBy(organIds, importsMap);

  // Also add surface imports to importedBy
  for (const surface of surfaces) {
    for (const importedId of surface.imports) {
      const organ = organs.find((o) => o.id === importedId);
      if (organ && !organ.importedBy.includes(`surface:${surface.id}`)) {
        organ.importedBy.push(`surface:${surface.id}`);
      }
    }
  }

  // Merge organ-to-organ importedBy
  for (const organ of organs) {
    const organImporters = importedByMap.get(organ.id) ?? [];
    for (const importer of organImporters) {
      if (!organ.importedBy.includes(importer)) {
        organ.importedBy.push(importer);
      }
    }
  }
}

/**
 * Discovers organs in src/libs/.
 */
async function discoverOrgans(libsPath: string): Promise<Organ[]> {
  const organs: Organ[] = [];

  try {
    const entries = await readdir(libsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const organPath = join(libsPath, entry.name);
      const relativePath = `src/libs/${entry.name}`;
      const metadata = await parseReadme(organPath);

      organs.push({
        id: entry.name,
        name: metadata.name || `${nameFromDirectory(entry.name)} Organ`,
        path: relativePath,
        description: metadata.description,
        responsibilities: metadata.responsibilities,
        imports: [], // Will be populated in MP2
        importedBy: [], // Will be populated in MP2
      });
    }
  } catch (error) {
    // libs directory doesn't exist
    console.warn(`Warning: Could not read ${libsPath}:`, error);
  }

  return organs;
}

/**
 * Discovers surfaces in src/apps/.
 */
async function discoverSurfaces(appsPath: string): Promise<Surface[]> {
  const surfaces: Surface[] = [];

  try {
    const entries = await readdir(appsPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      // Skip the membrane app itself (we're inside it)
      if (entry.name === "membrane") {
        continue;
      }

      const surfacePath = join(appsPath, entry.name);
      const relativePath = `src/apps/${entry.name}`;
      const metadata = await parseReadme(surfacePath);

      // Use directory name for surfaces with template/missing READMEs
      const surfaceName =
        metadata.name && !metadata.name.includes("Next.js")
          ? metadata.name
          : `${nameFromDirectory(entry.name)} UI`;

      surfaces.push({
        id: entry.name,
        name: surfaceName,
        path: relativePath,
        description: metadata.description,
        imports: [], // Will be populated in MP2
      });
    }
  } catch (error) {
    // apps directory doesn't exist
    console.warn(`Warning: Could not read ${appsPath}:`, error);
  }

  return surfaces;
}

/**
 * CLI entry point.
 * Run with: npx tsx src/apps/membrane/server/discovery.ts
 */
async function main(): Promise<void> {
  // Find project root (walk up from this file to find package.json)
  const basePath = resolve(import.meta.dirname, "../../../../");

  console.log(`Discovering codebase at: ${basePath}\n`);

  const result = await discover(basePath);

  console.log("=== Discovery Result ===\n");
  console.log(JSON.stringify(result, null, 2));

  // Summary
  console.log("\n=== Summary ===");
  console.log(`Organs:   ${result.organs.length}`);
  console.log(`Surfaces: ${result.surfaces.length}`);

  if (result.organs.length > 0) {
    console.log("\nOrgans:");
    for (const organ of result.organs) {
      console.log(`  - ${organ.name} (${organ.id})`);
      if (organ.imports.length > 0) {
        console.log(`    → imports: ${organ.imports.join(", ")}`);
      }
      if (organ.importedBy.length > 0) {
        console.log(`    ← imported by: ${organ.importedBy.join(", ")}`);
      }
    }
  }

  if (result.surfaces.length > 0) {
    console.log("\nSurfaces:");
    for (const surface of result.surfaces) {
      console.log(`  - ${surface.name} (${surface.id})`);
      if (surface.imports.length > 0) {
        console.log(`    → imports: ${surface.imports.join(", ")}`);
      }
    }
  }

  // Dependency graph summary
  const totalEdges =
    result.organs.reduce((sum, o) => sum + o.imports.length, 0) +
    result.surfaces.reduce((sum, s) => sum + s.imports.length, 0);
  console.log(`\nTotal dependency edges: ${totalEdges}`);
}

// Run if executed directly
main().catch(console.error);
