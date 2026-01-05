"use client";

import { useState } from "react";
import { updateNote } from "@/app/actions";

interface EditableContentProps {
  noteId: string;
  initialContent: string;
}

export function EditableContent({
  noteId,
  initialContent,
}: EditableContentProps): React.ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    setError(null);

    const result = await updateNote(noteId, content);

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setIsEditing(false);
  }

  function handleCancel(): void {
    setContent(initialContent);
    setError(null);
    setIsEditing(false);
  }

  return (
    <section
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          Content
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "0.25rem 0.75rem",
              fontSize: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {isEditing ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: "100%",
              minHeight: "150px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              resize: "vertical",
              marginBottom: "1rem",
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "#000",
                color: "#fff",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: "transparent",
                cursor: isSaving ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{content}</p>
      )}
    </section>
  );
}

