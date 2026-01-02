// Layout calculations: positioning for nodes, variables, organs

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutConfig {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

/**
 * Calculates positions for two organism nodes (Personal and Org).
 * Places them horizontally with space between.
 */
export function calculateNodePositions(
  config: LayoutConfig,
  _nodeRadius: number,
): { personal: Point; org: Point } {
  const centerY = config.height / 2;
  const spacing = Math.min(config.width * 0.35, 300);

  return {
    personal: {
      x: config.width / 2 - spacing,
      y: centerY,
    },
    org: {
      x: config.width / 2 + spacing,
      y: centerY,
    },
  };
}

/**
 * Distributes variables in a circular pattern around a node center.
 */
export function distributeVariablesCircular(
  center: Point,
  count: number,
  radius: number,
  startAngle: number = -Math.PI / 2,
): Point[] {
  if (count === 0) return [];
  if (count === 1) return [center];

  const points: Point[] = [];
  const angleStep = (Math.PI * 2) / count;

  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }

  return points;
}

/**
 * Calculates organ positions in a horizontal flow layout.
 */
export interface OrganLayout {
  readonly id: string;
  readonly center: Point;
  readonly radius: number;
}

export function calculateOrganLayout(
  config: LayoutConfig,
  organIds: readonly string[],
): OrganLayout[] {
  const { width, height, padding } = config;
  const usableWidth = width - padding * 2;
  const centerY = height / 2;

  // Special layout for the becoming-engine organs
  // Flow: Sensorium -> Cortex -> Regulator -> Memory
  const organOrder = ["sensorium", "cortex", "regulator", "memory"];
  const orderedIds = organOrder.filter((id) => organIds.includes(id));

  // Add any organs not in the predefined order
  for (const id of organIds) {
    if (!orderedIds.includes(id)) {
      orderedIds.push(id);
    }
  }

  const count = orderedIds.length;
  if (count === 0) return [];

  const spacing = usableWidth / (count + 1);
  const radius = Math.min(spacing * 0.35, 80);

  return orderedIds.map((id, index) => ({
    id,
    center: {
      x: padding + spacing * (index + 1),
      y: centerY,
    },
    radius,
  }));
}

/**
 * Checks if a point is within a circle.
 */
export function isPointInCircle(
  point: Point,
  center: Point,
  radius: number,
): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Calculates distance between two points.
 */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Gets the center point of a canvas.
 */
export function getCanvasCenter(canvas: HTMLCanvasElement): Point {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
}
