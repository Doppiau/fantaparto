import type { Metadata } from "next";
import "./globals.css";
import { Fredoka, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-fredoka" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-jakarta" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-mono" });

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
    <html lang="it" className={`${fredoka.variable} ${jakarta.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
