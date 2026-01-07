/**
 * Type Guards for Runtime Validation
 *
 * Re-exports commonly-needed type guards from internal validation.
 * Use these when you need to validate unknown data at runtime
 * (e.g., user input, API responses, parsed JSON).
 *
 * @example
 * ```typescript
 * import { isVariableStatus, isNodeRef } from '@libs/memory';
 *
 * const status: unknown = parseUserInput();
 * if (isVariableStatus(status)) {
 *   // status is now typed as VariableStatus
 * }
 * ```
 *
 * @module Memory/Guards
 */

export {
  isNodeRef,
  isVariableStatus,
  isEpisodeType,
  isEpisodeStatus,
  isActionStatus,
  isModelType,
  isModelScope,
  isEnforcementLevel,
  isNoteTag,
  isLinkRelation,
  isMutationType,
  isOverrideDecision,
  isMeasurementCadence,
} from "./internal/validation.js";
