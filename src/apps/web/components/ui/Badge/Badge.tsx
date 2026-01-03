import styles from "./Badge.module.css";

type BadgeVariant =
  | "Low"
  | "InRange"
  | "High"
  | "Stabilize"
  | "Explore"
  | "Pending"
  | "Done";

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
}

export function Badge({ children, variant }: BadgeProps): React.ReactNode {
  return (
    <span className={styles.badge} data-variant={variant}>
      {children}
    </span>
  );
}

