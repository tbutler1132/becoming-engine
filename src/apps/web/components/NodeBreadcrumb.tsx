/**
 * NodeBreadcrumb — Shows the current node's ancestry path
 *
 * Displays a breadcrumb trail from root to current node, allowing
 * users to navigate up the hierarchy.
 */

import Link from "next/link";
// Import types only (no runtime code) and pure functions from hierarchy
// Avoid importing from @libs/memory barrel which includes server-only store.ts
import type { State } from "../../../libs/memory/types.js";
import {
  getNodeById,
  getNodeAncestry,
} from "../../../libs/memory/hierarchy.js";
import { buildNodeUrl, getNodeKindIcon } from "@/lib/node-context";
import styles from "./NodeBreadcrumb.module.css";

interface NodeBreadcrumbProps {
  /** Current state (for hierarchy lookup) */
  state: State;
  /** Currently selected node ID */
  nodeId: string;
  /** Base path for links (e.g., "/lenses/status") */
  basePath: string;
}

export function NodeBreadcrumb({
  state,
  nodeId,
  basePath,
}: NodeBreadcrumbProps): React.ReactNode {
  const currentNode = getNodeById(state, nodeId);
  const ancestors = getNodeAncestry(state, nodeId).reverse(); // Root first

  // If no node found or no ancestors, don't render
  if (!currentNode) {
    return null;
  }

  // If node has no ancestors, just show the current node (no breadcrumb needed)
  if (ancestors.length === 0) {
    return (
      <nav className={styles.breadcrumb} aria-label="Node hierarchy">
        <span className={styles.current}>
          {getNodeKindIcon(currentNode.kind)} {currentNode.name}
        </span>
      </nav>
    );
  }

  return (
    <nav className={styles.breadcrumb} aria-label="Node hierarchy">
      {ancestors.map((node) => (
        <span key={node.id} className={styles.item}>
          <Link href={buildNodeUrl(basePath, node.id)} className={styles.link}>
            {getNodeKindIcon(node.kind)} {node.name}
          </Link>
          <span className={styles.separator} aria-hidden="true">
            /
          </span>
        </span>
      ))}
      <span className={styles.current}>
        {getNodeKindIcon(currentNode.kind)} {currentNode.name}
      </span>
    </nav>
  );
}

