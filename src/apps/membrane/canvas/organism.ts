// Organism layer renderer: Personal and Org nodes with variables and episodes

import type { ClientState, NodeState } from "../client/types.js";
import type { Point } from "./layout.js";
import {
  calculateNodePositions,
  distributeVariablesCircular,
} from "./layout.js";
import { breathe, tremor, lerp } from "./animation.js";

// Visual constants
const NODE_BASE_RADIUS = 120;
const NODE_BASELINE_RADIUS = 80;
const VARIABLE_RADIUS = 20;
const EPISODE_ARC_WIDTH = 8;

// Colors
const COLORS = {
  calm: "rgba(79, 209, 197, 0.6)",
  calmDim: "rgba(79, 209, 197, 0.15)",
  calmGlow: "rgba(79, 209, 197, 0.3)",
  attention: "rgba(246, 173, 85, 0.8)",
  attentionDim: "rgba(246, 173, 85, 0.2)",
  tension: "rgba(252, 129, 129, 0.7)",
  tensionDim: "rgba(252, 129, 129, 0.2)",
  text: "rgba(255, 255, 255, 0.6)",
  textDim: "rgba(255, 255, 255, 0.25)",
  nodeStroke: "rgba(79, 209, 197, 0.3)",
  nodeFill: "rgba(79, 209, 197, 0.03)",
} as const;

interface OrganismRenderContext {
  ctx: CanvasRenderingContext2D;
  time: number;
  width: number;
  height: number;
}

/**
 * Renders the organism layer: both nodes with their variables and episodes.
 */
export function renderOrganismLayer(
  context: OrganismRenderContext,
  state: ClientState,
): void {
  const { ctx, time, width, height } = context;

  // Calculate node positions
  const nodePositions = calculateNodePositions(
    { width, height, padding: 100 },
    NODE_BASE_RADIUS,
  );

  // Render Personal node
  if (state.personalNode) {
    renderNode(context, state.personalNode, nodePositions.personal, "Personal");
  }

  // Render Org node
  if (state.orgNode) {
    renderNode(context, state.orgNode, nodePositions.org, "Org");
  }

  // Render connection line between nodes (subtle)
  if (state.personalNode && state.orgNode) {
    renderNodeConnection(ctx, nodePositions.personal, nodePositions.org, time);
  }
}

function renderNode(
  context: OrganismRenderContext,
  nodeState: NodeState,
  position: Point,
  label: string,
): void {
  const { ctx, time } = context;
  const { isBaseline, variables, activeEpisodes } = nodeState;

  // Calculate node radius based on state
  const targetRadius = isBaseline ? NODE_BASELINE_RADIUS : NODE_BASE_RADIUS;
  const breatheOffset = breathe(time, 5000) * 5;
  const radius = targetRadius + breatheOffset;

  // Outer glow
  const gradient = ctx.createRadialGradient(
    position.x,
    position.y,
    radius * 0.5,
    position.x,
    position.y,
    radius * 1.5,
  );
  gradient.addColorStop(0, isBaseline ? COLORS.calmGlow : COLORS.attentionDim);
  gradient.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.arc(position.x, position.y, radius * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Node membrane
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = isBaseline ? COLORS.nodeStroke : COLORS.attention;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.nodeFill;
  ctx.fill();

  // Variables as cells within the node
  const variablePositions = distributeVariablesCircular(
    position,
    variables.length,
    radius * 0.5,
  );

  variables.forEach((variable, index) => {
    const varPos = variablePositions[index];
    if (varPos) {
      renderVariable(ctx, variable, varPos, time);
    }
  });

  // Episodes as arcs around the node
  activeEpisodes.forEach((episode, index) => {
    const startAngle = -Math.PI / 2 + index * (Math.PI / 3);
    const endAngle = startAngle + Math.PI / 4;
    renderEpisodeArc(
      ctx,
      position,
      radius + 15,
      startAngle,
      endAngle,
      episode.type,
      time,
    );
  });

  // Node label
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = "center";
  ctx.fillText(label.toUpperCase(), position.x, position.y + radius + 35);

  // Baseline indicator
  if (isBaseline) {
    ctx.font = "italic 10px 'Fraunces', serif";
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText("baseline", position.x, position.y + radius + 50);
  }
}

function renderVariable(
  ctx: CanvasRenderingContext2D,
  variable: { name: string; status: string },
  position: Point,
  time: number,
): void {
  const { status, name } = variable;

  // Apply tremor for non-InRange states
  let x = position.x;
  let y = position.y;

  if (status === "Low" || status === "High") {
    const tremorAmount = tremor(time, 2);
    x += tremorAmount;
    y += tremorAmount * 0.5;
  }

  // Determine color based on status
  let color: string;
  let glowColor: string;

  switch (status) {
    case "Low":
      color = COLORS.tension;
      glowColor = COLORS.tensionDim;
      break;
    case "High":
      color = COLORS.attention;
      glowColor = COLORS.attentionDim;
      break;
    default:
      color = COLORS.calm;
      glowColor = COLORS.calmDim;
  }

  // Breathing glow
  const breatheAmount = breathe(time, 3000);
  const glowRadius = VARIABLE_RADIUS * (1.2 + breatheAmount * 0.3);

  // Glow
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, glowColor);
  gradient.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Core
  ctx.beginPath();
  ctx.arc(x, y, VARIABLE_RADIUS * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Label (first letter only for compactness)
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = COLORS.textDim;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.charAt(0).toUpperCase(), x, y);
}

function renderEpisodeArc(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
  episodeType: string,
  time: number,
): void {
  const color = episodeType === "Stabilize" ? COLORS.attention : COLORS.calm;

  // Pulsing effect
  const pulse = breathe(time, 2000);
  const alpha = lerp(0.4, 0.8, pulse);

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${alpha})`);
  ctx.lineWidth = EPISODE_ARC_WIDTH;
  ctx.lineCap = "round";
  ctx.stroke();

  // Scaffolding dots at ends
  const dotRadius = 3;
  const startX = center.x + Math.cos(startAngle) * radius;
  const startY = center.y + Math.sin(startAngle) * radius;
  const endX = center.x + Math.cos(endAngle) * radius;
  const endY = center.y + Math.sin(endAngle) * radius;

  ctx.beginPath();
  ctx.arc(startX, startY, dotRadius, 0, Math.PI * 2);
  ctx.arc(endX, endY, dotRadius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function renderNodeConnection(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  time: number,
): void {
  const alpha = lerp(0.05, 0.1, breathe(time, 6000));

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = `rgba(79, 209, 197, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 8]);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Gets stored positions for hit testing.
 */
export function getNodePositions(
  width: number,
  height: number,
): { personal: Point; org: Point } {
  return calculateNodePositions(
    { width, height, padding: 100 },
    NODE_BASE_RADIUS,
  );
}
