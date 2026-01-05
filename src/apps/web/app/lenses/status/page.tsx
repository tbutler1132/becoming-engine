import Link from "next/link";
import { DEFAULT_PERSONAL_NODE, formatNodeRef } from "@libs/memory";
import { getStatusData } from "@libs/regulator";
import type { Variable, Episode } from "@libs/memory";
import { createStore } from "@/lib/store";

export default async function StatusLensPage(): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();
  const status = getStatusData(state, DEFAULT_PERSONAL_NODE);

  // Get variables for this node
  const nodeVariables = state.variables.filter(
    (v) =>
      v.node.type === DEFAULT_PERSONAL_NODE.type &&
      v.node.id === DEFAULT_PERSONAL_NODE.id
  );

  // Get active episodes
  const activeEpisodes = status.mode === "active" ? status.episodes : [];

  // Find active Explore episode (there should be at most one active)
  const activeExplore = activeEpisodes.find((e) => e.type === "Explore");

  // Get active Stabilize episodes indexed by variableId
  const stabilizeByVariable = new Map<string, Episode>();
  for (const episode of activeEpisodes) {
    if (episode.type === "Stabilize" && episode.variableId) {
      stabilizeByVariable.set(episode.variableId, episode);
    }
  }

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>Status</h1>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>
          {formatNodeRef(DEFAULT_PERSONAL_NODE)}
        </p>
      </header>

      <ExploreCard episode={activeExplore} />

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
          Variables
        </h2>
        {nodeVariables.map((variable, index) => (
          <VariableSection
            key={variable.id}
            variable={variable}
            stabilizeEpisode={stabilizeByVariable.get(variable.id)}
            isLast={index === nodeVariables.length - 1}
          />
        ))}
        {nodeVariables.length === 0 && (
          <p style={{ textAlign: "center", color: "#999" }}>
            No variables defined
          </p>
        )}
      </section>
    </main>
  );
}

interface ExploreCardProps {
  episode: Episode | undefined;
}

function ExploreCard({ episode }: ExploreCardProps): React.ReactNode {
  const content = episode ? (
    <>
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#666",
          marginBottom: "0.5rem",
        }}
      >
        Active Explore
      </div>
      <div>{episode.objective}</div>
    </>
  ) : (
    <div style={{ color: "#999", textAlign: "center" }}>
      No active explore episode
    </div>
  );

  const cardStyle = {
    padding: "1.5rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    display: "block",
    color: "inherit",
    textDecoration: "none",
  };

  if (episode) {
    return (
      <Link href={`/episodes/${episode.id}`} style={cardStyle}>
        {content}
      </Link>
    );
  }

  return <div style={cardStyle}>{content}</div>;
}

interface VariableSectionProps {
  variable: Variable;
  stabilizeEpisode: Episode | undefined;
  isLast: boolean;
}

function VariableSection({
  variable,
  stabilizeEpisode,
  isLast,
}: VariableSectionProps): React.ReactNode {
  return (
    <div
      style={{
        padding: "2rem 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid #ccc",
      }}
    >
      <VariableCard variable={variable} />
      {stabilizeEpisode && <StabilizeCard episode={stabilizeEpisode} />}
    </div>
  );
}

interface VariableCardProps {
  variable: Variable;
}

function VariableCard({ variable }: VariableCardProps): React.ReactNode {
  return (
    <div
      style={{
        width: "200px",
        height: "200px",
        padding: "1.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.125rem", fontWeight: 500 }}>
        {variable.name}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "#666",
          textTransform: "capitalize",
        }}
      >
        {variable.status}
      </div>
    </div>
  );
}

interface StabilizeCardProps {
  episode: Episode;
}

function StabilizeCard({ episode }: StabilizeCardProps): React.ReactNode {
  return (
    <Link
      href={`/episodes/${episode.id}`}
      style={{
        marginTop: "0.75rem",
        padding: "1rem 1.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
        maxWidth: "300px",
        textAlign: "center",
        display: "block",
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#666",
          marginBottom: "0.25rem",
        }}
      >
        Stabilizing
      </div>
      <div style={{ fontSize: "0.875rem" }}>{episode.objective}</div>
    </Link>
  );
}
