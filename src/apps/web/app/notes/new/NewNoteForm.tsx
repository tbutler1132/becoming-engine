"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/app/actions";

interface NewNoteFormProps {
  allTags: readonly string[];
}

export function NewNoteForm({ allTags }: NewNoteFormProps): React.ReactNode {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTags = allTags.filter((t) => !tags.includes(t));

  function handleAddTag(tag: string): void {
    setTags([...tags, tag]);
    setIsAddingTag(false);
  }

  function handleRemoveTag(tag: string): void {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsSaving(true);

    // Cast is safe because allTags comes from NOTE_TAGS
    const result = await createNote(
      content.trim(),
      tags.length > 0 ? (tags as Parameters<typeof createNote>[1]) : undefined
    );

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push(`/notes/${result.value}`);
  }

  function handleCancel(): void {
    router.back();
  }

  return (
    <form onSubmit={handleSubmit}>
      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {error && (
          <p
            style={{
              color: "#dc2626",
              fontSize: "0.875rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
        )}

        <dl style={{ display: "grid", gap: "1rem" }}>
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
              Created
            </dt>
            <dd style={{ margin: 0, color: "#666", fontSize: "0.875rem" }}>
              Will be set on save
            </dd>
          </div>

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
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
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

                {isAddingTag ? (
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddTag(e.target.value);
                        }
                      }}
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
                      type="button"
                      onClick={() => setIsAddingTag(false)}
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
                      type="button"
                      onClick={() => setIsAddingTag(true)}
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
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter note content…"
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
          required
        />
      </section>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
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
          {isSaving ? "Creating…" : "Create Note"}
        </button>
        <button
          type="button"
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
    </form>
  );
}

