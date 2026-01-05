"use client";

import { useState } from "react";
import { addNoteTag, removeNoteTag } from "@/app/actions";

interface EditableTagsProps {
  noteId: string;
  initialTags: string[];
  allTags: readonly string[];
}

export function EditableTags({
  noteId,
  initialTags,
  allTags,
}: EditableTagsProps): React.ReactNode {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTags = allTags.filter((t) => !tags.includes(t));

  async function handleRemove(tag: string): Promise<void> {
    setError(null);
    // Cast is safe because allTags comes from NOTE_TAGS
    const result = await removeNoteTag(noteId, tag as Parameters<typeof removeNoteTag>[1]);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setTags(tags.filter((t) => t !== tag));
  }

  async function handleAdd(tag: string): Promise<void> {
    setError(null);
    // Cast is safe because allTags comes from NOTE_TAGS
    const result = await addNoteTag(noteId, tag as Parameters<typeof addNoteTag>[1]);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setTags([...tags, tag]);
    setIsAdding(false);
  }

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
        Tags
      </dt>
      <dd style={{ margin: 0 }}>
        {error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.75rem",
              marginBottom: "0.5rem",
            }}
          >
            {error}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                textTransform: "lowercase",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {tag}
              <button
                onClick={() => handleRemove(tag)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  lineHeight: 1,
                  color: "#666",
                }}
                aria-label={`Remove ${tag} tag`}
              >
                ×
              </button>
            </span>
          ))}

          {isAdding ? (
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <select
                onChange={(e) => handleAdd(e.target.value)}
                defaultValue=""
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              >
                <option value="" disabled>
                  Select tag…
                </option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsAdding(false)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            availableTags.length > 0 && (
              <button
                onClick={() => setIsAdding(true)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  border: "1px dashed #ccc",
                  borderRadius: "4px",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                + Add tag
              </button>
            )
          )}
        </div>
      </dd>
    </div>
  );
}

