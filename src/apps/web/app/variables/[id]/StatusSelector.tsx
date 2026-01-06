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
    <div
      style={{
        padding: "1rem",
        border: "2px solid #6366f1",
        borderRadius: "8px",
        background: "rgba(99, 102, 241, 0.05)",
      }}
    >
      <p
        style={{
          fontSize: "0.65rem",
          color: "#6366f1",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 600,
          marginBottom: "0.75rem",
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
        }}
      >
        <span style={{ fontSize: "0.875rem" }}>↗</span>
        Signal Status
      </p>
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
              border:
                status === currentStatus
                  ? "2px solid #6366f1"
                  : "1px solid #ccc",
              borderRadius: "4px",
              background: status === currentStatus ? "#6366f1" : "transparent",
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

