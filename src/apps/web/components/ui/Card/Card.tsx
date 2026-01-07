import type { ComponentPropsWithoutRef } from "react";
import styles from "./Card.module.css";

type CardVariant = "default" | "compact";
type CardStatus = "Low" | "InRange" | "High";

interface CardProps extends ComponentPropsWithoutRef<"article"> {
  /** Size variant */
  variant?: CardVariant;
  /** Status for color-coding */
  status?: CardStatus;
  /** Whether the card is interactive (clickable) */
  interactive?: boolean;
}

/**
 * Base card component using semantic <article> element.
 * Uses CSS Modules and CSS variables for theming.
 */
export function Card({
  variant = "default",
  status,
  interactive = false,
  className,
  children,
  ...props
}: CardProps): React.ReactNode {
  const classes = [
    styles.card,
    variant === "compact" ? styles.compact : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={classes}
      data-status={status}
      data-interactive={interactive}
      {...props}
    >
      {children}
    </article>
  );
}

