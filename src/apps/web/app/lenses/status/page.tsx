import Link from "next/link";
import { getNodeById } from "@libs/memory";
import { getStatusData } from "@libs/regulator";
import type { Variable, Episode } from "@libs/memory";
import { createStore } from "@/lib/store";
import {
  getSelectedNodeId,
  getNodeRef,
  buildNodeUrl,
  getNodeKindIcon,
} from "@/lib/node-context";
import { NodeBreadcrumb } from "@/components/NodeBreadcrumb";
import { OpenExploreForm } from "./OpenExploreForm";
import { QuickCapture } from "./QuickCapture";
import styles from "./page.module.css";

interface StatusLensPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StatusLensPage({
  searchParams,
}: StatusLensPageProps): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();

  // Get selected node from URL
  const resolvedParams = await searchParams;
  const selectedNodeId = getSelectedNodeId(resolvedParams);
  const nodeRef = getNodeRef(state, selectedNodeId);
  const currentNode = getNodeById(state, selectedNodeId);

  // Get status for the selected node
  const status = getStatusData(state, nodeRef);

  // Get variables for this node
  const nodeVariables = state.variables.filter(
    (v) => v.node.type === nodeRef.type && v.node.id === nodeRef.id,
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

  // Display name for the node
  const nodeName = currentNode?.name ?? `${nodeRef.type}:${nodeRef.id}`;
  const nodeKindIcon = currentNode ? getNodeKindIcon(currentNode.kind) : "📍";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Status</h1>
          <NodeBreadcrumb
            state={state}
            nodeId={selectedNodeId}
            basePath="/lenses/status"
          />
        </div>
        <p className={styles.subtitle}>
          <span>
            {nodeKindIcon} {nodeName}
          </span>
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
        <OpenExploreForm nodeId={selectedNodeId} />
      )}

      <section className={styles.variablesSection}>
        <h2 className={styles.sectionTitle}>Variables</h2>

        {nodeVariables.length > 0 ? (
          <ul className={styles.variablesList}>
            {nodeVariables.map((variable) => (
              <li key={variable.id} className={styles.variableItem}>
                <VariableCard variable={variable} nodeId={selectedNodeId} />
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

        <Link
          href={buildNodeUrl("/variables/new", selectedNodeId)}
          className={styles.addButton}
        >
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
  nodeId: string;
}

function VariableCard({
  variable,
  nodeId,
}: VariableCardProps): React.ReactNode {
  return (
    <Link
      href={buildNodeUrl(`/variables/${variable.id}`, nodeId)}
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
