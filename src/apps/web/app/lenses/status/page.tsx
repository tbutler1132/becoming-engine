import Link from "next/link";
import { DEFAULT_PERSONAL_NODE, formatNodeRef } from "@libs/memory";
import { getStatusData } from "@libs/regulator";
import type { Variable, Episode } from "@libs/memory";
import { createStore } from "@/lib/store";
import { OpenExploreForm } from "./OpenExploreForm";
import { QuickCapture } from "./QuickCapture";
import styles from "./page.module.css";

export default async function StatusLensPage(): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();
  const status = getStatusData(state, DEFAULT_PERSONAL_NODE);

  // Get variables for this node
  const nodeVariables = state.variables.filter(
    (v) =>
      v.node.type === DEFAULT_PERSONAL_NODE.type &&
      v.node.id === DEFAULT_PERSONAL_NODE.id
  );

  // Get active episodes
  const activeEpisodes = status.mode === "active" ? status.episodes : [];

  // Find active Explore episode (there should be at most one active)
  const activeExplore = activeEpisodes.find((e) => e.type === "Explore");

  // Count inbox notes for visibility
  const inboxCount = state.notes.filter((n) => n.tags.includes("inbox")).length;

  // Get active Stabilize episodes indexed by variableId
  const stabilizeByVariable = new Map<string, Episode>();
  for (const episode of activeEpisodes) {
    if (episode.type === "Stabilize" && episode.variableId) {
      stabilizeByVariable.set(episode.variableId, episode);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Status</h1>
        <p className={styles.subtitle}>
          <span>{formatNodeRef(DEFAULT_PERSONAL_NODE)}</span>
          {inboxCount > 0 && (
            <Link href="/lenses/world-model" className={styles.inboxLink}>
              {inboxCount} {inboxCount === 1 ? "note" : "notes"} in inbox
            </Link>
          )}
        </p>
      </header>

      {activeExplore ? (
        <ExploreCard episode={activeExplore} />
      ) : (
        <OpenExploreForm />
      )}

      <section className={styles.variablesSection}>
        <h2 className={styles.sectionTitle}>Variables</h2>

        {nodeVariables.length > 0 ? (
          <ul className={styles.variablesList}>
            {nodeVariables.map((variable) => (
              <li key={variable.id} className={styles.variableItem}>
                <VariableCard variable={variable} />
                {stabilizeByVariable.get(variable.id) && (
                  <StabilizeCard
                    episode={stabilizeByVariable.get(variable.id)!}
                  />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>No variables defined</p>
        )}

        <Link href="/variables/new" className={styles.addButton}>
          + Add Variable
        </Link>
      </section>

      {/* Bottom padding to account for fixed QuickCapture */}
      <div className={styles.bottomSpacer} aria-hidden="true" />

      <QuickCapture />
    </main>
  );
}

interface ExploreCardProps {
  episode: Episode;
}

function ExploreCard({ episode }: ExploreCardProps): React.ReactNode {
  return (
    <Link href={`/episodes/${episode.id}`} className={styles.exploreCard}>
      <p className={styles.cardLabel}>Active Explore</p>
      <p>{episode.objective}</p>
    </Link>
  );
}

interface VariableCardProps {
  variable: Variable;
}

function VariableCard({ variable }: VariableCardProps): React.ReactNode {
  return (
    <Link
      href={`/variables/${variable.id}`}
      className={styles.variableCard}
      data-status={variable.status}
    >
      <span className={styles.variableName}>{variable.name}</span>
      <span className={styles.variableStatus}>{variable.status}</span>
    </Link>
  );
}

interface StabilizeCardProps {
  episode: Episode;
}

function StabilizeCard({ episode }: StabilizeCardProps): React.ReactNode {
  return (
    <Link href={`/episodes/${episode.id}`} className={styles.stabilizeCard}>
      <p className={styles.stabilizeLabel}>Stabilizing</p>
      <p className={styles.stabilizeObjective}>{episode.objective}</p>
    </Link>
  );
}
