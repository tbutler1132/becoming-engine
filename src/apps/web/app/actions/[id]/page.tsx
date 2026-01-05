import Link from "next/link";
import { notFound } from "next/navigation";
import { createStore } from "@/lib/store";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActionPage({
  params,
}: PageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const store = createStore();
  const state = await store.load();

  const action = state.actions.find((a) => a.id === id);
  if (!action) {
    notFound();
  }

  // Look up linked episode if present
  const episode = action.episodeId
    ? state.episodes.find((e) => e.id === action.episodeId)
    : undefined;

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
          Action
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>{action.description}</h1>
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
          <Field label="Status" value={action.status} />
        </dl>
      </section>

      {episode && (
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
            Episode
          </h2>
          <Link
            href={`/episodes/${episode.id}`}
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "1rem",
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

