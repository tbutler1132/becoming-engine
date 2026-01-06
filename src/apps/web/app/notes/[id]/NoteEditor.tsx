"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { updateNote, addNoteTag, removeNoteTag } from "@/app/actions";
import type { NoteTag } from "@libs/memory";

interface NoteEditorProps {
  noteId: string;
  initialContent: string;
  initialTags: string[];
  allTags: readonly string[];
  createdAt: string;
}

export function NoteEditor({
  noteId,
  initialContent,
  initialTags,
  allTags,
  createdAt,
}: NoteEditorProps): React.ReactNode {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For resetting on cancel
  const [savedContent, setSavedContent] = useState(initialContent);
  const [savedTags, setSavedTags] = useState<string[]>(initialTags);

  const availableTags = allTags.filter((t) => !tags.includes(t));

  // Title is derived from content (first 50 chars), with markdown stripped
  const displayContent = isEditing ? content : savedContent;
  const plainText = stripMarkdown(displayContent);
  const title = plainText.slice(0, 50) + (plainText.length > 50 ? "…" : "");

  function handleEdit(): void {
    setIsEditing(true);
    setError(null);
  }

  function handleCancel(): void {
    setContent(savedContent);
    setTags(savedTags);
    setError(null);
    setIsEditing(false);
  }

  function handleAddTag(tag: string): void {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  }

  function handleRemoveTag(tag: string): void {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    setError(null);

    try {
      // 1. Update content if changed
      if (content !== savedContent) {
        const contentResult = await updateNote(noteId, content);
        if (!contentResult.ok) {
          setError(contentResult.error);
          setIsSaving(false);
          return;
        }
      }

      // 2. Calculate tag diff
      const tagsToAdd = tags.filter((t) => !savedTags.includes(t));
      const tagsToRemove = savedTags.filter((t) => !tags.includes(t));

      // 3. Add new tags
      for (const tag of tagsToAdd) {
        const result = await addNoteTag(noteId, tag as NoteTag);
        if (!result.ok) {
          setError(result.error);
          setIsSaving(false);
          return;
        }
      }

      // 4. Remove old tags
      for (const tag of tagsToRemove) {
        const result = await removeNoteTag(noteId, tag as NoteTag);
        if (!result.ok) {
          setError(result.error);
          setIsSaving(false);
          return;
        }
      }

      // 5. Success - update saved state and exit edit mode
      setSavedContent(content);
      setSavedTags(tags);
      setIsSaving(false);
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Page Header with Edit/Save/Cancel */}
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>{title}</h1>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            {isEditing ? (
              <>
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
              </>
            ) : (
              <button
                onClick={handleEdit}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
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
        </div>
      </header>

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

      {/* Details Section */}
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
          Details
        </h2>

        <dl style={{ display: "grid", gap: "1rem", margin: 0 }}>
          {/* Created Date - always read-only */}
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
            <dd style={{ margin: 0 }}>{formatDate(createdAt)}</dd>
          </div>

          {/* Tags */}
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
                    {isEditing && (
                      <button
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
                    )}
                  </span>
                ))}
                {tags.length === 0 && !isEditing && (
                  <span style={{ color: "#666", fontSize: "0.875rem" }}>
                    No tags
                  </span>
                )}
                {isEditing && availableTags.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddTag(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem",
                      border: "1px dashed #ccc",
                      borderRadius: "4px",
                      background: "transparent",
                      cursor: "pointer",
                      color: "#666",
                    }}
                  >
                    <option value="" disabled>
                      + Add tag
                    </option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </dd>
          </div>
        </dl>
      </section>

      {/* Content Section */}
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

        {isEditing ? (
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
              boxSizing: "border-box",
            }}
          />
        ) : (
          <div className="prose">
            <ReactMarkdown>{savedContent}</ReactMarkdown>
          </div>
        )}
      </section>
    </>
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

function stripMarkdown(text: string): string {
  return (
    text
      // Remove headings (# ## ### etc.)
      .replace(/^#{1,6}\s+/gm, "")
      // Remove bold/italic markers
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, "$1")
      // Remove inline code
      .replace(/`([^`]+)`/g, "$1")
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      // Remove blockquote markers
      .replace(/^>\s+/gm, "")
      // Remove list markers
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      // Collapse multiple spaces/newlines
      .replace(/\s+/g, " ")
      .trim()
  );
}
