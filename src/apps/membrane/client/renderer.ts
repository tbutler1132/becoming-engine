// Canvas orchestrator: manages rendering loop and layer switching

import type { ClientState } from "./types.js";
import { renderOrganismLayer } from "../canvas/organism.js";
import { renderOrgansLayer } from "../canvas/organs.js";
import { easeOutCubic } from "../canvas/animation.js";

const BG_COLOR = "#0a0e14";
const TRANSITION_DURATION_MS = 600;

export interface Renderer {
  render(state: ClientState): void;
  resize(): void;
  getCanvas(): HTMLCanvasElement;
  destroy(): void;
}

interface TransitionState {
  from: ClientState["viewLevel"];
  to: ClientState["viewLevel"];
  startTime: number;
  progress: number;
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext("2d")!;
  let animationFrameId: number | null = null;
  let currentState: ClientState | null = null;
  let transition: TransitionState | null = null;
  let lastLevel: ClientState["viewLevel"] = "organism";

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
  }

  function clear(): void {
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  function renderFrame(time: number): void {
    if (!currentState) return;

    const rect = canvas.getBoundingClientRect();
    clear();

    // Update transition
    if (transition) {
      const elapsed = time - transition.startTime;
      transition.progress = Math.min(1, elapsed / TRANSITION_DURATION_MS);

      if (transition.progress >= 1) {
        transition = null;
      }
    }

    const context = {
      ctx,
      time,
      width: rect.width,
      height: rect.height,
    };

    // Calculate blend factor for transitions
    const transitionProgress = transition
      ? easeOutCubic(transition.progress)
      : 1;

    // Determine which layers to render based on view level
    const level = currentState.viewLevel;

    if (transition && transition.from !== transition.to) {
      // During transition, render both layers with appropriate alpha
      ctx.save();

      if (transition.from === "organism" && transition.to === "organs") {
        // Zooming in: fade out organism, fade in organs
        ctx.globalAlpha = 1 - transitionProgress;
        renderOrganismLayer(context, currentState);
        ctx.globalAlpha = transitionProgress;
        renderOrgansLayer(context, currentState);
      } else if (transition.from === "organs" && transition.to === "organism") {
        // Zooming out: fade out organs, fade in organism
        ctx.globalAlpha = 1 - transitionProgress;
        renderOrgansLayer(context, currentState);
        ctx.globalAlpha = transitionProgress;
        renderOrganismLayer(context, currentState);
      }

      ctx.restore();
    } else {
      // No transition, render current level
      if (level === "organism") {
        renderOrganismLayer(context, currentState);
      } else if (level === "organs") {
        renderOrgansLayer(context, currentState);
      }
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  }

  function render(state: ClientState): void {
    // Check for level change
    if (state.viewLevel !== lastLevel && !transition) {
      transition = {
        from: lastLevel,
        to: state.viewLevel,
        startTime: performance.now(),
        progress: 0,
      };
    }

    lastLevel = state.viewLevel;
    currentState = state;

    // Start animation loop if not already running
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(renderFrame);
    }
  }

  function destroy(): void {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  // Initial resize
  resize();

  return {
    render,
    resize,
    getCanvas: () => canvas,
    destroy,
  };
}
