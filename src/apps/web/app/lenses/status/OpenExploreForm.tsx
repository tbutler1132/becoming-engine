"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openExploreEpisode } from "@/app/actions";
import styles from "./OpenExploreForm.module.css";

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
        className={styles.triggerButton}
      >
        + Open Explore Episode
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.formTitle}>Open Explore Episode</p>

      <p className={styles.formDescription}>
        Explore episodes reduce uncertainty through learning. They require a
        Model update to close.
      </p>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.fieldGroup}>
        <label htmlFor="objective" className={styles.fieldLabel}>
          Objective *
        </label>
        <textarea
          id="objective"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="What are you exploring? (e.g., 'Learn whether morning workouts improve focus')"
          className={styles.textarea}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={isSaving}
          className={styles.submitButton}
        >
          {isSaving ? "Opening…" : "Open Episode"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className={styles.cancelButton}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
