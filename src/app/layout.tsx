import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FantaParto",
  description: "Il gioco social per la gravidanza",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
