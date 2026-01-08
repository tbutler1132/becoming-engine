"use client";

import { useState } from "react";
import type { Proxy, ProxyReading, ProxyValueType, VariableStatus } from "@libs/memory";
import { createProxy, logProxyReading, deleteProxy, signalVariableWithReason } from "@/app/actions";
import type { StatusSuggestion } from "@libs/regulator/internal/inference";
import { inferStatus } from "@libs/regulator/internal/inference";

interface ProxiesSectionProps {
  variableId: string;
  variableName: string;
  currentStatus: VariableStatus;
  proxies: Proxy[];
  recentReadingsByProxyId: Record<string, ProxyReading[]>;
}

export function ProxiesSection({
  variableId,
  variableName,
  currentStatus,
  proxies,
  recentReadingsByProxyId,
}: ProxiesSectionProps): React.ReactNode {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [logReadingProxyId, setLogReadingProxyId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<StatusSuggestion | null>(null);

  // Calculate suggestion when component mounts or readings change
  const calculateSuggestion = (): void => {
    for (const proxy of proxies) {
      const readings = recentReadingsByProxyId[proxy.id] ?? [];
      const s = inferStatus(proxy, readings);
      if (s && s.suggestedStatus !== currentStatus) {
        setSuggestion(s);
        return;
      }
    }
    setSuggestion(null);
  };

  return (
    <section style={{ marginTop: "2rem" }}>
      <h2
        style={{
          fontSize: "0.75rem",
          color: "#666",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "1rem",
        }}
      >
        Proxies
      </h2>

      {/* Status Suggestion Banner */}
      {suggestion && suggestion.suggestedStatus !== currentStatus && (
        <SuggestionBanner
          suggestion={suggestion}
          variableId={variableId}
          variableName={variableName}
          onAccept={() => setSuggestion(null)}
          onDismiss={() => setSuggestion(null)}
        />
      )}

      {/* Proxy List */}
      {proxies.length === 0 ? (
        <p style={{ color: "#666", fontSize: "0.875rem" }}>
          No proxies defined. Proxies help track concrete signals for this variable.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {proxies.map((proxy) => (
            <ProxyCard
              key={proxy.id}
              proxy={proxy}
              readings={recentReadingsByProxyId[proxy.id] ?? []}
              isLogging={logReadingProxyId === proxy.id}
              onStartLogging={() => setLogReadingProxyId(proxy.id)}
              onCancelLogging={() => setLogReadingProxyId(null)}
              onReadingLogged={() => {
                setLogReadingProxyId(null);
                calculateSuggestion();
              }}
            />
          ))}
        </div>
      )}

      {/* Create Proxy Button/Form */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            border: "1px dashed #666",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
            color: "#666",
          }}
        >
          + Add Proxy
        </button>
      ) : (
        <CreateProxyForm
          variableId={variableId}
          onCreated={() => setShowCreateForm(false)}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </section>
  );
}

interface ProxyCardProps {
  proxy: Proxy;
  readings: ProxyReading[];
  isLogging: boolean;
  onStartLogging: () => void;
  onCancelLogging: () => void;
  onReadingLogged: () => void;
}

