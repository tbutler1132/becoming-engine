"use client";

import { useState } from "react";
import { updateEpisode } from "@/app/actions";

interface EpisodeEditorProps {
  episodeId: string;
  initialObjective: string;
  initialTimeboxDays?: number;
  openedAt: string;
}

export function EpisodeEditor({
  episodeId,
  initialObjective,
  initialTimeboxDays,
  openedAt,
}: EpisodeEditorProps): React.ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [objective, setObjective] = useState(initialObjective);
  const [timeboxDays, setTimeboxDays] = useState<number | null>(
    initialTimeboxDays ?? null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For resetting on cancel
  const [savedObjective, setSavedObjective] = useState(initialObjective);
  const [savedTimeboxDays, setSavedTimeboxDays] = useState<number | null>(
    initialTimeboxDays ?? null,
  );

  function handleEdit(): void {
    setIsEditing(true);
    setError(null);
  }

  function handleCancel(): void {
    setObjective(savedObjective);
    setTimeboxDays(savedTimeboxDays);
    setError(null);
    setIsEditing(false);
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      const result = await updateEpisode(
        episodeId,
        objective !== savedObjective ? objective : undefined,
        timeboxDays !== savedTimeboxDays ? timeboxDays : undefined,
      );

      if (!result.ok) {
        setError(result.error);
        setIsSaving(false);
        return;
      }

      // Success - update saved state and exit edit mode
      setSavedObjective(objective);
      setSavedTimeboxDays(timeboxDays);
      setIsSaving(false);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Page Header with Edit/Save/Cancel */}
      <header style={{ marginBottom: "2rem" }}>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Episode
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>
            {isEditing ? objective : savedObjective}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
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
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
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
              </>
            ) : (
              <button
                onClick={handleEdit}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </header>

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

      {/* Objective Section */}
      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          Objective
        </h2>

        {isEditing ? (
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        ) : (
          <p style={{ margin: 0 }}>{savedObjective}</p>
        )}
      </section>

      {/* Timebox Section */}
      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          Timebox
        </h2>

        {isEditing ? (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="number"
              value={timeboxDays ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                setTimeboxDays(value === "" ? null : parseInt(value, 10));
              }}
              min="1"
              placeholder="Days"
              style={{
                width: "120px",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
            />
            <span style={{ fontSize: "0.875rem", color: "#666" }}>days</span>
            {timeboxDays !== null && (
              <button
                onClick={() => setTimeboxDays(null)}
                style={{
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <p style={{ margin: 0 }}>
            {savedTimeboxDays !== null && savedTimeboxDays !== undefined
              ? `${savedTimeboxDays} day${savedTimeboxDays !== 1 ? "s" : ""}`
              : "No timebox set"}
          </p>
        )}
      </section>
    </>
  );
}

