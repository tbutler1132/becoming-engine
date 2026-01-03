import path from "path";
import { JsonStore, DEFAULT_PERSONAL_NODE, formatNodeRef } from "@libs/memory";
import { getStatusData } from "@libs/regulator";
import type { Action, Episode, Variable } from "@libs/memory";
import { Card, Badge, Button } from "@/components/ui";
import { OpenStabilizeForm } from "@/components/OpenStabilizeForm";
import { OpenExploreForm } from "@/components/OpenExploreForm";
import { CloseEpisodeForm } from "@/components/CloseEpisodeForm";
import { AddActionForm } from "@/components/AddActionForm";
import { completeAction } from "./actions";
import styles from "./page.module.css";

/**
 * Get the project root path.
 * The web app is at src/apps/web, so we go up 3 levels from cwd.
 */
function getProjectRoot(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("src/apps/web") || cwd.includes("/src/apps/web")) {
    return path.resolve(cwd, "../../..");
  }
  return cwd;
}

export default async function StatusPage(): Promise<React.ReactNode> {
  const store = new JsonStore({ basePath: getProjectRoot() });
  const state = await store.load();
  const status = getStatusData(state, DEFAULT_PERSONAL_NODE);

  // Always show variables for this node, regardless of mode
  const nodeVariables = state.variables.filter(
    (v) =>
      v.node.type === DEFAULT_PERSONAL_NODE.type &&
      v.node.id === DEFAULT_PERSONAL_NODE.id
  );

  // Get active episodes for this node
  const activeEpisodes =
    status.mode === "active" ? status.episodes : [];
  const pendingActions =
    status.mode === "active" ? status.actions : [];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>Status</h1>
              <p className={styles.subtitle}>
                {formatNodeRef(DEFAULT_PERSONAL_NODE)}
              </p>
            </div>
            <OpenExploreForm />
          </div>
        </header>

        <VariablesSection variables={nodeVariables} />

        {activeEpisodes.length > 0 ? (
          <EpisodesSection episodes={activeEpisodes} actions={pendingActions} />
        ) : (
          <BaselineMessage />
        )}
      </div>
    </main>
  );
}

function BaselineMessage(): React.ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.baselineMessage}>
        <p className={styles.baselineText}>
          No active interventions. All quiet.
        </p>
      </div>
    </section>
  );
}

interface VariablesSectionProps {
  variables: Variable[];
}

function VariablesSection({
  variables,
}: VariablesSectionProps): React.ReactNode {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Variables</h2>
      <div className={styles.cardList}>
        {variables.map((variable) => (
          <Card key={variable.id} status={variable.status}>
            <div className={styles.variableContent}>
              <div className={styles.variableInfo}>
                <span className={styles.variableName}>{variable.name}</span>
                <Badge variant={variable.status}>{variable.status}</Badge>
              </div>
              <OpenStabilizeForm
                variableId={variable.id}
                variableName={variable.name}
              />
            </div>
          </Card>
        ))}
        {variables.length === 0 && (
          <p className={styles.emptyState}>No variables defined</p>
        )}
      </div>
    </section>
  );
}

interface EpisodesSectionProps {
  episodes: Episode[];
  actions: Action[];
}

function EpisodesSection({
  episodes,
  actions,
}: EpisodesSectionProps): React.ReactNode {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Active Episodes</h2>
      <div className={styles.cardList}>
        {episodes.map((episode) => {
          const episodeActions = actions.filter(
            (a) => a.episodeId === episode.id
          );
          return (
            <EpisodeCard
              key={episode.id}
              episode={episode}
              actions={episodeActions}
            />
          );
        })}
      </div>
    </section>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  actions: Action[];
}

function EpisodeCard({ episode, actions }: EpisodeCardProps): React.ReactNode {
  return (
    <Card>
      <div className={styles.episodeHeader}>
        <span className={styles.episodeObjective}>{episode.objective}</span>
        <div className={styles.episodeMeta}>
          <Badge variant={episode.type}>{episode.type}</Badge>
          <CloseEpisodeForm
            episodeId={episode.id}
            episodeType={episode.type}
          />
        </div>
      </div>

      <div className={styles.episodeActions}>
        {actions.length > 0 && (
          <>
            <h3 className={styles.episodeActionsTitle}>Actions</h3>
            {actions.map((action) => (
              <ActionItem key={action.id} action={action} />
            ))}
          </>
        )}
        <AddActionForm episodeId={episode.id} />
      </div>
    </Card>
  );
}

interface ActionItemProps {
  action: Action;
}

function ActionItem({ action }: ActionItemProps): React.ReactNode {
  const completeActionWithId = completeAction.bind(null, action.id);

  return (
    <div className={styles.actionItem}>
      <span className={styles.actionDescription}>{action.description}</span>
      {action.status === "Pending" && (
        <form action={completeActionWithId}>
          <Button type="submit" size="sm" variant="secondary">
            Done
          </Button>
        </form>
      )}
      {action.status === "Done" && <Badge variant="Done">Done</Badge>}
    </div>
  );
}
