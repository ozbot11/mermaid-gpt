"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { getProjects } from "@/lib/db";
import type { Project } from "@/types";

function formatDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const days = Math.round((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const allowed = Boolean(session?.user?.allowed);

  useEffect(() => {
    if (typeof window === "undefined" || !allowed) {
      setLoading(false);
      return;
    }
    getProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex flex-col h-screen bg-surface-950 items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col h-screen bg-surface-950 items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold text-slate-100">MermaidGPT</h1>
        <p className="text-slate-400 text-center">Sign in to access the app.</p>
        <AuthButton />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex flex-col h-screen bg-surface-950 items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold text-slate-100">Access denied</h1>
        <p className="text-slate-400 text-center max-w-sm">
          Your account is not on the access list. Contact the owner if you need access.
        </p>
        <AuthButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-950">
      <header className="shrink-0 flex items-center justify-between py-3 px-6 border-b border-slate-700/60 bg-surface-900/95 backdrop-blur-sm">
        <Link href="/" className="text-xl font-semibold text-slate-100 tracking-tight">
          MermaidGPT
        </Link>
        <AuthButton />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-8 px-6">
        <div className="mb-8">
          <Link
            href="/diagram"
            className="inline-flex items-center gap-3 rounded-xl border border-slate-600/80 bg-surface-800/80 hover:bg-surface-700/80 hover:border-slate-500 text-slate-200 transition-colors p-4 w-full sm:w-auto"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-lg bg-sky-500/20 text-sky-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <div className="text-left">
              <span className="font-medium block">New diagram</span>
              <span className="text-sm text-slate-500">Create a new Mermaid diagram</span>
            </div>
          </Link>
        </div>

        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Recent diagrams</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-slate-500 text-sm">No diagrams yet. Create one with &quot;New diagram&quot; above.</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/diagram?id=${p.id}`}
                  className="flex items-center gap-4 rounded-lg px-4 py-3 text-slate-200 hover:bg-surface-800/80 transition-colors border border-transparent hover:border-slate-700/50"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-700/50 text-slate-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-slate-100 block truncate">{p.name}</span>
                    <span className="text-xs text-slate-500">{formatDate(p.updatedAt)}</span>
                  </div>
                  <span className="text-slate-500 shrink-0" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
