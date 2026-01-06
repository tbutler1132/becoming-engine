interface FieldProps {
  label: string;
  value: string;
}

/**
 * Displays a label/value pair in a definition list style.
 */
export function Field({ label, value }: FieldProps): React.ReactNode {
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
        {label}
      </dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

