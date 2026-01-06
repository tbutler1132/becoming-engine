import Link from "next/link";
import { notFound } from "next/navigation";
import type { Episode } from "@libs/memory";
import { formatNodeRef } from "@libs/memory";
import { createStore } from "@/lib/store";
import { OpenStabilizeForm } from "./OpenStabilizeForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VariablePage({
  params,
}: PageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const store = createStore();
  const state = await store.load();

  const variable = state.variables.find((v) => v.id === id);
  if (!variable) {
    notFound();
  }

  // Get Stabilize episodes scoped to this variable
  const stabilizeEpisodes = state.episodes.filter(
    (e) => e.type === "Stabilize" && e.variableId === id
  );

  // Check if there's already an active stabilize episode for this variable
  const hasActiveStabilize = stabilizeEpisodes.some(
    (e) => e.status === "Active"
  );

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
          Variable
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>{variable.name}</h1>
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
          <Field label="Status" value={variable.status} />
          <Field label="Node" value={formatNodeRef(variable.node)} />
        </dl>
      </section>

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
          Stabilize Episodes
        </h2>
        {stabilizeEpisodes.map((episode) => (
          <EpisodeCard key={episode.id} episode={episode} />
        ))}
        {!hasActiveStabilize && (
          <div style={{ marginTop: stabilizeEpisodes.length > 0 ? "1rem" : 0 }}>
            <OpenStabilizeForm
              variableId={id}
              variableName={variable.name}
            />
          </div>
        )}
      </section>
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

interface EpisodeCardProps {
  episode: Episode;
}

function EpisodeCard({ episode }: EpisodeCardProps): React.ReactNode {
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

