import Link from "next/link";
import { createStore } from "@/lib/store";
import { NodeSelector } from "@/components/NodeSelector";
import { getSelectedNodeId } from "@/lib/node-context";
import styles from "./layout.module.css";

interface LensesLayoutProps {
  children: React.ReactNode;
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined> | undefined>;
}

export default async function LensesLayout({
  children,
  searchParams,
}: LensesLayoutProps): Promise<React.ReactNode> {
  const store = createStore();
  const state = await store.load();
  const resolvedParams = await searchParams;
  const selectedNodeId = getSelectedNodeId(resolvedParams);

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link href="/lenses/status" className={styles.navLink}>
            Status
          </Link>
          <Link href="/lenses/actions" className={styles.navLink}>
            Actions
          </Link>
          <Link href="/lenses/world-model" className={styles.navLink}>
            World Model
          </Link>
        </nav>
        <NodeSelector state={state} selectedNodeId={selectedNodeId} />
      </header>
      {children}
    </>
  );
}
