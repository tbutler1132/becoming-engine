import styles from "./Field.module.css";

interface FieldProps {
  label: string;
  value: string;
}

/**
 * Displays a label/value pair in a definition list style.
 * Note: For proper semantics, wrap multiple Field components in a <dl> element.
 */
export function Field({ label, value }: FieldProps): React.ReactNode {
  return (
    <div className={styles.field}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
