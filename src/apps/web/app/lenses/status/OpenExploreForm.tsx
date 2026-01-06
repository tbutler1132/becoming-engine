"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openExploreEpisode } from "@/app/actions";

export function OpenExploreForm(): React.ReactNode {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [objective, setObjective] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!objective.trim()) {
      setError("Objective is required");
      return;
    }

    setIsSaving(true);

    const result = await openExploreEpisode(objective.trim());

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.refresh();
    setIsExpanded(false);
    setObjective("");
  }

  function handleCancel(): void {
    setIsExpanded(false);
    setObjective("");
    setError(null);
  }

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        style={{
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          border: "1px dashed #ccc",
          borderRadius: "4px",
          background: "transparent",
          cursor: "pointer",
          color: "#666",
          width: "100%",
        }}
      >
        + Open Explore Episode
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          color: "#666",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.5rem",
        }}
      >
        Open Explore Episode
      </div>

      <p
        style={{
          fontSize: "0.875rem",
          color: "#666",
          marginBottom: "1rem",
        }}
      >
        Explore episodes reduce uncertainty through learning. They require a
        Model update to close.
      </p>

      {error && (
        <p
          style={{
            color: "#dc2626",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </p>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="objective"
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.5rem",
          }}
        >
          Objective *
        </label>
        <textarea
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="What are you exploring? (e.g., 'Learn whether morning workouts improve focus')"
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "0.75rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontFamily: "inherit",
            fontSize: "inherit",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#000",
            color: "#fff",
            cursor: isSaving ? "not-allowed" : "pointer",
            opacity: isSaving ? 0.5 : 1,
          }}
        >
          {isSaving ? "Opening…" : "Open Episode"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "transparent",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

