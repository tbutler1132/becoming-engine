import { NOTE_TAGS } from "@libs/memory";
import { NewNoteForm } from "./NewNoteForm";

export default function NewNotePage(): React.ReactNode {
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
          New Note
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>Create Note</h1>
      </header>

      <NewNoteForm allTags={NOTE_TAGS} />
    </main>
  );
}
