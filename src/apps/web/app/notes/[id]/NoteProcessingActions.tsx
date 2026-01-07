"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processNote, createModel, linkNoteToObject } from "@/app/actions";
import type { ModelType } from "@libs/memory";

interface VariableOption {
  id: string;
  name: string;
}

interface NoteProcessingActionsProps {
  noteId: string;
  noteContent: string;
  isInbox: boolean;
  modelTypes: readonly string[];
  variables: VariableOption[];
  linkedObjectIds: string[];
}

export function NoteProcessingActions({
  noteId,
  noteContent,
  isInbox,
  modelTypes,
  variables,
  linkedObjectIds,
}: NoteProcessingActionsProps): React.ReactNode {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPromoteForm, setShowPromoteForm] = useState(false);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [linkedIds, setLinkedIds] = useState<string[]>(linkedObjectIds);
  const [error, setError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Don't show actions if note is already processed
  if (!isInbox) {
    return null;
  }

  // Filter out already-linked variables
  const availableVariables = variables.filter((v) => !linkedIds.includes(v.id));

  async function handleMarkProcessed(): Promise<void> {
    setIsProcessing(true);
    setError(null);

    const result = await processNote(noteId);

    if (!result.ok) {
      setError(result.error);
      setIsProcessing(false);
      return;
    }

    // Navigate back to world model
    router.push("/lenses/world-model");
  }

  async function handleLinkVariable(variableId: string): Promise<void> {
    setIsProcessing(true);
    setError(null);
    setLinkSuccess(null);

    const result = await linkNoteToObject(noteId, variableId);

    if (!result.ok) {
      setError(result.error);
      setIsProcessing(false);
      return;
    }

    // Update local state to reflect the link
    setLinkedIds([...linkedIds, variableId]);
    const linkedVar = variables.find((v) => v.id === variableId);
    setLinkSuccess(`Linked to ${linkedVar?.name ?? "variable"}`);
    setShowLinkDropdown(false);
    setIsProcessing(false);

    // Clear success message after a moment
    setTimeout(() => setLinkSuccess(null), 2000);
  }

  return (
    <section
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        background: "#fafafa",
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
        Process Note
      </h2>

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

      {linkSuccess && (
        <p
          style={{
            color: "#059669",
            fontSize: "0.875rem",
            marginBottom: "1rem",
          }}
        >
          {linkSuccess}
        </p>
      )}

      {!showPromoteForm ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={handleMarkProcessed}
            disabled={isProcessing}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "#fff",
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            {isProcessing ? "Processing…" : "Mark Processed"}
          </button>
          <button
            onClick={() => setShowPromoteForm(true)}
            disabled={isProcessing}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              border: "1px solid #000",
              borderRadius: "4px",
              background: "#000",
              color: "#fff",
              cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.5 : 1,
            }}
          >
            Promote to Model
          </button>

          {/* Link to Variable */}
          {availableVariables.length > 0 && (
            showLinkDropdown ? (
              <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      void handleLinkVariable(e.target.value);
                    }
                  }}
                  defaultValue=""
                  disabled={isProcessing}
                  style={{
                    padding: "0.5rem",
                    fontSize: "0.875rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    background: "#fff",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="" disabled>
                    Select variable…
                  </option>
                  {availableVariables.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowLinkDropdown(false)}
                  disabled={isProcessing}
                  style={{
                    padding: "0.5rem",
                    fontSize: "0.875rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    background: "#fff",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLinkDropdown(true)}
                disabled={isProcessing}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  border: "1px dashed #ccc",
                  borderRadius: "4px",
                  background: "#fff",
                  color: "#666",
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Link to Variable
              </button>
            )
          )}
        </div>
      ) : (
        <PromoteToModelForm
          noteId={noteId}
          noteContent={noteContent}
          modelTypes={modelTypes}
          onCancel={() => setShowPromoteForm(false)}
          onSuccess={() => router.push("/lenses/world-model")}
        />
      )}
    </section>
  );
}

interface PromoteToModelFormProps {
  noteId: string;
  noteContent: string;
  modelTypes: readonly string[];
  onCancel: () => void;
  onSuccess: () => void;
}

function PromoteToModelForm({
  noteId,
  noteContent,
  modelTypes,
  onCancel,
  onSuccess,
}: PromoteToModelFormProps): React.ReactNode {
  const [modelType, setModelType] = useState<ModelType>("Descriptive");
  const [statement, setStatement] = useState(noteContent);
  const [confidence, setConfidence] = useState(0.7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Create the model
    const modelResult = await createModel(
      modelType,
      statement.trim(),
      confidence
    );

    if (!modelResult.ok) {
      setError(modelResult.error);
      setIsSubmitting(false);
      return;
    }

    // Mark note as processed
    const processResult = await processNote(noteId);

    if (!processResult.ok) {
      setError(processResult.error);
      setIsSubmitting(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit}>
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

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Model Type
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {modelTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setModelType(type as ModelType)}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.75rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                background: modelType === type ? "#000" : "#fff",
                color: modelType === type ? "#fff" : "#000",
                cursor: "pointer",
              }}
            >
              {type}
            </button>
          ))}
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#666",
            marginTop: "0.25rem",
          }}
        >
          {modelType === "Descriptive" && "How reality behaves"}
          {modelType === "Procedural" && "Methods that work"}
          {modelType === "Normative" && "Constraints and boundaries"}
        </p>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Statement
        </label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "0.75rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontFamily: "inherit",
            fontSize: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
          }}
          required
        />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <label
          style={{
            display: "block",
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "0.25rem",
          }}
        >
          Confidence: {Math.round(confidence * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={confidence * 100}
          onChange={(e) => setConfidence(Number(e.target.value) / 100)}
          style={{
            width: "100%",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          disabled={isSubmitting || !statement.trim()}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #000",
            borderRadius: "4px",
            background: "#000",
            color: "#fff",
            cursor: isSubmitting || !statement.trim() ? "not-allowed" : "pointer",
            opacity: isSubmitting || !statement.trim() ? 0.5 : 1,
          }}
        >
          {isSubmitting ? "Creating…" : "Create Model"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
            background: "#fff",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

