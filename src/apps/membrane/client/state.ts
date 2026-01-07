/**
 * Client State Manager
 *
 * Manages the visualization state and coordinates updates.
 */

import type {
  ClientState,
  ConnectionStatus,
  DiscoveryResult,
  OrganNode,
  SurfaceNode,
  ServerMessage,
} from "./types.js";

/**
 * Creates the initial client state.
 */
export function createInitialState(): ClientState {
  return {
    status: "connecting",
    discovery: null,
    organs: [],
    surfaces: [],
    time: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Updates state when discovery data is received.
 */
export function handleDiscovery(
  state: ClientState,
  discovery: DiscoveryResult,
): ClientState {
  const organs = layoutOrgans(discovery.organs, state.width, state.height);
  const surfaces = layoutSurfaces(
    discovery.surfaces,
    state.width,
    state.height,
    organs,
  );

  return {
    ...state,
    discovery,
    organs,
    surfaces,
  };
}

/**
 * Updates connection status.
 */
export function setStatus(
  state: ClientState,
  status: ConnectionStatus,
): ClientState {
  return { ...state, status };
}

/**
 * Updates canvas dimensions.
 */
export function setDimensions(
  state: ClientState,
  width: number,
  height: number,
): ClientState {
  // Re-layout if we have discovery data
  if (state.discovery) {
    const organs = layoutOrgans(state.discovery.organs, width, height);
    const surfaces = layoutSurfaces(
      state.discovery.surfaces,
      width,
      height,
      organs,
    );
    return { ...state, width, height, organs, surfaces };
  }
  return { ...state, width, height };
}

/**
 * Updates animation time.
 */
export function tick(state: ClientState, time: number): ClientState {
  return { ...state, time };
}

/**
 * Triggers a pulse on an organ when it changes.
 */
export function pulseOrgan(state: ClientState, organId: string): ClientState {
  const organs = state.organs.map((node) =>
    node.organ.id === organId ? { ...node, pulse: 1 } : node,
  );
  return { ...state, organs };
}

/**
 * Decays pulse values over time.
 */
export function decayPulses(state: ClientState, delta: number): ClientState {
  const decayRate = 0.002; // Decay over ~500ms
  const organs = state.organs.map((node) => ({
    ...node,
    pulse: Math.max(0, node.pulse - delta * decayRate),
  }));
  const surfaces = state.surfaces.map((node) => ({
    ...node,
    pulse: Math.max(0, node.pulse - delta * decayRate),
  }));
  return { ...state, organs, surfaces };
}

/**
 * Parses a server message.
 */
export function parseMessage(data: string): ServerMessage | null {
  try {
    return JSON.parse(data) as ServerMessage;
  } catch {
    return null;
  }
}

// --- Layout Functions ---

/**
 * Computes the "centrality" of an organ based on how many things import it.
 * Higher = more central to the system.
 */
function computeCentrality(organ: DiscoveryResult["organs"][0]): number {
  // Count importedBy, with organ imports worth more than surface imports
  let score = 0;
  for (const importer of organ.importedBy) {
    score += importer.startsWith("surface:") ? 1 : 2;
  }
  return score;
}

/**
 * Lays out organs based on their import relationships.
 * Core organs (heavily imported) go in the center, others orbit around.
 */
function layoutOrgans(
  organs: DiscoveryResult["organs"],
  width: number,
  height: number,
): OrganNode[] {
  const centerX = width / 2;
  const centerY = height / 2;

  // Sort by centrality (most central first)
  const sorted = [...organs].sort(
    (a, b) => computeCentrality(b) - computeCentrality(a),
  );

  // Assign layers based on centrality
  const coreCount = sorted.filter((o) => computeCentrality(o) > 0).length;
  const coreOrgans = sorted.slice(0, Math.max(1, coreCount));
  const peripheralOrgans = sorted.slice(coreCount);

  const nodes: OrganNode[] = [];

  // Layout core organs in inner ring (or single center)
  const coreRadius =
    coreOrgans.length === 1 ? 0 : Math.min(width, height) * 0.12;
  const organRadius = 50;

  for (let i = 0; i < coreOrgans.length; i++) {
    const organ = coreOrgans[i];
    const angle = (i / coreOrgans.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      organ,
      x: centerX + Math.cos(angle) * coreRadius,
      y: centerY + Math.sin(angle) * coreRadius,
      radius: organRadius + 5, // Slightly larger for core
      phase: (i / organs.length) * Math.PI * 2,
      pulse: 0,
    });
  }

  // Layout peripheral organs in outer ring
  const outerRadius = Math.min(width, height) * 0.32;
  for (let i = 0; i < peripheralOrgans.length; i++) {
    const organ = peripheralOrgans[i];
    // Offset angle to avoid overlap with core
    const angle =
      (i / peripheralOrgans.length) * Math.PI * 2 -
      Math.PI / 2 +
      Math.PI / peripheralOrgans.length;
    nodes.push({
      organ,
      x: centerX + Math.cos(angle) * outerRadius,
      y: centerY + Math.sin(angle) * outerRadius,
      radius: organRadius - 5, // Slightly smaller for peripheral
      phase: ((coreOrgans.length + i) / organs.length) * Math.PI * 2,
      pulse: 0,
    });
  }

  return nodes;
}

/**
 * Lays out surfaces around the periphery, positioned near their imports.
 */
function layoutSurfaces(
  surfaces: DiscoveryResult["surfaces"],
  width: number,
  height: number,
  organNodes: OrganNode[],
): SurfaceNode[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.48;

  // Create organ position lookup
  const organPositions = new Map(
    organNodes.map((n) => [n.organ.id, { x: n.x, y: n.y }]),
  );

  return surfaces.map((surface, i) => {
    // Calculate ideal angle based on average position of imported organs
    let targetAngle =
      (i / surfaces.length) * Math.PI * 2 + Math.PI / surfaces.length;

    if (surface.imports.length > 0) {
      let avgX = 0;
      let avgY = 0;
      let count = 0;

      for (const importId of surface.imports) {
        const pos = organPositions.get(importId);
        if (pos) {
          avgX += pos.x;
          avgY += pos.y;
          count++;
        }
      }

      if (count > 0) {
        avgX /= count;
        avgY /= count;
        // Angle from center toward average import position
        targetAngle = Math.atan2(avgY - centerY, avgX - centerX);
      }
    }

    return {
      surface,
      x: centerX + Math.cos(targetAngle) * radius,
      y: centerY + Math.sin(targetAngle) * radius,
      width: 90,
      height: 36,
      phase: (i / surfaces.length) * Math.PI * 2,
      pulse: 0,
    };
  });
}
