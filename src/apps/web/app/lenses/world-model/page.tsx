import Link from "next/link";
import type { Model, Note } from "@libs/memory";
import { createStore } from "@/lib/store";

export default async function WorldModelLensPage(): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();

  // Get inbox notes, sorted newest first
  const inboxNotes = state.notes
    .filter((note) => note.tags.includes("inbox"))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
          World Model
        </h1>
      </header>

      <section>
        <h2
          style={{
            fontSize: "0.75rem",
            color: "#666",
            marginBottom: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Inbox
        </h2>

        {inboxNotes.length === 0 && (
          <p style={{ color: "#999", textAlign: "center" }}>
            No notes in inbox
          </p>
        )}

        {inboxNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </section>

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
          Models
        </h2>

        {state.models.length === 0 && (
          <p style={{ color: "#999", textAlign: "center" }}>
            No models yet. Close an Explore episode to create one.
          </p>
        )}

        {state.models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </section>

      <Link
        href="/notes/new"
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
        + Add Note
      </Link>
    </main>
  );
}

interface NoteCardProps {
  note: Note;
}

function NoteCard({ note }: NoteCardProps): React.ReactNode {
  return (
    <Link
      href={`/notes/${note.id}`}
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
      {note.content}
    </Link>
  );
}

interface ModelCardProps {
  model: Model;
}

function ModelCard({ model }: ModelCardProps): React.ReactNode {
  const typeColors: Record<string, string> = {
    Descriptive: "#2563eb",
    Procedural: "#059669",
    Normative: "#dc2626",
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "0.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        }}
      >
        <span
          style={{
            fontSize: "0.625rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "0.125rem 0.375rem",
            borderRadius: "2px",
            background: typeColors[model.type] ?? "#666",
            color: "#fff",
          }}
        >
          {model.type}
        </span>
        {model.confidence !== undefined && (
          <span
            style={{
              fontSize: "0.75rem",
              color: "#666",
            }}
          >
            {Math.round(model.confidence * 100)}% confidence
          </span>
        )}
      </div>
      <p style={{ margin: 0 }}>{model.statement}</p>
    </div>
  );
}
