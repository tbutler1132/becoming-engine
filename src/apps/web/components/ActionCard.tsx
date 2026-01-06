import Link from "next/link";
import type { Action } from "@libs/memory";

interface ActionCardProps {
  action: Action;
  /** Whether to show the status badge. Defaults to true. */
  showStatus?: boolean;
}

/**
 * Clickable card linking to an action's detail page.
 * Shows description and optionally status.
 */
export function ActionCard({
  action,
  showStatus = true,
}: ActionCardProps): React.ReactNode {
  return (
    <Link
      href={`/actions/${action.id}`}
      style={{
        display: showStatus ? "flex" : "block",
        justifyContent: showStatus ? "space-between" : undefined,
        alignItems: showStatus ? "center" : undefined,
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "0.5rem",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <span>{action.description}</span>
      {showStatus && (
        <span style={{ fontSize: "0.75rem", color: "#666" }}>
          {action.status}
        </span>
      )}
    </Link>
  );
}

