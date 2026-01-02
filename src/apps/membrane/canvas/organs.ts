// Organs layer renderer: module visualization with data flow

import type { ClientState, OrganPulse } from "../client/types.js";
import type { Point, OrganLayout } from "./layout.js";
import { calculateOrganLayout, isPointInCircle } from "./layout.js";
import { breathe, pulseDecay, lerp } from "./animation.js";
import organsData from "../data/organs.json" with { type: "json" };

// Visual constants
const ORGAN_BASE_RADIUS = 60;

// Colors
const COLORS = {
  organFill: "rgba(79, 209, 197, 0.05)",
  organStroke: "rgba(79, 209, 197, 0.4)",
  organGlow: "rgba(79, 209, 197, 0.2)",
  pulseGlow: "rgba(246, 173, 85, 0.6)",
  flowLine: "rgba(79, 209, 197, 0.15)",
  flowArrow: "rgba(79, 209, 197, 0.3)",
  text: "rgba(255, 255, 255, 0.6)",
  textDim: "rgba(255, 255, 255, 0.25)",
  philosophy: "rgba(255, 255, 255, 0.15)",
} as const;

// Icon paths (simple symbolic shapes)
const ICONS: Record<
  string,
  (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void
> = {
  brain: (ctx, x, y, size) => {
    // Simple brain-like shape
    ctx.beginPath();
    ctx.arc(x - size * 0.2, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.2, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  },
  gear: (ctx, x, y, size) => {
    // Simple gear shape
    const teeth = 6;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? size * 0.5 : size * 0.35;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  },
  eye: (ctx, x, y, size) => {
    // Simple eye shape
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, size * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.organFill;
    ctx.fill();
  },
  surface: (ctx, x, y, size) => {
    // Simple surface/display shape
    ctx.beginPath();
    ctx.roundRect(x - size * 0.4, y - size * 0.3, size * 0.8, size * 0.6, 4);
    ctx.fill();
  },
};

interface OrgansRenderContext {
  ctx: CanvasRenderingContext2D;
  time: number;
  width: number;
  height: number;
}

interface OrganData {
  id: string;
  name: string;
  icon: string;
  role: string;
  philosophy: string;
  description: string;
}

interface DataFlowEdge {
  from: string;
  to: string;
  label: string;
}

/**
 * Renders the organs layer: modules and data flow.
 */
export function renderOrgansLayer(
  context: OrgansRenderContext,
  state: ClientState,
): void {
  const { ctx, time, width, height } = context;

  const organs = organsData.organs as OrganData[];
  const organIds = organs.map((o) => o.id);

  // Calculate layout
  const layout = calculateOrganLayout({ width, height, padding: 80 }, organIds);

  // Build lookup for positions
  const positionMap = new Map<string, OrganLayout>();
  for (const item of layout) {
    positionMap.set(item.id, item);
  }

  // Render data flow connections first (behind organs)
  const dataFlow = organsData.dataFlow as DataFlowEdge[];
  for (const edge of dataFlow) {
    const fromLayout = positionMap.get(edge.from);
    const toLayout = positionMap.get(edge.to);
    if (fromLayout && toLayout) {
      renderDataFlow(ctx, fromLayout.center, toLayout.center, edge.label, time);
    }
  }

  // Render each organ
  for (const organ of organs) {
    const layoutItem = positionMap.get(organ.id);
    if (!layoutItem) continue;

    const pulse = findPulse(state.organPulses, organ.id);
    const isFocused = state.focusedOrgan === organ.id;

    renderOrgan(context, organ, layoutItem, pulse, isFocused);
  }
}

function findPulse(
  pulses: readonly OrganPulse[],
  organId: string,
): OrganPulse | undefined {
  return pulses.find((p) => p.organId === organId);
}

function renderOrgan(
  context: OrgansRenderContext,
  organ: OrganData,
  layout: OrganLayout,
  pulse: OrganPulse | undefined,
  isFocused: boolean,
): void {
  const { ctx, time } = context;
  const { center, radius } = layout;

  // Calculate pulse intensity
  const pulseAge = pulse ? Date.now() - pulse.timestamp : Infinity;
  const pulseIntensity = pulseDecay(pulseAge);

  // Breathing effect
  const breatheOffset = breathe(time, 4000) * 3;
  const currentRadius = radius + breatheOffset + (isFocused ? 10 : 0);

  // Outer glow (stronger when pulsing or focused)
  const glowAlpha = lerp(0.1, 0.4, pulseIntensity) + (isFocused ? 0.1 : 0);
  const gradient = ctx.createRadialGradient(
    center.x,
    center.y,
    currentRadius * 0.5,
    center.x,
    center.y,
    currentRadius * 1.8,
  );

  if (pulseIntensity > 0.1) {
    gradient.addColorStop(
      0,
      COLORS.pulseGlow.replace(/[\d.]+\)$/, `${glowAlpha})`),
    );
  } else {
    gradient.addColorStop(
      0,
      COLORS.organGlow.replace(/[\d.]+\)$/, `${glowAlpha})`),
    );
  }
  gradient.addColorStop(1, "transparent");

  ctx.beginPath();
  ctx.arc(center.x, center.y, currentRadius * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Organ membrane
  ctx.beginPath();
  ctx.arc(center.x, center.y, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = isFocused
    ? COLORS.organStroke.replace(/[\d.]+\)$/, "0.7)")
    : COLORS.organStroke;
  ctx.lineWidth = isFocused ? 2 : 1.5;
  ctx.stroke();
  ctx.fillStyle = COLORS.organFill;
  ctx.fill();

  // Icon
  const iconFn = ICONS[organ.icon];
  if (iconFn) {
    ctx.fillStyle = COLORS.organStroke;
    iconFn(ctx, center.x, center.y - 8, 20);
  }

  // Name
  ctx.font = "500 12px 'JetBrains Mono', monospace";
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(organ.name, center.x, center.y + 20);

  // Role (below name)
  ctx.font = "300 9px 'JetBrains Mono', monospace";
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(organ.role, center.x, center.y + 34);

  // Philosophy (only when focused)
  if (isFocused) {
    ctx.font = "italic 10px 'Fraunces', serif";
    ctx.fillStyle = COLORS.philosophy;
    ctx.fillText(
      `"${organ.philosophy}"`,
      center.x,
      center.y + currentRadius + 25,
    );
  }
}

function renderDataFlow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  _label: string,
  time: number,
): void {
  // Calculate direction
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  // Shorten line to not overlap organs
  const startX = from.x + nx * ORGAN_BASE_RADIUS;
  const startY = from.y + ny * ORGAN_BASE_RADIUS;
  const endX = to.x - nx * ORGAN_BASE_RADIUS;
  const endY = to.y - ny * ORGAN_BASE_RADIUS;

  // Pulsing effect on the flow
  const pulse = breathe(time, 3000);
  const alpha = lerp(0.1, 0.25, pulse);

  // Draw line
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = COLORS.flowLine.replace(/[\d.]+\)$/, `${alpha})`);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw arrow head
  const arrowSize = 8;
  const arrowX = endX - nx * 5;
  const arrowY = endY - ny * 5;

  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(
    arrowX - nx * arrowSize - ny * arrowSize * 0.5,
    arrowY - ny * arrowSize + nx * arrowSize * 0.5,
  );
  ctx.lineTo(
    arrowX - nx * arrowSize + ny * arrowSize * 0.5,
    arrowY - ny * arrowSize - nx * arrowSize * 0.5,
  );
  ctx.closePath();
  ctx.fillStyle = COLORS.flowArrow.replace(/[\d.]+\)$/, `${alpha + 0.1})`);
  ctx.fill();
}

/**
 * Hit test for organ selection.
 */
export function hitTestOrgan(
  x: number,
  y: number,
  width: number,
  height: number,
): string | null {
  const organs = organsData.organs as OrganData[];
  const organIds = organs.map((o) => o.id);

  const layout = calculateOrganLayout({ width, height, padding: 80 }, organIds);

  for (const item of layout) {
    if (isPointInCircle({ x, y }, item.center, item.radius + 10)) {
      return item.id;
    }
  }

  return null;
}
