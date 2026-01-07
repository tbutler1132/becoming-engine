/**
 * Membrane Client — Main Entry Point
 *
 * Bootstraps the visualization: connects to server, manages state, runs render loop.
 */

import {
  createInitialState,
  handleDiscovery,
  setStatus,
  setDimensions,
  tick,
  pulseOrgan,
  decayPulses,
  parseMessage,
} from "./state.js";
import { render } from "./renderer.js";
import { findHovered, renderTooltip, type HoverInfo } from "./interaction.js";
import type { ClientState } from "./types.js";

const WS_URL = "ws://localhost:3030";
const RECONNECT_DELAY = 2000;

/** Current application state */
let state: ClientState = createInitialState();

/** Canvas and context */
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

/** Status element */
let statusEl: HTMLElement;

/** WebSocket connection */
let ws: WebSocket | null = null;

/** Current hover state */
let hoverInfo: HoverInfo | null = null;

/** Mouse position */
let mouseX = 0;
let mouseY = 0;

/**
 * Initialize the application.
 */
function init(): void {
  // Get DOM elements
  canvas = document.getElementById("canvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d")!;
  statusEl = document.getElementById("status")!;

  // Set up canvas sizing
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Set up mouse tracking
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseleave", handleMouseLeave);

  // Connect to server
  connect();

  // Start render loop
  requestAnimationFrame(loop);
}

/**
 * Resize canvas to match window.
 */
function resizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx.scale(dpr, dpr);

  state = setDimensions(state, width, height);
}

/**
 * Connect to WebSocket server.
 */
function connect(): void {
  state = setStatus(state, "connecting");
  updateStatusDisplay();

  ws = new WebSocket(WS_URL);

  ws.onopen = (): void => {
    state = setStatus(state, "connected");
    updateStatusDisplay();
    console.log("[Membrane] Connected to server");
  };

  ws.onmessage = (event): void => {
    const message = parseMessage(event.data as string);
    if (!message) return;

    switch (message.type) {
      case "discovery":
        state = handleDiscovery(state, message.data);
        console.log(
          `[Membrane] Discovery: ${message.data.organs.length} organs, ${message.data.surfaces.length} surfaces`,
        );
        break;

      case "change":
        if (message.event.moduleId && message.event.moduleType === "organ") {
          state = pulseOrgan(state, message.event.moduleId);
        }
        console.log(`[Membrane] File changed: ${message.event.path}`);
        break;

      case "error":
        console.error(`[Membrane] Server error: ${message.message}`);
        break;
    }
  };

  ws.onclose = (): void => {
    state = setStatus(state, "disconnected");
    updateStatusDisplay();
    console.log("[Membrane] Disconnected, reconnecting...");

    // Reconnect after delay
    setTimeout(connect, RECONNECT_DELAY);
  };

  ws.onerror = (): void => {
    state = setStatus(state, "error");
    updateStatusDisplay();
  };
}

/**
 * Update the status display element.
 */
function updateStatusDisplay(): void {
  statusEl.className = state.status;

  switch (state.status) {
    case "connecting":
      statusEl.textContent = "Connecting...";
      break;
    case "connected":
      statusEl.textContent = "Connected";
      break;
    case "disconnected":
      statusEl.textContent = "Disconnected — reconnecting...";
      break;
    case "error":
      statusEl.textContent = "Connection error";
      break;
  }
}

/** Last frame timestamp for delta calculation */
let lastTime = 0;

/**
 * Handle mouse movement.
 */
function handleMouseMove(event: MouseEvent): void {
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;

  // Update hover state
  hoverInfo = findHovered(state, mouseX, mouseY);

  // Update cursor
  canvas.style.cursor = hoverInfo ? "pointer" : "default";
}

/**
 * Handle mouse leaving canvas.
 */
function handleMouseLeave(): void {
  hoverInfo = null;
  canvas.style.cursor = "default";
}

/**
 * Main render loop.
 */
function loop(time: number): void {
  const delta = lastTime ? time - lastTime : 0;
  lastTime = time;

  // Update state
  state = tick(state, time);
  state = decayPulses(state, delta);

  // Render main visualization
  render(ctx, state);

  // Render tooltip if hovering
  if (hoverInfo) {
    renderTooltip(ctx, hoverInfo, state.width, state.height);
  }

  // Next frame
  requestAnimationFrame(loop);
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
