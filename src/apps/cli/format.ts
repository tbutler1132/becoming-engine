// Pure formatting functions for CLI output
// All functions are pure: (Data) => String

import type { StatusData } from "../../libs/regulator/index.js";

/**
 * Formats a node reference as "Type:Id".
 */
function formatNodeRef(node: { type: string; id: string }): string {
  return `${node.type}:${node.id}`;
}

/**
 * Formats status data for CLI display.
 * Pure function: takes StatusData and returns formatted string.
 *
 * **Intent:** Render status information for human consumption.
 * Baseline is quiet; active shows structured details.
 *
 * **Contract:**
 * - Baseline mode: Returns minimal 2-line output
 * - Active mode: Returns header + Variables + Episodes + Actions sections
 */
export function formatStatus(data: StatusData): string {
  const header = `becoming status ${formatNodeRef(data.node)}`;

  if (data.mode === "baseline") {
    return `${header}\nSilence is Success (baseline).`;
  }

  const lines: string[] = [header, ""];

  // Variables section
  lines.push("Variables:");
  if (data.variables.length === 0) {
    lines.push("  (none)");
  } else {
    for (const v of data.variables) {
      lines.push(`  - ${v.id}: ${v.name} = ${v.status}`);
    }
  }
  lines.push("");

  // Episodes section
  lines.push("Active Episodes:");
  for (const e of data.episodes) {
    const variableInfo = e.variableId ? ` [${e.variableId}]` : "";
    lines.push(`  - ${e.id}: ${e.type}${variableInfo} — ${e.objective}`);
  }
  lines.push("");

  // Actions section (episode-scoped pending actions only)
  lines.push("Pending Actions:");
  if (data.actions.length === 0) {
    lines.push("  (none)");
  } else {
    for (const a of data.actions) {
      lines.push(`  - [${a.episodeId}] ${a.description}`);
    }
  }

  return lines.join("\n");
}
