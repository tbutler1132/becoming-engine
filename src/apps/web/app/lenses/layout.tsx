import Link from "next/link";

export default function LensesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <>
      <nav
        style={{
          padding: "1rem 2rem",
          borderBottom: "1px solid #ccc",
          display: "flex",
          gap: "2rem",
        }}
      >
        <Link href="/lenses/status" style={{ color: "#222" }}>
          Status
        </Link>
        <Link href="/lenses/actions" style={{ color: "#222" }}>
          Actions
        </Link>
        <Link href="/lenses/world-model" style={{ color: "#222" }}>
          World Model
        </Link>
      </nav>
      {children}
    </>
  );
}

