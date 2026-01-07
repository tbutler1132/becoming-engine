"use client";

import { useState, useRef, useEffect } from "react";
import { createNote } from "@/app/actions";

type FeedbackState = "idle" | "saving" | "success" | "error";

export function QuickCapture(): React.ReactNode {
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return (): void => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed || feedback === "saving") return;

    setFeedback("saving");
    setErrorMessage(null);

    const result = await createNote(trimmed, ["inbox"]);

    if (result.ok) {
      setContent("");
      setFeedback("success");

      // Clear success feedback after a brief moment
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback("idle");
      }, 1500);

      // Keep focus in input for rapid capture
      inputRef.current?.focus();
    } else {
      setFeedback("error");
      setErrorMessage(result.error);

      // Clear error feedback after longer moment
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback("idle");
        setErrorMessage(null);
      }, 3000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  const isDisabled = feedback === "saving";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "1rem 2rem",
        background: "linear-gradient(transparent, #fff 20%)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought..."
            disabled={isDisabled}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              outline: "none",
              opacity: isDisabled ? 0.6 : 1,
            }}
          />
          <FeedbackIndicator state={feedback} error={errorMessage} />
        </div>
      </div>
    </div>
  );
}

interface FeedbackIndicatorProps {
  state: FeedbackState;
  error: string | null;
}

function FeedbackIndicator({
  state,
  error,
}: FeedbackIndicatorProps): React.ReactNode {
  if (state === "idle") {
    return null;
  }

  if (state === "saving") {
    return (
      <span
        style={{
          fontSize: "0.875rem",
          color: "#666",
          minWidth: "80px",
        }}
      >
        Saving...
      </span>
    );
  }

  if (state === "success") {
    return (
      <span
        style={{
          fontSize: "0.875rem",
          color: "#059669",
          minWidth: "80px",
          animation: "fadeIn 0.2s ease-out",
        }}
      >
        Captured
      </span>
    );
  }

  if (state === "error") {
    return (
      <span
        style={{
          fontSize: "0.875rem",
          color: "#dc2626",
          minWidth: "80px",
        }}
        title={error ?? "Unknown error"}
      >
        Failed
      </span>
    );
  }

  return null;
}

