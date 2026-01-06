import Link from "next/link";
import type { Episode } from "@libs/memory";

interface EpisodeCardProps {
  episode: Episode;
}

/**
 * Clickable card linking to an episode's detail page.
 * Shows objective and status.
 */
export function EpisodeCard({ episode }: EpisodeCardProps): React.ReactNode {
  return (
    <Link
      href={`/episodes/${episode.id}`}
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <span>{episode.objective}</span>
      <span style={{ fontSize: "0.75rem", color: "#666" }}>
        {episode.status}
      </span>
    </Link>
  );
}

