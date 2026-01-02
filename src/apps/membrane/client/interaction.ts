// Interaction handler: mouse, keyboard, and zoom controls

import type { StateManager } from "./state.js";
import type { Renderer } from "./renderer.js";
import { hitTestOrgan } from "../canvas/organs.js";
import { isPointInCircle } from "../canvas/layout.js";
import { getNodePositions } from "../canvas/organism.js";

const NODE_HIT_RADIUS = 130;

export interface InteractionHandler {
  destroy(): void;
}

export function createInteractionHandler(
  canvas: HTMLCanvasElement,
  stateManager: StateManager,
  _renderer: Renderer,
): InteractionHandler {
  let isDestroyed = false;

  function getCanvasCoords(event: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handleClick(event: MouseEvent): void {
    if (isDestroyed) return;

    const { x, y } = getCanvasCoords(event);
    const state = stateManager.getState();
    const rect = canvas.getBoundingClientRect();

    if (state.viewLevel === "organism") {
      // Check if clicking on a node to zoom into organs
      const positions = getNodePositions(rect.width, rect.height);

      if (
        isPointInCircle({ x, y }, positions.personal, NODE_HIT_RADIUS) ||
        isPointInCircle({ x, y }, positions.org, NODE_HIT_RADIUS)
      ) {
        stateManager.setViewLevel("organs");
      }
    } else if (state.viewLevel === "organs") {
      // Check if clicking on an organ
      const organId = hitTestOrgan(x, y, rect.width, rect.height);

      if (organId) {
        // Toggle focus on organ
        if (state.focusedOrgan === organId) {
          stateManager.setFocusedOrgan(null);
        } else {
          stateManager.setFocusedOrgan(organId);
        }
      } else {
        // Clicking empty space clears focus
        stateManager.setFocusedOrgan(null);
      }
    }
  }

  function handleMouseMove(event: MouseEvent): void {
    if (isDestroyed) return;

    const { x, y } = getCanvasCoords(event);
    const state = stateManager.getState();
    const rect = canvas.getBoundingClientRect();

    // Update cursor based on what's under it
    if (state.viewLevel === "organism") {
      const positions = getNodePositions(rect.width, rect.height);
      const overNode =
        isPointInCircle({ x, y }, positions.personal, NODE_HIT_RADIUS) ||
        isPointInCircle({ x, y }, positions.org, NODE_HIT_RADIUS);

      canvas.style.cursor = overNode ? "pointer" : "default";
    } else if (state.viewLevel === "organs") {
      const organId = hitTestOrgan(x, y, rect.width, rect.height);
      canvas.style.cursor = organId ? "pointer" : "default";
    }
  }

  function handleWheel(event: WheelEvent): void {
    if (isDestroyed) return;

    event.preventDefault();

    const state = stateManager.getState();

    // Scroll down = zoom in, scroll up = zoom out
    if (event.deltaY > 0) {
      // Zoom in
      if (state.viewLevel === "organism") {
        stateManager.setViewLevel("organs");
      }
      // Future: organs -> files -> codeGraph
    } else {
      // Zoom out
      if (state.viewLevel === "organs") {
        stateManager.setFocusedOrgan(null);
        stateManager.setViewLevel("organism");
      }
      // Future: codeGraph -> files -> organs -> organism
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (isDestroyed) return;

    const state = stateManager.getState();

    if (event.key === "Escape") {
      // Escape zooms out or clears focus
      if (state.focusedOrgan) {
        stateManager.setFocusedOrgan(null);
      } else if (state.viewLevel !== "organism") {
        stateManager.setViewLevel("organism");
      }
    }

    // Number keys for quick organ selection (when in organs view)
    if (state.viewLevel === "organs") {
      const organKeys: Record<string, string> = {
        "1": "sensorium",
        "2": "cortex",
        "3": "regulator",
        "4": "memory",
      };

      if (event.key in organKeys) {
        const organId = organKeys[event.key] ?? null;
        if (state.focusedOrgan === organId) {
          stateManager.setFocusedOrgan(null);
        } else {
          stateManager.setFocusedOrgan(organId);
        }
      }
    }
  }

  // Attach event listeners
  canvas.addEventListener("click", handleClick);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  document.addEventListener("keydown", handleKeyDown);

  function destroy(): void {
    isDestroyed = true;
    canvas.removeEventListener("click", handleClick);
    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("wheel", handleWheel);
    document.removeEventListener("keydown", handleKeyDown);
  }

  return { destroy };
}
