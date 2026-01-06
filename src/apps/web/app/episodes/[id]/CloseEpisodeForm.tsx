"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeEpisode } from "@/app/actions";
import type { EpisodeType } from "@libs/memory";

interface CloseEpisodeFormProps {
  episodeId: string;
  episodeType: EpisodeType;
  currentStatus: string;
}

export function CloseEpisodeForm({
  episodeId,
  episodeType,
  currentStatus,
}: CloseEpisodeFormProps): React.ReactNode {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [closureNote, setClosureNote] = useState("");
  const [modelStatement, setModelStatement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show if already closed
  if (currentStatus === "Closed") {
    return null;
  }

  const isExplore = episodeType === "Explore";
  const canSubmit =
    closureNote.trim().length > 0 &&
    (!isExplore || modelStatement.trim().length > 0);

  async function handleClose(): Promise<void> {
    if (!canSubmit) return;

    setError(null);
    setIsSubmitting(true);

    const result = await closeEpisode(
      episodeId,
      closureNote,
      episodeType,
      isExplore ? modelStatement : undefined
    );

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    setIsSubmitting(false);
  }

  if (!isExpanded) {
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <div
          style={{
            padding: "1rem",
            border: "2px solid #d97706",
            borderRadius: "8px",
            background: "rgba(217, 119, 6, 0.05)",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.75rem",
            }}
          >
            Regulatory Action
          </p>
          <button
            onClick={() => setIsExpanded(true)}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              borderRadius: "6px",
              background: "#d97706",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1rem" }}>⏹</span>
            Close Episode
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div
        style={{
          padding: "1.5rem",
          border: "2px solid #d97706",
          borderRadius: "8px",
          background: "rgba(217, 119, 6, 0.05)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          Close Episode
        </p>

        {/* Closure Note */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="closureNote"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "0.5rem",
            }}
          >
            Closure Note <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginBottom: "0.5rem",
            }}
          >
            What happened? What was the outcome?
          </p>
          <textarea
            id="closureNote"
            value={closureNote}
            onChange={(e) => setClosureNote(e.target.value)}
            placeholder="Describe the outcome of this episode..."
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Model Statement (required for Explore) */}
        {isExplore && (
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="modelStatement"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              What Did You Learn? <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <p
              style={{
                fontSize: "0.75rem",
                color: "#666",
                marginBottom: "0.5rem",
              }}
            >
              Explore episodes must produce learning. State what you now believe.
            </p>
            <textarea
              id="modelStatement"
              value={modelStatement}
              onChange={(e) => setModelStatement(e.target.value)}
              placeholder="I now believe that..."
              style={{
                width: "100%",
                minHeight: "60px",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontFamily: "inherit",
                fontSize: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleClose}
            disabled={!canSubmit || isSubmitting}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "none",
              borderRadius: "6px",
              background: canSubmit ? "#d97706" : "#ccc",
              color: "#fff",
              cursor: canSubmit && !isSubmitting ? "pointer" : "not-allowed",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Closing…" : "Close Episode"}
          </button>
          <button
            onClick={() => {
              setIsExpanded(false);
              setClosureNote("");
              setModelStatement("");
              setError(null);
            }}
            disabled={isSubmitting}
            style={{
              padding: "0.75rem 1rem",
              fontSize: "0.875rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: "transparent",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

