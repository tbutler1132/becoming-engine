"use client";

import { useState, useTransition } from "react";
import { openStabilizeEpisode } from "@/app/actions";
import { Button } from "@/components/ui";
import styles from "./OpenStabilizeForm.module.css";

interface OpenStabilizeFormProps {
  variableId: string;
  variableName: string;
}

export function OpenStabilizeForm({
  variableId,
  variableName,
}: OpenStabilizeFormProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await openStabilizeEpisode(variableId, objective);
        setObjective("");
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open episode");
      }
    });
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={styles.triggerButton}
        onClick={() => setIsOpen(true)}
      >
        Stabilize
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formHeader}>
        <span className={styles.formTitle}>Stabilize {variableName}</span>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setIsOpen(false)}
          aria-label="Cancel"
        >
          ×
        </button>
      </div>

      <input
        type="text"
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="What's the objective?"
        className={styles.input}
        required
        autoFocus
      />

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
          {isPending ? "Opening..." : "Open Episode"}
        </Button>
      </div>
    </form>
  );
}

