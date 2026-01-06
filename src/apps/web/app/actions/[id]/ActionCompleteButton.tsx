"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeAction } from "@/app/actions";

interface ActionCompleteButtonProps {
  actionId: string;
  currentStatus: string;
}

export function ActionCompleteButton({
  actionId,
  currentStatus,
}: ActionCompleteButtonProps): React.ReactNode {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show button if already done
  if (currentStatus === "Done") {
    return null;
  }

  async function handleComplete(): Promise<void> {
    setError(null);
    setIsSubmitting(true);

    const result = await completeAction(actionId);

    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div
        style={{
          padding: "1rem",
          border: "2px solid #16a34a",
          borderRadius: "8px",
          background: "rgba(22, 163, 74, 0.05)",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.75rem",
          }}
        >
          Regulatory Action
        </p>
        <button
          onClick={handleComplete}
          disabled={isSubmitting}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "none",
            borderRadius: "6px",
            background: "#16a34a",
            color: "#fff",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "1rem" }}>✓</span>
          {isSubmitting ? "Marking Complete…" : "Mark Complete"}
        </button>
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
    </div>
  );
}

