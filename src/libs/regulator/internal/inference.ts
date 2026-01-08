/**
 * Status Inference — Pure Logic for Deriving Variable Status
 *
 * This module provides pure functions for inferring Variable status
 * from proxy readings. Inference *suggests* but never auto-applies.
 *
 * Doctrine alignment:
 * - Section 6: Beliefs are made explicit (thresholds are beliefs)
 * - Section 7: Human in the loop (suggestions require confirmation)
 *
 * @module Regulator/Internal/Inference
 */

import type {
  Proxy,
  ProxyReading,
  VariableStatus,
} from "../../memory/index.js";

/**
 * A status suggestion derived from proxy readings.
 * Suggestions are informative, not authoritative.
 */
export interface StatusSuggestion {
  /** The Variable this suggestion applies to */
  variableId: string;
  /** The suggested status based on readings */
  suggestedStatus: VariableStatus;
  /** Confidence level 0.0-1.0 based on reading consistency */
  confidence: number;
  /** Reading IDs that informed this suggestion */
  basedOn: string[];
  /** Human-readable explanation of the inference */
  reason: string;
}

/**
 * Infers a status suggestion from recent proxy readings.
 *
 * **Intent:** Provide suggested status based on measured data.
 * The user must confirm before any status change is applied.
 *
 * **Contract:**
 * - Returns: StatusSuggestion if inference is possible, null otherwise
 * - Requires: Proxy with thresholds, at least one numeric reading
 * - Pure function: does not mutate inputs
 *
 * **Inference logic:**
 * - For numeric proxies with thresholds:
 *   - If average value < lowBelow → suggest "Low"
 *   - If average value > highAbove → suggest "High"
 *   - Otherwise → suggest "InRange"
 * - Confidence is based on consistency of readings (low variance = high confidence)
 */
export function inferStatus(
  proxy: Proxy,
  recentReadings: ProxyReading[],
): StatusSuggestion | null {
  // Only numeric proxies with thresholds can be inferred
  if (proxy.valueType !== "numeric") {
    return null;
  }

  if (!proxy.thresholds) {
    return null;
  }

  // Need at least one reading
  if (recentReadings.length === 0) {
    return null;
  }

  // Extract numeric values
  const numericValues: number[] = [];
  const readingIds: string[] = [];

  for (const reading of recentReadings) {
    if (reading.value.type === "numeric") {
      numericValues.push(reading.value.value);
      readingIds.push(reading.id);
    }
  }

  if (numericValues.length === 0) {
    return null;
  }

  // Calculate average
  const sum = numericValues.reduce((acc, val) => acc + val, 0);
  const average = sum / numericValues.length;

  // Calculate variance for confidence
  const squaredDiffs = numericValues.map((val) => Math.pow(val - average, 2));
  const variance =
    squaredDiffs.reduce((acc, val) => acc + val, 0) / numericValues.length;
  const stdDev = Math.sqrt(variance);

  // Confidence decreases with higher variance
  // Normalize: if stdDev is 0, confidence is 1.0; scales down with higher variance
  // Using a simple heuristic: confidence = 1 / (1 + stdDev/average)
  const normalizedStdDev = average !== 0 ? stdDev / Math.abs(average) : stdDev;
  const confidence = Math.max(0.1, 1 / (1 + normalizedStdDev));

  // Determine suggested status based on thresholds
  const { lowBelow, highAbove } = proxy.thresholds;
  let suggestedStatus: VariableStatus;
  let reason: string;

  if (lowBelow !== undefined && average < lowBelow) {
    suggestedStatus = "Low";
    reason = `Average value (${average.toFixed(2)}) is below threshold (${lowBelow})`;
  } else if (highAbove !== undefined && average > highAbove) {
    suggestedStatus = "High";
    reason = `Average value (${average.toFixed(2)}) is above threshold (${highAbove})`;
  } else {
    suggestedStatus = "InRange";
    reason = `Average value (${average.toFixed(2)}) is within acceptable range`;
  }

  return {
    variableId: proxy.variableId,
    suggestedStatus,
    confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
    basedOn: readingIds,
    reason: `${reason} based on ${numericValues.length} reading(s)`,
  };
}

/**
 * Infers status for all proxies of a variable.
 *
 * **Intent:** Aggregate suggestions from multiple proxies.
 * If proxies disagree, returns the suggestion with highest confidence.
 *
 * **Contract:**
 * - Returns: Best StatusSuggestion if any inference is possible, null otherwise
 * - Pure function: does not mutate inputs
 */
export function inferStatusForVariable(
  proxies: Proxy[],
  readingsByProxyId: Map<string, ProxyReading[]>,
): StatusSuggestion | null {
  const suggestions: StatusSuggestion[] = [];

  for (const proxy of proxies) {
    const readings = readingsByProxyId.get(proxy.id) ?? [];
    const suggestion = inferStatus(proxy, readings);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  if (suggestions.length === 0) {
    return null;
  }

  // Return the suggestion with highest confidence
  return suggestions.reduce((best, current) =>
    current.confidence > best.confidence ? current : best,
  );
}
