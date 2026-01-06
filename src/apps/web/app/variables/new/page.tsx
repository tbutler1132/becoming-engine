import { MEASUREMENT_CADENCES, NODE_TYPES } from "@libs/memory";
import { NewVariableForm } from "./NewVariableForm";

export default function NewVariablePage(): React.ReactNode {
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
          New Variable
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>Create Variable</h1>
      </header>

      <NewVariableForm
        nodeTypes={NODE_TYPES}
        measurementCadences={MEASUREMENT_CADENCES}
      />
    </main>
  );
}

