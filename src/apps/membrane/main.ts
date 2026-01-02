// Membrane client entry point

import { StateManager } from "./client/index.js";
import type { ClientState } from "./client/index.js";
import { createRenderer } from "./canvas/index.js";
import { createInteractionHandler } from "./client/interaction.js";

// DOM elements
const canvas = document.getElementById("membrane-canvas") as HTMLCanvasElement;
const connectionStatus = document.getElementById("connection-status")!;
const levelIndicator = document.getElementById("level-indicator")!;
const philosophyFragment = document.getElementById("philosophy-fragment")!;

// Philosophy fragments for ambient display
const PHILOSOPHY_FRAGMENTS = [
  "When nothing is wrong, the system disappears.",
  "Idleness is a success state.",
  "All interventions are temporary.",
  "Viability, not optimization.",
  "Baseline is the goal.",
  "Organisms regulate independently.",
  "Episodes are finite and must be closeable.",
  "Learning happens when pressure is low enough to allow it.",
] as const;

let currentFragmentIndex = 0;

function showNextFragment(): void {
  const fragment = PHILOSOPHY_FRAGMENTS[currentFragmentIndex];
  if (fragment) {
    philosophyFragment.textContent = fragment;
    philosophyFragment.classList.add("visible");

    setTimeout(() => {
      philosophyFragment.classList.remove("visible");
    }, 5000);
  }

  currentFragmentIndex =
    (currentFragmentIndex + 1) % PHILOSOPHY_FRAGMENTS.length;
}

// Initialize state manager
const stateManager = new StateManager();

// Initialize renderer
const renderer = createRenderer(canvas);

// Initialize interaction handler
const interaction = createInteractionHandler(canvas, stateManager, renderer);

// Subscribe to state changes
stateManager.subscribe((state: ClientState) => {
  // Update connection status
  if (state.connected) {
    connectionStatus.textContent = "Connected";
    connectionStatus.classList.add("connected");
  } else {
    connectionStatus.textContent = "Disconnected";
    connectionStatus.classList.remove("connected");
  }

  // Update level indicator
  const levelNames: Record<ClientState["viewLevel"], string> = {
    organism: "Organism",
    organs: "Organs",
    files: "Files",
    codeGraph: "Code Graph",
  };
  levelIndicator.textContent = levelNames[state.viewLevel];

  // Render current state
  renderer.render(state);
});

// Connect to server
stateManager.connect();

// Show philosophy fragments periodically
showNextFragment();
setInterval(showNextFragment, 12000);

// Handle window resize
function handleResize(): void {
  renderer.resize();
  renderer.render(stateManager.getState());
}

window.addEventListener("resize", handleResize);

// Initial resize
handleResize();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  stateManager.disconnect();
  interaction.destroy();
});
