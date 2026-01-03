"use client";

import { useState, useTransition } from "react";
import { closeEpisode } from "@/app/actions";
import { Button } from "@/components/ui";
import type { EpisodeType } from "@libs/memory";
import styles from "./CloseEpisodeForm.module.css";

interface CloseEpisodeFormProps {
  episodeId: string;
  episodeType: EpisodeType;
}

export function CloseEpisodeForm({
  episodeId,
  episodeType,
}: CloseEpisodeFormProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [closureNote, setClosureNote] = useState("");
  const [modelStatement, setModelStatement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isExplore = episodeType === "Explore";

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);

    if (isExplore && !modelStatement.trim()) {
      setError("Explore episodes require learning. What did you learn?");
      return;
    }

    startTransition(async () => {
      try {
        await closeEpisode(
          episodeId,
          closureNote,
          episodeType,
          isExplore ? modelStatement : undefined
        );
        setClosureNote("");
        setModelStatement("");
        setIsOpen(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to close episode"
        );
      }
    });
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        Close
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>Close Episode</span>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          aria-label="Cancel"
        >
          ×
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor={`note-${episodeId}`} className={styles.label}>
          Closure Note
        </label>
        <textarea
          id={`note-${episodeId}`}
          value={closureNote}
          onChange={(e) => setClosureNote(e.target.value)}
          placeholder="What happened? Any reflections?"
          className={styles.textarea}
          rows={2}
          required
          autoFocus
        />
      </div>

      {isExplore && (
        <div className={styles.field}>
          <label htmlFor={`model-${episodeId}`} className={styles.label}>
            What did you learn?
            <span className={styles.required}> (required)</span>
          </label>
          <input
            id={`model-${episodeId}`}
            type="text"
            value={modelStatement}
            onChange={(e) => setModelStatement(e.target.value)}
            placeholder="A belief, principle, or insight..."
            className={styles.input}
            required
          />
          <p className={styles.hint}>
            This becomes an explicit Model in your knowledge base.
          </p>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? "Closing..." : "Close Episode"}
        </Button>
      </div>
    </form>
  );
}

