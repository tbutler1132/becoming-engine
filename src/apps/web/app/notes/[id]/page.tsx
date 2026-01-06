import Link from "next/link";
import { notFound } from "next/navigation";
import { NOTE_TAGS } from "@libs/memory";
import { createStore } from "@/lib/store";
import { NoteEditor } from "./NoteEditor";

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
