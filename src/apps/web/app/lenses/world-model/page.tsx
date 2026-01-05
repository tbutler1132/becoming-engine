import type { Note } from "@libs/memory";
import { createStore } from "@/lib/store";

export default async function WorldModelLensPage(): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();

  // Get inbox notes
  const inboxNotes = state.notes.filter((note) => note.tags.includes("inbox"));

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
    </main>
  );
}

interface NoteCardProps {
  note: Note;
}

function NoteCard({ note }: NoteCardProps): React.ReactNode {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
        marginBottom: "0.5rem",
      }}
    >
      {note.content}
    </div>
  );
}
