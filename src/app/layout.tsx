import type { Metadata } from "next";
import "./globals.css";
import { Fredoka, Plus_Jakarta_Sans, JetBrains_Mono, Quicksand, Be_Vietnam_Pro } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";

const fredoka   = Fredoka({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-fredoka" });
const jakarta   = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-jakarta" });
const mono      = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-mono" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-quicksand" });
const vietnam   = Be_Vietnam_Pro({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-vietnam" });

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
    <ViewTransitions>
      <html lang="it" className={`${fredoka.variable} ${jakarta.variable} ${mono.variable} ${quicksand.variable} ${vietnam.variable}`}>
        <head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" />
        </head>
        <body>{children}</body>
      </html>
    </ViewTransitions>
  );
}
