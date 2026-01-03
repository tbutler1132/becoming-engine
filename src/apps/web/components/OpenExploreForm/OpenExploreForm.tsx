"use client";

import { useState, useTransition } from "react";
import { openExploreEpisode } from "@/app/actions";
import { Button } from "@/components/ui";
import styles from "./OpenExploreForm.module.css";

export function OpenExploreForm(): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [objective, setObjective] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await openExploreEpisode(objective);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setObjective("");
      setIsOpen(false);
    });
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        + Explore
      </Button>
    );
  }

  return (
    <div className={styles.overlay}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formHeader}>
          <span className={styles.formTitle}>New Explore Episode</span>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Cancel"
          >
            ×
          </button>
        </div>

        <p className={styles.description}>
          Explore episodes reduce uncertainty through learning. You&apos;ll need
          to record what you learned when closing.
        </p>

        <input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="What do you want to explore?"
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
    </div>
  );
}

