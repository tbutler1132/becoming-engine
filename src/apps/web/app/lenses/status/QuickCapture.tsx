"use client";

import { useState, useRef, useEffect } from "react";
import { createNote } from "@/app/actions";
import styles from "./QuickCapture.module.css";

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
    <aside className={styles.container} aria-label="Quick capture">
      <div className={styles.inner}>
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Capture a thought..."
            disabled={isDisabled}
            className={styles.input}
            aria-label="Quick note content"
          />
          <FeedbackIndicator state={feedback} error={errorMessage} />
        </div>
      </div>
    </aside>
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
      <span className={`${styles.feedback} ${styles.feedbackSaving}`}>
        Saving...
      </span>
    );
  }

  if (state === "success") {
    return (
      <span
        className={`${styles.feedback} ${styles.feedbackSuccess}`}
        role="status"
      >
        Captured
      </span>
    );
  }

  if (state === "error") {
    return (
      <span
        className={`${styles.feedback} ${styles.feedbackError}`}
        role="alert"
        title={error ?? "Unknown error"}
      >
        Failed
      </span>
    );
  }

  return null;
}
