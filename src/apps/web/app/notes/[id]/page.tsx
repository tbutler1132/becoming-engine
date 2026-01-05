import { notFound } from "next/navigation";
import type { NoteTag } from "@libs/memory";
import { createStore } from "@/lib/store";

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
          {note.tags.length > 0 && (
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
                Tags
              </dt>
              <dd style={{ margin: 0, display: "flex", gap: "0.5rem" }}>
                {note.tags.map((tag) => (
                  <Tag key={tag} tag={tag} />
                ))}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "1rem",
          }}
        >
          Content
        </h2>
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{note.content}</p>
      </section>

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

interface TagProps {
  tag: NoteTag;
}

function Tag({ tag }: TagProps): React.ReactNode {
  return (
    <span
      style={{
        fontSize: "0.75rem",
        padding: "0.25rem 0.5rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
        textTransform: "lowercase",
      }}
    >
      {tag}
    </span>
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

