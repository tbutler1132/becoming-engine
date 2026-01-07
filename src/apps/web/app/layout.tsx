import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Becoming Engine",
  description: "A cybernetic instrument for viability and learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
