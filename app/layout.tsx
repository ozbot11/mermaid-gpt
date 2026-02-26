import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/lib/ThemeContext";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("mermaid-gpt-theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface-950 text-slate-200">
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
