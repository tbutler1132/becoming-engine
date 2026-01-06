"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createVariable } from "@/app/actions";
import type { MeasurementCadence, NodeType } from "@libs/memory";

/**
 * Initial values for the form, optionally derived from a template.
 */
interface FormInitialValues {
  name: string;
  description: string;
  preferredRange: string;
  measurementCadence: MeasurementCadence | "";
  /** Whether these values came from a template (shows 'customize this' cues) */
  fromTemplate: boolean;
}

interface NewVariableFormProps {
  nodeTypes: readonly string[];
  measurementCadences: readonly string[];
  /** Optional initial values from a template */
  initialValues?: FormInitialValues;
}

export function NewVariableForm({
  nodeTypes,
  measurementCadences,
  initialValues,
}: NewVariableFormProps): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [nodeType, setNodeType] = useState<NodeType>("Personal");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [preferredRange, setPreferredRange] = useState(
    initialValues?.preferredRange ?? ""
  );
  const [measurementCadence, setMeasurementCadence] = useState(
    initialValues?.measurementCadence ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromTemplate = initialValues?.fromTemplate ?? false;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSaving(true);

    const result = await createVariable({
      name: name.trim(),
      nodeType,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(preferredRange.trim()
        ? { preferredRange: preferredRange.trim() }
        : {}),
      ...(measurementCadence
        ? { measurementCadence: measurementCadence as MeasurementCadence }
        : {}),
    });

    if (!result.ok) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push(`/variables/${result.value}`);
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

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="name"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Runway, Focus, Energy"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          />
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.5rem",
            }}
          >
            A short, memorable name for this dimension of viability.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="nodeType"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Node
          </label>
          <select
            id="nodeType"
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as NodeType)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              background: "white",
            }}
          >
            {nodeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.5rem",
            }}
          >
            Which entity does this variable belong to?
          </p>
        </div>

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
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this variable regulate?"
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              resize: "vertical",
            }}
          />
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.5rem",
            }}
          >
            Explain what this variable measures or regulates.
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="preferredRange"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Preferred Range
          </label>
          <textarea
            id="preferredRange"
            value={preferredRange}
            onChange={(e) => setPreferredRange(e.target.value)}
            placeholder='e.g., "6+ months of expenses" or "Able to focus for 2+ hour blocks"'
            style={{
              width: "100%",
              minHeight: "60px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              resize: "vertical",
            }}
          />
          <p
            style={{
              fontSize: "0.75rem",
              color: fromTemplate ? "#92400e" : "#666",
              marginTop: "0.5rem",
            }}
          >
            {fromTemplate
              ? "This is a suggested starting point — customize for YOUR context."
              : "Qualitative belief about what \"in range\" means for this dimension."}
          </p>
        </div>

        <div>
          <label
            htmlFor="measurementCadence"
            style={{
              display: "block",
              fontSize: "0.75rem",
              color: "#666",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.5rem",
            }}
          >
            Measurement Cadence
          </label>
          <select
            id="measurementCadence"
            value={measurementCadence}
            onChange={(e) => setMeasurementCadence(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
              background: "white",
            }}
          >
            <option value="">Not specified</option>
            {measurementCadences.map((cadence) => (
              <option key={cadence} value={cadence}>
                {cadence}
              </option>
            ))}
          </select>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#666",
              marginTop: "0.5rem",
            }}
          >
            How often should this variable be evaluated?
          </p>
        </div>
      </section>

      <section
        style={{
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          background: "#f9f9f9",
        }}
      >
        <dl style={{ display: "grid", gap: "0.75rem", margin: 0 }}>
          <div>
            <dt
              style={{
                fontSize: "0.75rem",
                color: "#666",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Initial Status
            </dt>
            <dd style={{ margin: 0, fontSize: "0.875rem" }}>Unknown</dd>
          </div>
        </dl>
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
          {isSaving ? "Creating…" : "Create Variable"}
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

