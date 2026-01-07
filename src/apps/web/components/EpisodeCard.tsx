import Link from "next/link";
import type { Episode } from "@libs/memory";
import styles from "./EpisodeCard.module.css";

interface EpisodeCardProps {
  episode: Episode;
}

/**
 * Clickable card linking to an episode's detail page.
 * Shows objective and status.
 */
export function EpisodeCard({ episode }: EpisodeCardProps): React.ReactNode {
  return (
    <Link href={`/episodes/${episode.id}`} className={styles.card}>
      <span className={styles.objective}>{episode.objective}</span>
      <span className={styles.status}>{episode.status}</span>
    </Link>
  );
}
