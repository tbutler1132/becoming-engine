import Link from "next/link";
import type { Action } from "@libs/memory";
import styles from "./ActionCard.module.css";

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
  const cardClass = showStatus
    ? styles.card
    : `${styles.card} ${styles.cardSimple}`;

  return (
    <Link href={`/actions/${action.id}`} className={cardClass}>
      <span className={styles.description}>{action.description}</span>
      {showStatus && <span className={styles.status}>{action.status}</span>}
    </Link>
  );
}
