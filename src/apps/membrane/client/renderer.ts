/**
 * Canvas Renderer
 *
 * Renders organs and surfaces on a canvas element.
 */

import type { ClientState, OrganNode, SurfaceNode } from "./types.js";

/** Color palette - Bioluminescent depths aesthetic */
const COLORS = {
  background: "#0f172a", // Dark slate
  backgroundGlow: "#1e293b", // Slightly lighter for vignette
  organ: "#0d9488", // Teal
  organGlow: "#2dd4bf", // Brighter teal
  organCore: "#99f6e4", // Light teal for highlights
  surface: "#6366f1", // Indigo
  surfaceGlow: "#a5b4fc", // Lighter indigo
  text: "#f1f5f9", // Near white
  textMuted: "#94a3b8", // Muted gray
  arrow: "#334155", // Darker slate for subtlety
  arrowGlow: "#64748b", // Slightly brighter on hover
  pulse: "#fbbf24", // Amber
  pulseGlow: "#fcd34d", // Lighter amber
};

/**
 * Renders the current state to the canvas.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  state: ClientState,
): void {
  const { width, height, organs, surfaces, time } = state;

  // Clear canvas with radial gradient for depth
  const bgGradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7,
  );
  bgGradient.addColorStop(0, COLORS.backgroundGlow);
  bgGradient.addColorStop(1, COLORS.background);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Draw import arrows first (behind nodes)
  drawArrows(ctx, state);

  // Draw organs (core ones last so they're on top)
  const sortedOrgans = [...organs].sort((a, b) => a.radius - b.radius);
  for (const node of sortedOrgans) {
    drawOrgan(ctx, node, time);
  }

  // Draw surfaces
  for (const node of surfaces) {
    drawSurface(ctx, node, time);
  }
}

/**
 * Draws import arrows between nodes.
 */
function drawArrows(ctx: CanvasRenderingContext2D, state: ClientState): void {
  const { organs, surfaces } = state;

  // Create lookup maps
  const organMap = new Map(organs.map((o) => [o.organ.id, o]));

  // Draw organ-to-organ arrows
  for (const node of organs) {
    for (const importId of node.organ.imports) {
      const target = organMap.get(importId);
      if (target) {
        drawArrow(
          ctx,
          node.x,
          node.y,
          target.x,
          target.y,
          node.radius,
          target.radius,
        );
      }
    }
  }

  // Draw surface-to-organ arrows
  for (const surface of surfaces) {
    for (const importId of surface.surface.imports) {
      const target = organMap.get(importId);
      if (target) {
        drawArrow(
          ctx,
          surface.x,
          surface.y,
          target.x,
          target.y,
          Math.max(surface.width, surface.height) / 2,
          target.radius,
        );
      }
    }
  }
}

/**
 * Draws a curved arrow between two points.
 */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  r1: number,
  r2: number,
): void {
  // Calculate direction
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < r1 + r2 + 20) return; // Nodes too close

  // Normalize
  const nx = dx / dist;
  const ny = dy / dist;

  // Start and end points (offset by radii)
  const startX = x1 + nx * (r1 + 8);
  const startY = y1 + ny * (r1 + 8);
  const endX = x2 - nx * (r2 + 15);
  const endY = y2 - ny * (r2 + 15);

  // Control point for curve (offset perpendicular for nice arc)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const offset = dist * 0.15;
  const ctrlX = midX - ny * offset;
  const ctrlY = midY + nx * offset;

  // Draw with gradient for depth
  const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, "rgba(51, 65, 85, 0.3)");
  gradient.addColorStop(0.5, COLORS.arrow);
  gradient.addColorStop(1, "rgba(51, 65, 85, 0.6)");

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();

  // Arrowhead with slight glow
  const arrowSize = 7;
  const angle = Math.atan2(endY - ctrlY, endX - ctrlX);

  ctx.save();
  ctx.shadowColor = COLORS.arrowGlow;
  ctx.shadowBlur = 3;
  ctx.fillStyle = COLORS.arrow;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - arrowSize * Math.cos(angle - Math.PI / 6),
    endY - arrowSize * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    endX - arrowSize * Math.cos(angle + Math.PI / 6),
    endY - arrowSize * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Draws an organ node.
 */
