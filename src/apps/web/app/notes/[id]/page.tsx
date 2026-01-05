import { notFound } from "next/navigation";
import { NOTE_TAGS } from "@libs/memory";
import { createStore } from "@/lib/store";
import { EditableContent } from "./EditableContent";
import { EditableTags } from "./EditableTags";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({
  params,
}: PageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const store = createStore();
  const state = await store.load();

  const note = state.notes.find((n) => n.id === id);
  if (!note) {
    notFound();
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
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Note
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>
          {note.content.slice(0, 50)}
          {note.content.length > 50 ? "…" : ""}
        </h1>
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
          <Field label="Created" value={formatDate(note.createdAt)} />
          <EditableTags noteId={note.id} initialTags={note.tags} allTags={NOTE_TAGS} />
        </dl>
      </section>

      <EditableContent noteId={note.id} initialContent={note.content} />

      {note.linkedObjects && note.linkedObjects.length > 0 && (
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
            Linked Objects
          </h2>
          {note.linkedObjects.map((objectId) => (
            <div
              key={objectId}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "1rem",
                marginBottom: "0.5rem",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {objectId}
            </div>
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

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
