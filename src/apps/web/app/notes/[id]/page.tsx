import Link from "next/link";
import { notFound } from "next/navigation";
import { NOTE_TAGS, MODEL_TYPES } from "@libs/memory";
import { createStore } from "@/lib/store";
import { NoteEditor } from "./NoteEditor";
import { NoteProcessingActions } from "./NoteProcessingActions";

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

  // Get variables for linking
  const variables = state.variables.map((v) => ({
    id: v.id,
    name: v.name,
  }));

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <Link
        href="/lenses/world-model"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          fontSize: "0.875rem",
          color: "#666",
          textDecoration: "none",
        }}
      >
        ← Back to World Model
      </Link>
      <NoteEditor
        noteId={note.id}
        initialContent={note.content}
        initialTags={note.tags}
        allTags={NOTE_TAGS}
        createdAt={note.createdAt}
      />

      <NoteProcessingActions
        noteId={note.id}
        noteContent={note.content}
        isInbox={note.tags.includes("inbox")}
        modelTypes={MODEL_TYPES}
        variables={variables}
        linkedObjectIds={note.linkedObjects ?? []}
      />

      {note.linkedObjects && note.linkedObjects.length > 0 && (
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
            Linked Variables
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {note.linkedObjects.map((objectId) => {
              const variable = variables.find((v) => v.id === objectId);
              return (
                <Link
                  key={objectId}
                  href={`/variables/${objectId}`}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  {variable?.name ?? objectId}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
