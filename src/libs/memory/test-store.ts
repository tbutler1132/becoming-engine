// Test script for the Memory organ
// Verifies that JsonStore can load (seed) and save state

import { JsonStore, SEED_AGENCY_NAME } from "./index.js";
import type { State, Variable } from "./index.js";
import fs from "fs-extra";
import * as path from "node:path";
import { SCHEMA_VERSION } from "./index.js";

const DATA_DIR = "data";
const STATE_FILE = "state.json";

async function main(): Promise<void> {
  console.log("=== Memory Organ Test ===\n");

  // 1. Instantiate JsonStore
  const store = new JsonStore();
  console.log("1. JsonStore instantiated");

  // 2. Load state (triggers seed on first run)
  const state = await store.load();
  console.log("2. State loaded");
  console.log(`   Variables: ${state.variables.length}`);
  console.log(`   Episodes: ${state.episodes.length}`);
  console.log(`   Actions: ${state.actions.length}`);
  console.log(`   Notes: ${state.notes.length}`);

  // 3. Save state to disk
  await store.save(state);
  console.log("3. State saved to data/state.json");

  // 4. Verify file exists and contains Agency variable
  const filePath = path.join(process.cwd(), DATA_DIR, STATE_FILE);
  const exists = await fs.pathExists(filePath);

  if (!exists) {
    console.error("\n❌ FAILED: data/state.json was not created");
    process.exit(1);
  }

  const savedStateData: unknown = await fs.readJson(filePath);
  if (
    typeof savedStateData !== "object" ||
    savedStateData === null ||
    !("variables" in savedStateData) ||
    !Array.isArray(savedStateData.variables)
  ) {
    console.error("\n❌ FAILED: Invalid state file structure");
    process.exit(1);
  }
  const savedState = savedStateData as State;
  if (savedState.schemaVersion !== SCHEMA_VERSION) {
    console.error("\n❌ FAILED: Unexpected schemaVersion in state");
    process.exit(1);
  }
  const agencyVar: Variable | undefined = savedState.variables.find(
    (v: Variable) => v.name === SEED_AGENCY_NAME
  );

  if (!agencyVar) {
    console.error("\n❌ FAILED: Agency variable not found in state");
    process.exit(1);
  }

  console.log("\n✓ SUCCESS: Memory organ is operational");
  console.log("\nSeed state contains:");
  for (const v of state.variables) {
    console.log(`  - [${v.node}] ${v.name}: ${v.status}`);
  }
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
