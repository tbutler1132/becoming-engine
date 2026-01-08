"use client";

/**
 * NodeSelector — Hierarchical node selection dropdown
 *
 * Displays all nodes in a hierarchical tree structure, allowing users to
 * switch between different nodes. Uses URL query params for server-side
 * rendering compatibility.
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
// Import types only (no runtime code) and pure functions from hierarchy
// Avoid importing from @libs/memory barrel which includes server-only store.ts
import type { Node, State } from "../../../libs/memory/types.js";
import {
  getRootNodes,
  getChildNodes,
} from "../../../libs/memory/hierarchy.js";
import { NODE_PARAM, getNodeKindIcon } from "@/lib/node-context";
import styles from "./NodeSelector.module.css";

interface NodeSelectorProps {
  /** Current state (for hierarchy lookup) */
  state: State;
  /** Currently selected node ID */
  selectedNodeId: string;
}

/**
 * Recursive option rendering for hierarchy display
 */
function NodeOption({
  node,
  state,
  depth,
}: {
  node: Node;
  state: State;
  depth: number;
}): React.ReactNode {
  const children = getChildNodes(state, node.id);
  const indent = "\u00A0\u00A0".repeat(depth); // Non-breaking spaces
  const icon = getNodeKindIcon(node.kind);

  return (
    <>
      <option value={node.id}>
        {indent}
        {icon} {node.name}
      </option>
      {children.map((child) => (
        <NodeOption key={child.id} node={child} state={state} depth={depth + 1} />
      ))}
    </>
  );
}

export function NodeSelector({
  state,
  selectedNodeId,
}: NodeSelectorProps): React.ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newNodeId = e.target.value;
      const params = new URLSearchParams(searchParams.toString());

      if (newNodeId === "personal") {
        // Remove param for cleaner URLs on default
        params.delete(NODE_PARAM);
      } else {
        params.set(NODE_PARAM, newNodeId);
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(url);
    },
    [router, pathname, searchParams],
  );

  const rootNodes = getRootNodes(state);

  // If no nodes exist, show a placeholder
  if (state.nodes.length === 0) {
    return (
      <div className={styles.container}>
        <span className={styles.label}>No nodes</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <label htmlFor="node-selector" className={styles.label}>
        Node:
      </label>
      <select
        id="node-selector"
        className={styles.select}
        value={selectedNodeId}
        onChange={handleChange}
      >
        {rootNodes.map((node) => (
          <NodeOption key={node.id} node={node} state={state} depth={0} />
        ))}
      </select>
    </div>
  );
}

