"use client";

import { useState, useTransition } from "react";
import { addAction } from "@/app/actions";
import { Button } from "@/components/ui";
import styles from "./AddActionForm.module.css";

interface AddActionFormProps {
  episodeId: string;
}

export function AddActionForm({ episodeId }: AddActionFormProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await addAction(episodeId, description);
        setDescription("");
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add action");
      }
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.addButton}
        onClick={() => setIsOpen(true)}
      >
        + Add Action
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What needs to be done?"
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
          onClick={() => {
            setIsOpen(false);
            setDescription("");
            setError(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={isPending}>
          {isPending ? "Adding..." : "Add"}
        </Button>
      </div>
    </form>
  );
}