function ProxyCard({
  proxy,
  readings,
  isLogging,
  onStartLogging,
  onCancelLogging,
  onReadingLogged,
}: ProxyCardProps): React.ReactNode {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Delete proxy "${proxy.name}"? This will also delete all readings.`)) {
      return;
    }
    setDeleting(true);
    await deleteProxy(proxy.id);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>{proxy.name}</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.125rem 0.5rem",
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          >
            {proxy.valueType}
            {proxy.unit && ` (${proxy.unit})`}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "0.25rem 0.5rem",
              fontSize: "0.75rem",
              backgroundColor: "transparent",
              border: "1px solid #cc6666",
              borderRadius: "4px",
              color: "#cc6666",
              cursor: deleting ? "not-allowed" : "pointer",
            }}
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>

      {proxy.description && (
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "#666" }}>
          {proxy.description}
        </p>
      )}

      {/* Thresholds */}
      {proxy.thresholds && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#888" }}>
          Thresholds:
          {proxy.thresholds.lowBelow !== undefined && ` Low if < ${proxy.thresholds.lowBelow}`}
          {proxy.thresholds.lowBelow !== undefined && proxy.thresholds.highAbove !== undefined && " |"}
          {proxy.thresholds.highAbove !== undefined && ` High if > ${proxy.thresholds.highAbove}`}
        </div>
      )}

      {/* Recent Readings */}
      {readings.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h4 style={{ margin: 0, fontSize: "0.75rem", color: "#666", marginBottom: "0.5rem" }}>
            Recent Readings
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {readings.slice(0, 5).map((reading) => (
              <div
                key={reading.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  padding: "0.25rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span style={{ fontFamily: "monospace" }}>
                  {reading.value.type === "numeric"
                    ? reading.value.value
                    : reading.value.type === "boolean"
                      ? reading.value.value ? "Yes" : "No"
                      : reading.value.value}
                </span>
                <span style={{ color: "#888", fontSize: "0.75rem" }}>
                  {new Date(reading.recordedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Reading Form */}
      {isLogging ? (
        <LogReadingForm
          proxy={proxy}
          onLogged={onReadingLogged}
          onCancel={onCancelLogging}
        />
      ) : (
        <button
          onClick={onStartLogging}
          style={{
            marginTop: "1rem",
            padding: "0.375rem 0.75rem",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Log Reading
        </button>
      )}
    </div>
  );
}

interface LogReadingFormProps {
  proxy: Proxy;
  onLogged: () => void;
  onCancel: () => void;
}

function LogReadingForm({ proxy, onLogged, onCancel }: LogReadingFormProps): React.ReactNode {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let proxyValue: { type: "numeric"; value: number } | { type: "boolean"; value: boolean } | { type: "categorical"; value: string };

    if (proxy.valueType === "numeric") {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        setError("Please enter a valid number");
        setSubmitting(false);
        return;
      }
      proxyValue = { type: "numeric", value: numValue };
    } else if (proxy.valueType === "boolean") {
      proxyValue = { type: "boolean", value: value.toLowerCase() === "yes" || value === "true" || value === "1" };
    } else {
      proxyValue = { type: "categorical", value };
    }

    const result = await logProxyReading({
      proxyId: proxy.id,
      value: proxyValue,
      source: "manual",
    });

    if (result.ok) {
      onLogged();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {proxy.valueType === "categorical" && proxy.categories ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">Select...</option>
            {proxy.categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        ) : proxy.valueType === "boolean" ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="">Select...</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        ) : (
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={proxy.unit ? `Value (${proxy.unit})` : "Value"}
            step="any"
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        )}
        <button
          type="submit"
          disabled={submitting || !value}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
      {error && (
        <p style={{ color: "#cc0000", fontSize: "0.75rem", marginTop: "0.5rem" }}>{error}</p>
      )}
    </form>
  );
}

interface CreateProxyFormProps {
  variableId: string;
  onCreated: () => void;
  onCancel: () => void;
}

function CreateProxyForm({ variableId, onCreated, onCancel }: CreateProxyFormProps): React.ReactNode {
  const [name, setName] = useState("");
  const [valueType, setValueType] = useState<ProxyValueType>("numeric");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [categories, setCategories] = useState("");
  const [lowBelow, setLowBelow] = useState("");
  const [highAbove, setHighAbove] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const thresholds =
      valueType === "numeric" && (lowBelow || highAbove)
        ? {
            ...(lowBelow ? { lowBelow: parseFloat(lowBelow) } : {}),
            ...(highAbove ? { highAbove: parseFloat(highAbove) } : {}),
          }
        : undefined;

    const categoriesArray =
      valueType === "categorical" && categories
        ? categories.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;

    const result = await createProxy({
      variableId,
      name,
      valueType,
      description: description || undefined,
      unit: unit || undefined,
      categories: categoriesArray,
      thresholds,
    });

    if (result.ok) {
      onCreated();
    } else {
      setError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "1rem",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "1rem",
      }}
    >
      <h3 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>New Proxy</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Sleep hours"
            required
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
            Value Type *
          </label>
          <select
            value={valueType}
            onChange={(e) => setValueType(e.target.value as ProxyValueType)}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="numeric">Numeric</option>
            <option value="boolean">Boolean (Yes/No)</option>
            <option value="categorical">Categorical</option>
          </select>
        </div>

        {valueType === "numeric" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., hours"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {valueType === "numeric" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
                Low if below
              </label>
              <input
                type="number"
                value={lowBelow}
                onChange={(e) => setLowBelow(e.target.value)}
                placeholder="Threshold"
                step="any"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
                High if above
              </label>
              <input
                type="number"
                value={highAbove}
                onChange={(e) => setHighAbove(e.target.value)}
                placeholder="Threshold"
                step="any"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        )}

        {valueType === "categorical" && (
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
              Categories (comma-separated) *
            </label>
            <input
              type="text"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              placeholder="e.g., Good, Okay, Poor"
              required={valueType === "categorical"}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this proxy measure?"
            rows={2}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button
          type="submit"
          disabled={submitting || !name}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#333",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Creating..." : "Create Proxy"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <p style={{ color: "#cc0000", fontSize: "0.75rem", marginTop: "0.5rem" }}>{error}</p>
      )}
    </form>
  );
}

interface SuggestionBannerProps {
  suggestion: StatusSuggestion;
  variableId: string;
  variableName: string;
  onAccept: () => void;
  onDismiss: () => void;
}

function SuggestionBanner({
  suggestion,
  variableId,
  variableName,
  onAccept,
  onDismiss,
}: SuggestionBannerProps): React.ReactNode {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async (): Promise<void> => {
    setAccepting(true);
    const result = await signalVariableWithReason(
      variableId,
      suggestion.suggestedStatus,
      suggestion.reason
    );
    if (result.ok) {
      onAccept();
    }
    setAccepting(false);
  };

  return (
    <div
      style={{
        padding: "1rem",
        backgroundColor: "#fffbf0",
        border: "1px solid #e6c869",
        borderRadius: "4px",
        marginBottom: "1rem",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.875rem" }}>
        <strong>Suggested status:</strong> Based on recent readings, {variableName} might be{" "}
        <strong>{suggestion.suggestedStatus}</strong>.
      </p>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#666" }}>
        {suggestion.reason} (confidence: {Math.round(suggestion.confidence * 100)}%)
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button
          onClick={handleAccept}
          disabled={accepting}
          style={{
            padding: "0.375rem 0.75rem",
            backgroundColor: "#4a9f4a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: accepting ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
          }}
        >
          {accepting ? "Accepting..." : "Accept"}
        </button>
        <button
          onClick={onDismiss}
          style={{
            padding: "0.375rem 0.75rem",
            backgroundColor: "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

