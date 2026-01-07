import Link from "next/link";
import styles from "./layout.module.css";

export default function LensesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <>
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
      {children}
    </>
  );
}
