// Animation utilities: easing, spring physics, breathing cycles

/**
 * Spring physics simulation for organic motion.
 * Returns the new position and velocity.
 */
export interface SpringState {
  readonly position: number;
  readonly velocity: number;
}

export interface SpringConfig {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
}

export const DEFAULT_SPRING_CONFIG: SpringConfig = {
  stiffness: 170,
  damping: 26,
  mass: 1,
} as const;

export const GENTLE_SPRING_CONFIG: SpringConfig = {
  stiffness: 80,
  damping: 20,
  mass: 1,
} as const;

/**
 * Advances spring simulation by one frame.
 * Pure function: (state, target, config, deltaTime) => newState
 */
export function advanceSpring(
  state: SpringState,
  target: number,
  config: SpringConfig,
  deltaTime: number,
): SpringState {
  const { stiffness, damping, mass } = config;
  const { position, velocity } = state;

  // Spring force: F = -k * (x - target)
  const springForce = -stiffness * (position - target);

  // Damping force: F = -c * v
  const dampingForce = -damping * velocity;

  // Acceleration: a = F / m
  const acceleration = (springForce + dampingForce) / mass;

  // Euler integration
  const newVelocity = velocity + acceleration * deltaTime;
  const newPosition = position + newVelocity * deltaTime;

  return {
    position: newPosition,
    velocity: newVelocity,
  };
}

/**
 * Checks if spring has settled (close enough to target with low velocity).
 */
export function isSpringSettled(
  state: SpringState,
  target: number,
  threshold: number = 0.01,
): boolean {
  return (
    Math.abs(state.position - target) < threshold &&
    Math.abs(state.velocity) < threshold
  );
}

/**
 * Breathing cycle: slow sine wave for organic pulsing.
 * Returns a value between 0 and 1.
 */
export function breathe(time: number, periodMs: number = 4000): number {
  const phase = (time % periodMs) / periodMs;
  return (Math.sin(phase * Math.PI * 2) + 1) / 2;
}

/**
 * Pulse decay: exponential falloff for activity pulses.
 * Returns a value between 0 and 1.
 */
export function pulseDecay(age: number, decayMs: number = 3000): number {
  if (age >= decayMs) return 0;
  return Math.exp(-3 * (age / decayMs));
}

/**
 * Tremor effect: rapid small oscillations for tension visualization.
 * Returns an offset value (can be negative).
 */
export function tremor(
  time: number,
  intensity: number = 1,
  frequency: number = 30,
): number {
  const base = Math.sin(time * frequency * 0.001) * 0.5;
  const noise = Math.sin(time * frequency * 0.0017) * 0.3;
  const highFreq = Math.sin(time * frequency * 0.003) * 0.2;
  return (base + noise + highFreq) * intensity;
}

/**
 * Easing functions for smooth transitions.
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Interpolates between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
