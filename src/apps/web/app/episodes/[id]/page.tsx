import { notFound } from "next/navigation";
import type { Action, EpisodeType } from "@libs/memory";
import { createStore } from "@/lib/store";
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
          {variable && <Field label="Variable" value={variable.name} />}
          <Field label="Opened" value={formatDate(episode.openedAt)} />
          {episode.closedAt && (
            <Field label="Closed" value={formatDate(episode.closedAt)} />
          )}
        </dl>
      </section>

      {/* Regulatory Action Section */}
      <CloseEpisodeForm
        episodeId={id}
        episodeType={episode.type as EpisodeType}
        currentStatus={episode.status}
      />

      {linkedActions.length > 0 && (
        <section>
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
          {linkedActions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </section>
      )}
    </main>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: FieldProps): React.ReactNode {
  return (
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
        {label}
      </dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

interface ActionCardProps {
  action: Action;
}

function ActionCard({ action }: ActionCardProps): React.ReactNode {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{action.description}</span>
      <span style={{ fontSize: "0.75rem", color: "#666" }}>{action.status}</span>
    </div>
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

