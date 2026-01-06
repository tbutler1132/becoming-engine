"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  openStabilizeEpisode,
  openExploreEpisode,
  type VariableOption,
} from "@/app/actions";
import type { EpisodeType } from "@libs/memory";

interface NewEpisodeFormProps {
  episodeTypes: readonly string[];
  variables: VariableOption[];
}

export function NewEpisodeForm({
  episodeTypes,
  variables,
}: NewEpisodeFormProps): React.ReactNode {
  const router = useRouter();
  const [episodeType, setEpisodeType] = useState<EpisodeType>("Explore");
  const [objective, setObjective] = useState("");
  const [variableId, setVariableId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!objective.trim()) {
      setError("Objective is required");
      return;
    }

    if (episodeType === "Stabilize" && !variableId) {
      setError("Variable is required for Stabilize episodes");
      return;
    }

    setIsSaving(true);

    const result =
      episodeType === "Stabilize"
        ? await openStabilizeEpisode(variableId, objective.trim())
        : await openExploreEpisode(objective.trim());

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push(`/episodes/${result.value}`);
  }

  function handleCancel(): void {
    router.back();
  }

  return (
    <form onSubmit={handleSubmit}>
      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
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

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="episodeType"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Episode Type *
          </label>
          <select
            id="episodeType"
            value={episodeType}
            onChange={(e) => {
              setEpisodeType(e.target.value as EpisodeType);
              setVariableId(""); // Reset variable when type changes
            }}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              background: "transparent",
            }}
          >
            {episodeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.5rem",
            }}
          >
            {episodeType === "Stabilize"
              ? "Stabilize episodes restore viability for a specific variable."
              : "Explore episodes reduce uncertainty through learning."}
          </p>
        </div>

        {episodeType === "Stabilize" && (
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="variable"
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
              }}
            >
              Variable *
            </label>
            {variables.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.875rem" }}>
                No variables available.{" "}
                <a
                  href="/variables/new"
                  style={{ color: "#000", textDecoration: "underline" }}
                >
                  Create one first
                </a>
                .
              </p>
            ) : (
              <select
                id="variable"
                value={variableId}
                onChange={(e) => setVariableId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  background: "transparent",
                }}
              >
                <option value="">Select a variable…</option>
                {variables.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
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
            placeholder={
              episodeType === "Stabilize"
                ? "What are you trying to stabilize? (e.g., 'Restore sleep schedule to 7+ hours')"
                : "What are you exploring? (e.g., 'Learn whether morning workouts improve focus')"
            }
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              resize: "vertical",
            }}
          />
        </div>
      </section>

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
          {isSaving ? "Creating…" : "Create Episode"}
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

