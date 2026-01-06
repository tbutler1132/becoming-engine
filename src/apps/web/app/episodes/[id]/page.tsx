import Link from "next/link";
import { notFound } from "next/navigation";
import type { EpisodeType } from "@libs/memory";
import { createStore } from "@/lib/store";
import { Field, ActionCard } from "@/components";
import { CloseEpisodeForm } from "./CloseEpisodeForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodePage({
  params,
}: PageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const store = createStore();
  const state = await store.load();

  const episode = state.episodes.find((e) => e.id === id);
  if (!episode) {
    notFound();
  }

  // Look up variable name if this is a Stabilize episode
  const variable = episode.variableId
    ? state.variables.find((v) => v.id === episode.variableId)
    : undefined;

  // Get linked actions
  const linkedActions = state.actions.filter((a) => a.episodeId === id);

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Link
        href="/lenses/status"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          fontSize: "0.875rem",
          color: "#666",
          textDecoration: "none",
        }}
      >
        ← Back to Status
      </Link>
      <header style={{ marginBottom: "2rem" }}>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Episode
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>{episode.objective}</h1>
      </header>

      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <dl style={{ display: "grid", gap: "1rem" }}>
          <Field label="Type" value={episode.type} />
          <Field label="Status" value={episode.status} />
          {variable && (
            <div>
              <dt
                style={{
                  fontSize: "0.75rem",
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.25rem",
                }}
              >
                Variable
              </dt>
              <dd style={{ margin: 0 }}>
                <Link
                  href={`/variables/${variable.id}`}
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  {variable.name}
                </Link>
              </dd>
            </div>
          )}
          <Field label="Opened" value={formatDate(episode.openedAt)} />
          {episode.closedAt && (
            <Field label="Closed" value={formatDate(episode.closedAt)} />
          )}
          <Field
            label={episode.closedAt ? "Duration" : "Days Active"}
            value={formatDuration(getDurationDays(episode.openedAt, episode.closedAt))}
          />
        </dl>
      </section>

      {/* Regulatory Action Section */}
      <CloseEpisodeForm
        episodeId={id}
        episodeType={episode.type as EpisodeType}
        currentStatus={episode.status}
      />

      <section style={{ marginTop: "1.5rem" }}>
        <h2
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          Actions
        </h2>
        {linkedActions.length === 0 && (
          <p style={{ color: "#999", marginBottom: "1rem" }}>
            No actions yet
          </p>
        )}
        {linkedActions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
        {episode.status === "Active" && (
          <Link
            href={`/actions/new?episodeId=${id}`}
            style={{
              display: "inline-block",
              marginTop: linkedActions.length > 0 ? "0.5rem" : 0,
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              border: "1px dashed #ccc",
              borderRadius: "4px",
              color: "#666",
              textDecoration: "none",
            }}
          >
            + Add Action
          </Link>
        )}
      </section>
    </main>
  );
}


function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDurationDays(openedAt: string, closedAt?: string): number {
  const start = new Date(openedAt);
  const end = closedAt ? new Date(closedAt) : new Date();
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDuration(days: number): string {
  if (days === 0) {
    return "< 1 day";
  }
  if (days === 1) {
    return "1 day";
  }
  return `${days} days`;
}

