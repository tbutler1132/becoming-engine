import { EPISODE_TYPES } from "@libs/memory";
import { getVariables } from "@/app/actions";
import { NewEpisodeForm } from "./NewEpisodeForm";

export default async function NewEpisodePage(): Promise<React.ReactNode> {
  const variables = await getVariables();

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
          New Episode
        </p>
        <h1 style={{ fontSize: "1.5rem" }}>Create Episode</h1>
      </header>

      <NewEpisodeForm episodeTypes={EPISODE_TYPES} variables={variables} />
    </main>
  );
}

