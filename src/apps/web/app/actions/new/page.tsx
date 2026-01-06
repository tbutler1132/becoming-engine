"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addAction,
  getActiveEpisodes,
  type EpisodeOption,
} from "@/app/actions";

export default function NewActionPage(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEpisodeId = searchParams.get("episodeId") ?? "";

  const [description, setDescription] = useState("");
  const [episodeId, setEpisodeId] = useState(preselectedEpisodeId);
  const [episodes, setEpisodes] = useState<EpisodeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveEpisodes().then((eps) => {
      setEpisodes(eps);
      setIsLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setIsSaving(true);

    const result = await addAction(
      description,
      episodeId || undefined
    );

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push(`/actions/${result.value}`);
  }

  function handleCancel(): void {
    router.back();
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
          New Action
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>Create Action</h1>
      </header>

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

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="description"
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
              }}
            >
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this action do?"
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontFamily: "inherit",
                fontSize: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="episode"
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
              }}
            >
              Episode (optional)
            </label>
            {isLoading ? (
              <p style={{ color: "#666", fontSize: "0.875rem" }}>
                Loading episodes…
              </p>
            ) : (
              <select
                id="episode"
                value={episodeId}
                onChange={(e) => setEpisodeId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  background: "transparent",
                }}
              >
                <option value="">No episode (unlinked action)</option>
                {episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    [{ep.type}] {ep.objective}
                  </option>
                ))}
              </select>
            )}
            <p
              style={{
                fontSize: "0.75rem",
                color: "#666",
                marginTop: "0.5rem",
              }}
            >
              Actions linked to episodes carry authority per doctrine.
            </p>
          </div>
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
            {isSaving ? "Creating…" : "Create Action"}
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
    </main>
  );
}

