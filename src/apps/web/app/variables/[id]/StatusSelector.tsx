"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signalVariable } from "@/app/actions";
import type { VariableStatus } from "@libs/memory";

const STATUSES: VariableStatus[] = ["Low", "InRange", "High", "Unknown"];

interface StatusSelectorProps {
  variableId: string;
  currentStatus: VariableStatus;
}

export function StatusSelector({
  variableId,
  currentStatus,
}: StatusSelectorProps): React.ReactNode {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: VariableStatus): Promise<void> {
    if (newStatus === currentStatus) return;

    setError(null);
    setIsUpdating(true);

    const result = await signalVariable(variableId, newStatus);

    if (!result.ok) {
      setError(result.error);
      setIsUpdating(false);
      return;
    }

    router.refresh();
    setIsUpdating(false);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          opacity: isUpdating ? 0.5 : 1,
        }}
      >
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusChange(status)}
            disabled={isUpdating}
            style={{
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: status === currentStatus ? "#000" : "transparent",
              color: status === currentStatus ? "#fff" : "inherit",
              cursor: isUpdating ? "not-allowed" : "pointer",
              fontWeight: status === currentStatus ? 500 : 400,
            }}
          >
            {status}
          </button>
        ))}
      </div>
      {error && (
        <p
          style={{
            color: "#dc2626",
            fontSize: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

