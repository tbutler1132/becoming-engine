"use client";

import { useState, useTransition, useOptimistic } from "react";
import { signalVariable } from "@/app/actions";
import type { VariableStatus } from "@libs/memory";
import styles from "./SignalForm.module.css";

const STATUSES: VariableStatus[] = ["Low", "InRange", "High"];

interface SignalFormProps {
  variableId: string;
  currentStatus: VariableStatus;
}

export function SignalForm({
  variableId,
  currentStatus,
}: SignalFormProps): React.ReactNode {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);

  function handleSignal(status: VariableStatus): void {
    if (status === optimisticStatus) return;
    setError(null);

    startTransition(async () => {
      setOptimisticStatus(status);
      try {
        await signalVariable(variableId, status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to signal");
      }
    });
  }

  const otherStatuses = STATUSES.filter((s) => s !== optimisticStatus);

  return (
    <div className={styles.container}>
      <span className={styles.label}>→</span>
      {otherStatuses.map((status) => (
        <button
          key={status}
          type="button"
          className={styles.signalButton}
          data-status={status}
          onClick={() => handleSignal(status)}
          disabled={isPending}
        >
          {status}
        </button>
      ))}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
