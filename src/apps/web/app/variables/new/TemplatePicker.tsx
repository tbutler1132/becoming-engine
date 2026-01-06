"use client";

import type { ArticulationTemplate } from "@libs/memory";

interface TemplatePickerProps {
  templates: readonly ArticulationTemplate[];
  selectedId: string | null;
  onSelect: (template: ArticulationTemplate | null) => void;
}

/**
 * Template picker for selecting articulation templates.
 * Displays templates as cards with doctrine-aligned copy.
 */
export function TemplatePicker({
  templates,
  selectedId,
  onSelect,
}: TemplatePickerProps): React.ReactNode {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <header style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.25rem",
          }}
        >
          Start from a template
        </h2>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
          }}
        >
          Meta-viability dimensions — customize for your context
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {/* Start from scratch option */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            padding: "1rem",
            border: selectedId === null ? "2px solid #000" : "1px solid #ccc",
            borderRadius: "6px",
            background: selectedId === null ? "#f5f5f5" : "white",
            textAlign: "left",
            cursor: "pointer",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <div
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "0.25rem",
            }}
          >
            Start from scratch
          </div>
          <div style={{ fontSize: "0.75rem", color: "#666" }}>
            Define your own viability dimension
          </div>
        </button>

        {/* Template cards */}
        {templates.map((template) => {
          const isSelected = selectedId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              style={{
                padding: "1rem",
                border: isSelected ? "2px solid #000" : "1px solid #ccc",
                borderRadius: "6px",
                background: isSelected ? "#f5f5f5" : "white",
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.25rem",
                }}
              >
                {template.name}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#666",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {template.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Show rationale when template is selected */}
      {selectedId !== null && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#f0f9ff",
            borderLeft: "3px solid #0ea5e9",
            borderRadius: "0 4px 4px 0",
            fontSize: "0.75rem",
            color: "#0c4a6e",
          }}
        >
          <strong>Why this matters:</strong>{" "}
          {templates.find((t) => t.id === selectedId)?.rationale}
        </div>
      )}
    </section>
  );
}

