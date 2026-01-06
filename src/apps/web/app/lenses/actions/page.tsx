import Link from "next/link";
import { DEFAULT_PERSONAL_NODE } from "@libs/memory";
import { getStatusData } from "@libs/regulator";
import type { Action, Episode } from "@libs/memory";
import { createStore } from "@/lib/store";

interface EpisodeWithActions {
  episode: Episode;
  actions: Action[];
}

export default async function ActionsLensPage(): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();
  const status = getStatusData(state, DEFAULT_PERSONAL_NODE);

  // Get active episodes and pending actions
  const activeEpisodes = status.mode === "active" ? status.episodes : [];
  const pendingActions = status.mode === "active" ? status.actions : [];

  // Group actions by episodeId
  const actionsByEpisode = new Map<string, Action[]>();
  const orphanActions: Action[] = [];

  for (const action of pendingActions) {
    if (action.episodeId) {
      const existing = actionsByEpisode.get(action.episodeId) ?? [];
      existing.push(action);
      actionsByEpisode.set(action.episodeId, existing);
    } else {
      orphanActions.push(action);
    }
  }

  // Group episodes by type with their actions
  const exploreEpisodes: EpisodeWithActions[] = [];
  const stabilizeEpisodes: EpisodeWithActions[] = [];

  for (const episode of activeEpisodes) {
    const actions = actionsByEpisode.get(episode.id) ?? [];
    if (actions.length > 0) {
      const item = { episode, actions };
      if (episode.type === "Explore") {
        exploreEpisodes.push(item);
      } else {
        stabilizeEpisodes.push(item);
      }
    }
  }

  const hasAnyActions =
    exploreEpisodes.length > 0 ||
    stabilizeEpisodes.length > 0 ||
    orphanActions.length > 0;

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Actions</h1>
      </header>

      {!hasAnyActions && (
        <p style={{ color: "#999", textAlign: "center" }}>No active actions</p>
      )}

      {exploreEpisodes.length > 0 && (
        <EpisodeTypeSection title="Explore" episodes={exploreEpisodes} />
      )}

      {stabilizeEpisodes.length > 0 && (
        <EpisodeTypeSection title="Stabilize" episodes={stabilizeEpisodes} />
      )}

      {orphanActions.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Unlinked
          </h2>
          {orphanActions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </section>
      )}

      <Link
        href="/actions/new"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          padding: "1rem 2rem",
          fontSize: "1rem",
          fontWeight: 600,
          border: "none",
          borderRadius: "8px",
          background: "#000",
          color: "#fff",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        + Add Action
      </Link>
    </main>
  );
}

interface EpisodeTypeSectionProps {
  title: string;
  episodes: EpisodeWithActions[];
}

function EpisodeTypeSection({
  title,
  episodes,
}: EpisodeTypeSectionProps): React.ReactNode {
  return (
    <section style={{ marginTop: "2rem" }}>
      <h2
        style={{
          fontSize: "0.75rem",
          color: "#666",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h2>

      {episodes.map(({ episode, actions }) => (
        <EpisodeCard key={episode.id} episode={episode} actions={actions} />
      ))}
    </section>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  actions: Action[];
}

function EpisodeCard({ episode, actions }: EpisodeCardProps): React.ReactNode {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1.5rem",
        marginBottom: "1rem",
      }}
    >
      <Link
        href={`/episodes/${episode.id}`}
        style={{
          display: "block",
          marginBottom: "1rem",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Episode
        </div>
        <div style={{ fontSize: "1rem" }}>{episode.objective}</div>
      </Link>

      <div
        style={{
          fontSize: "0.75rem",
          color: "#666",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "0.5rem",
        }}
      >
        Actions
      </div>
      {actions.map((action) => (
        <ActionCard key={action.id} action={action} />
      ))}
    </div>
  );
}

interface ActionCardProps {
  action: Action;
}

function ActionCard({ action }: ActionCardProps): React.ReactNode {
  return (
    <Link
      href={`/actions/${action.id}`}
      style={{
        display: "block",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "0.5rem",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      {action.description}
    </Link>
  );
}