function drawOrgan(
  ctx: CanvasRenderingContext2D,
  node: OrganNode,
  time: number,
): void {
  const { x, y, radius, phase, pulse, organ } = node;

  // Breathing animation with slight position drift
  const breathe = 1 + 0.025 * Math.sin((time / 4000) * Math.PI * 2 + phase);
  const drift = 2 * Math.sin((time / 6000) * Math.PI * 2 + phase * 1.5);
  const r = radius * breathe;
  const dx = x + drift * 0.3;
  const dy = y + drift * 0.5;

  // Ambient glow (always present, subtle)
  ctx.save();
  ctx.shadowColor = COLORS.organ;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(dx, dy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(13, 148, 136, 0.15)";
  ctx.fill();
  ctx.restore();

  // Pulse glow (from file changes)
  if (pulse > 0) {
    ctx.save();
    ctx.shadowColor = COLORS.pulseGlow;
    ctx.shadowBlur = 40 * pulse;
    ctx.beginPath();
    ctx.arc(dx, dy, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.4})`;
    ctx.fill();
    ctx.restore();
  }

  // Main circle with gradient
  ctx.beginPath();
  ctx.arc(dx, dy, r, 0, Math.PI * 2);

  // Rich gradient fill with highlight
  const gradient = ctx.createRadialGradient(
    dx - r * 0.35,
    dy - r * 0.35,
    0,
    dx,
    dy,
    r,
  );
  gradient.addColorStop(0, COLORS.organCore);
  gradient.addColorStop(0.3, COLORS.organGlow);
  gradient.addColorStop(1, COLORS.organ);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Subtle border with glow
  ctx.strokeStyle = "rgba(45, 212, 191, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label with shadow for readability
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 13px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Use short name (remove " Organ" suffix)
  const shortName = organ.name.replace(" Organ", "");
  ctx.fillText(shortName, dx, dy);
  ctx.restore();
}

/**
 * Draws a surface node (rounded rectangle).
 */
function drawSurface(
  ctx: CanvasRenderingContext2D,
  node: SurfaceNode,
  time: number,
): void {
  const { x, y, width, height, phase, pulse, surface } = node;

  // Breathing animation with subtle drift
  const breathe = 1 + 0.015 * Math.sin((time / 5000) * Math.PI * 2 + phase);
  const drift = 1.5 * Math.sin((time / 7000) * Math.PI * 2 + phase * 1.3);
  const w = width * breathe;
  const h = height * breathe;
  const dx = x + drift * 0.2;
  const dy = y + drift * 0.4;
  const cornerRadius = 10;

  // Ambient glow
  ctx.save();
  ctx.shadowColor = COLORS.surface;
  ctx.shadowBlur = 15;
  roundRect(ctx, dx - w / 2, dy - h / 2, w, h, cornerRadius);
  ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
  ctx.fill();
  ctx.restore();

  // Pulse glow
  if (pulse > 0) {
    ctx.save();
    ctx.shadowColor = COLORS.pulseGlow;
    ctx.shadowBlur = 25 * pulse;
    roundRect(ctx, dx - w / 2 - 4, dy - h / 2 - 4, w + 8, h + 8, cornerRadius);
    ctx.fillStyle = `rgba(251, 191, 36, ${pulse * 0.35})`;
    ctx.fill();
    ctx.restore();
  }

  // Main rectangle
  roundRect(ctx, dx - w / 2, dy - h / 2, w, h, cornerRadius);

  // Rich gradient fill
  const gradient = ctx.createLinearGradient(
    dx - w / 2,
    dy - h / 2,
    dx + w / 2,
    dy + h / 2,
  );
  gradient.addColorStop(0, COLORS.surfaceGlow);
  gradient.addColorStop(0.5, COLORS.surface);
  gradient.addColorStop(1, "#4f46e5"); // Slightly darker indigo
  ctx.fillStyle = gradient;
  ctx.fill();

  // Subtle glowing border
  ctx.strokeStyle = "rgba(165, 180, 252, 0.4)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label with shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 3;
  ctx.fillStyle = COLORS.text;
  ctx.font = "600 11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Use short name
  const shortName = surface.name.replace(" UI", "").replace(" App", "");
  ctx.fillText(shortName, dx, dy);
  ctx.restore();
}

/**
 * Helper to draw rounded rectangles.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
