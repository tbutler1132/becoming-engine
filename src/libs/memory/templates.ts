/**
 * Articulation Templates — Shareable Vocabulary Artifacts
 *
 * Templates are NOT state — they are articulation artifacts that suggest
 * how to name and frame viability dimensions. They produce Variables
 * when instantiated.
 *
 * Doctrine alignment:
 * - Section 9: Organisms "interact via signals and artifacts"
 * - Section 6: Explicit beliefs can be shared as starting points
 * - Section 5a: Preferred ranges are beliefs, not prescriptions
 *
 * @module Memory
 */

import type { MeasurementCadence } from "./types.js";

/**
 * An ArticulationTemplate is a shareable vocabulary artifact.
 * It suggests how to name and frame a viability dimension.
 * Templates are NOT state — they produce Variables when instantiated.
 */
export interface ArticulationTemplate {
  /** Unique identifier for this template */
  readonly id: string;
  /** Common name for this viability dimension */
  readonly name: string;
  /** What this dimension regulates */
  readonly description: string;
  /**
   * Example preferred range — explicitly a starting belief.
   * Users should customize this for their context.
   */
  readonly suggestedPreferredRange: string;
  /** Suggested measurement frequency */
  readonly suggestedCadence: MeasurementCadence;
  /**
   * Doctrine-aligned rationale: why this dimension matters for viability.
   * Helps users understand the regulatory purpose.
   */
  readonly rationale: string;
  /**
   * Origin of this template (for future sharing/attribution).
   * - "builtin" = ships with Becoming Engine
   * - Future: "user:abc123" or "import:pack-name"
   */
  readonly origin: "builtin" | string;
}

/**
 * Built-in articulation templates for common meta-viability dimensions.
 *
 * These are higher-level abstractions than common "life areas" — they
 * represent fundamental capacities that underlie all specific regulation.
 *
 * Users should customize suggestedPreferredRange for their context.
 * Status is always Unknown on instantiation (user assesses their own situation).
 */
export const BUILTIN_TEMPLATES: readonly ArticulationTemplate[] = [
  {
    id: "continuity",
    name: "Continuity",
    description:
      "Ability to continue functioning without collapse across physical, psychological, and material dimensions.",
    suggestedPreferredRange:
      "Sleep is consistent, energy is usable most days, finances are not a constant background stress, and my nervous system feels basically steady.",
    suggestedCadence: "weekly",
    rationale:
      "Continuity is baseline viability. Without it, no other regulation is possible. (Doctrine §3: remains functional)",
    origin: "builtin",
  },
  {
    id: "coherence",
    name: "Coherence",
    description:
      "Degree of internal consistency and integration across beliefs, actions, and identity over time.",
    suggestedPreferredRange:
      "My actions align with my stated beliefs; I don't feel fragmented or contradictory across contexts.",
    suggestedCadence: "monthly",
    rationale:
      "Coherence prevents identity drift and decision fatigue. Incoherence creates hidden costs. (Doctrine §7: legibility over moralization)",
    origin: "builtin",
  },
  {
    id: "social-embeddedness",
    name: "Social Embeddedness",
    description:
      "Degree of stable integration into ongoing social systems and relationships that persist over time.",
    suggestedPreferredRange:
      "I feel socially held by persistent relationships and contexts, such that week-to-week variability does not threaten my sense of belonging or continuity.",
    suggestedCadence: "weekly",
    rationale:
      "Social infrastructure provides feedback, support, and reality-testing. Isolation degrades all other capacities.",
    origin: "builtin",
  },
  {
    id: "optionality",
    name: "Optionality",
    description:
      "Degree of freedom to adapt or pivot without being forced into brittle or irreversible decisions.",
    suggestedPreferredRange:
      "I am not under acute pressure from any single constraint, and at least one credible alternative path exists if circumstances change.",
    suggestedCadence: "monthly",
    rationale:
      "Optionality is viability under uncertainty. Low optionality forces premature optimization. (Doctrine §3: maintains optionality, avoids brittleness)",
    origin: "builtin",
  },
  {
    id: "agency",
    name: "Agency",
    description:
      "Ability to initiate actions and reliably produce effects in the world through closed action-feedback loops.",
    suggestedPreferredRange:
      "I can externalize intentions into a trusted system, initiate small actions without excessive deliberation, and reliably complete loops such that action produces visible effects.",
    suggestedCadence: "weekly",
    rationale:
      "Agency is the capacity to intervene. Without it, regulation is impossible. (Doctrine §4: intervenes only when drift accumulates)",
    origin: "builtin",
  },
  {
    id: "meaningful-engagement",
    name: "Meaningful Engagement",
    description:
      "Degree of emotional investment, aliveness, and care in lived experience and ongoing pursuits.",
    suggestedPreferredRange:
      "I feel genuinely invested in what I'm building, with engagement flowing from high-level conviction into daily action, even if intensity varies.",
    suggestedCadence: "weekly",
    rationale:
      "Engagement is not forced meaning — it emerges when viability allows. (Doctrine §10: Meaning is allowed to emerge. Ambition is permitted, not enforced.)",
    origin: "builtin",
  },
  {
    id: "learning",
    name: "Learning",
    description:
      "Ability to update internal models of self and world in response to evidence, leading to durable behavioral and narrative change.",
    suggestedPreferredRange:
      "I notice surprises, revise my assumptions, and see my behavior and self-narratives change over time in response to lived experience.",
    suggestedCadence: "monthly",
    rationale:
      "Learning is explicit model update. If nothing changes, learning has not occurred. (Doctrine §6: a belief is made explicit, a procedure is articulated)",
    origin: "builtin",
  },
] as const;
