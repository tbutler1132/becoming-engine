/**
 * Interaction Handler
 *
 * Handles mouse events for hover tooltips and future click interactions.
 */

import type { ClientState, OrganNode, SurfaceNode } from "./types.js";

/**
 * Information about what's currently hovered.
 */
export interface HoverInfo {
  type: "organ" | "surface";
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
}

/**
 * Finds what (if anything) is under the mouse position.
 */
export function findHovered(
  state: ClientState,
  mouseX: number,
  mouseY: number,
): HoverInfo | null {
  // Check organs first (they're usually more important)
  for (const node of state.organs) {
    if (isPointInOrgan(node, mouseX, mouseY)) {
      return {
        type: "organ",
        id: node.organ.id,
        name: node.organ.name,
        description: node.organ.description || "No description available",
        x: node.x,
        y: node.y,
      };
    }
  }

  // Check surfaces
  for (const node of state.surfaces) {
    if (isPointInSurface(node, mouseX, mouseY)) {
      return {
        type: "surface",
        id: node.surface.id,
        name: node.surface.name,
        description: node.surface.description || "No description available",
        x: node.x,
        y: node.y,
      };
    }
  }

  return null;
}

/**
 * Tests if a point is inside an organ circle.
 */
function isPointInOrgan(node: OrganNode, x: number, y: number): boolean {
  const dx = x - node.x;
  const dy = y - node.y;
  return dx * dx + dy * dy <= node.radius * node.radius;
}

/**
 * Tests if a point is inside a surface rectangle.
 */
function isPointInSurface(node: SurfaceNode, x: number, y: number): boolean {
  const halfW = node.width / 2;
  const halfH = node.height / 2;
  return (
    x >= node.x - halfW &&
    x <= node.x + halfW &&
    y >= node.y - halfH &&
    y <= node.y + halfH
  );
}

/**
 * Renders a tooltip at the given position.
 */
export function renderTooltip(
  ctx: CanvasRenderingContext2D,
  info: HoverInfo,
  width: number,
  height: number,
): void {
  const padding = 12;
  const maxWidth = 280;
  const lineHeight = 18;

  // Prepare text
  const title = info.name;
  const desc = info.description;

  ctx.font = "bold 13px system-ui";
  const titleWidth = ctx.measureText(title).width;

  ctx.font = "12px system-ui";
  const lines = wrapText(ctx, desc, maxWidth - padding * 2);

  // Calculate tooltip dimensions
  const tooltipWidth = Math.min(
    maxWidth,
    Math.max(titleWidth + padding * 2, 180),
  );
  const tooltipHeight = padding * 2 + lineHeight + lines.length * lineHeight;

  // Position tooltip (avoid going off screen)
  let tx = info.x + 20;
  let ty = info.y - tooltipHeight / 2;

  if (tx + tooltipWidth > width - 20) {
    tx = info.x - tooltipWidth - 20;
  }
  if (ty < 20) {
    ty = 20;
  }
  if (ty + tooltipHeight > height - 20) {
    ty = height - tooltipHeight - 20;
  }

  // Draw tooltip background
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
  ctx.beginPath();
  roundRect(ctx, tx, ty, tooltipWidth, tooltipHeight, 8);
  ctx.fill();

  // Border
  ctx.strokeStyle =
    info.type === "organ"
      ? "rgba(45, 212, 191, 0.5)"
      : "rgba(165, 180, 252, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Draw title
  ctx.fillStyle = info.type === "organ" ? "#2dd4bf" : "#a5b4fc";
  ctx.font = "bold 13px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(title, tx + padding, ty + padding);

  // Draw description
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px system-ui";
  lines.forEach((line, i) => {
    ctx.fillText(
      line,
      tx + padding,
      ty + padding + lineHeight + i * lineHeight,
    );
  });
}

/**
 * Wraps text to fit within a given width.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  // Remove markdown formatting
  const cleanText = text
    .replace(/\*\*/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  const words = cleanText.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Limit to 4 lines max
  if (lines.length > 4) {
    lines.length = 4;
    lines[3] = lines[3].slice(0, -3) + "...";
  }

  return lines;
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
