import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  status?: "Low" | "InRange" | "High";
  className?: string;
}

export function Card({ children, status, className }: CardProps): React.ReactNode {
  return (
    <div
      className={`${styles.card} ${className ?? ""}`}
      data-status={status}
    >
      {children}
    </div>
  );
}

