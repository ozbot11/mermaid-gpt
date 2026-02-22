import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "MermaidGPT",
  description: "Write, edit, render, and AI-assist Mermaid diagrams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface-950 text-slate-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
