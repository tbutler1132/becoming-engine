import styles from "./Button.module.css";

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className,
  onClick,
}: ButtonProps): React.ReactNode {
  return (
    <button
      type={type}
      className={`${styles.button} ${className ?? ""}`}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

