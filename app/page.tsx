"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import { deleteProject, getProjects, saveProject } from "@/lib/db";
import type { Project } from "@/types";

const ONBOARDED_KEY = "mermaid-gpt-onboarded";

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
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const allowed = Boolean(session?.user?.allowed);

  const refreshProjects = useCallback(() => {
    if (typeof window === "undefined" || !allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [allowed]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(ONBOARDED_KEY)) setIsFirstVisit(true);
  }, []);

  const handleDismissWelcome = () => {
    setIsFirstVisit(false);
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      // ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent, p: Project) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteProject(p.id);
      refreshProjects();
    } catch {
      // ignore
    }
  };

  const handleRename = async (e: React.MouseEvent, p: Project) => {
    e.preventDefault();
    e.stopPropagation();
    const name = prompt("Rename diagram", p.name);
    if (name == null || name.trim() === p.name.trim()) return;
    try {
      await saveProject({ id: p.id, name: name.trim(), mermaidCode: p.mermaidCode, description: p.description });
      refreshProjects();
    } catch {
      // ignore
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, p: Project) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await saveProject({ name: `${p.name} (copy)`, mermaidCode: p.mermaidCode, description: p.description });
      refreshProjects();
    } catch {
      // ignore
    }
  };

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
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-xl font-semibold text-slate-100 tracking-tight">MermaidGPT</span>
          <span className="hidden sm:inline text-xs font-medium px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/40">
            AI Mermaid IDE
          </span>
        </Link>
        <AuthButton />
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-8 px-6">
        <section className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-100 mb-2">Design diagrams at the speed of thought.</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            MermaidGPT is a focused workspace for engineers to write Mermaid, preview diagrams, and use GPT to fix, improve, or generate architecture and flow diagrams.
          </p>
        </section>
        {isFirstVisit && (
          <div className="mb-6 rounded-xl border border-sky-700/50 bg-sky-950/40 px-4 py-3 flex items-start gap-3">
            <div className="mt-0.5 text-sky-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1010 10A10.011 10.011 0 0012 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-100 mb-1.5">Welcome to MermaidGPT</h2>
              <p className="text-xs text-slate-300">Write Mermaid on the left, see a live diagram in the middle, and use the AI assistant to fix, improve, or generate diagrams.</p>
            </div>
            <button type="button" onClick={handleDismissWelcome} className="shrink-0 text-slate-400 hover:text-slate-100 text-xl leading-none" aria-label="Dismiss">×</button>
          </div>
        )}

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

        <section className="mb-10 space-y-3">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Start from a template</h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Jump straight into common diagram types – you can always customize the Mermaid later.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
            <Link href="/diagram?template=flowchart" className="rounded-lg border border-slate-700/60 bg-surface-900/80 hover:bg-surface-800/80 px-3 py-2 text-sm text-slate-200 transition-colors">
              Flowchart
              <span className="block text-[11px] text-slate-500">Processes & decisions</span>
            </Link>
            <Link href="/diagram?template=sequence" className="rounded-lg border border-slate-700/60 bg-surface-900/80 hover:bg-surface-800/80 px-3 py-2 text-sm text-slate-200 transition-colors">
              Sequence
              <span className="block text-[11px] text-slate-500">Requests & responses</span>
            </Link>
            <Link href="/diagram?template=architecture" className="rounded-lg border border-slate-700/60 bg-surface-900/80 hover:bg-surface-800/80 px-3 py-2 text-sm text-slate-200 transition-colors">
              Architecture
              <span className="block text-[11px] text-slate-500">Systems & services</span>
            </Link>
            <Link href="/diagram?template=state" className="rounded-lg border border-slate-700/60 bg-surface-900/80 hover:bg-surface-800/80 px-3 py-2 text-sm text-slate-200 transition-colors">
              State machine
              <span className="block text-[11px] text-slate-500">States & transitions</span>
            </Link>
            <Link href="/diagram?template=er" className="rounded-lg border border-slate-700/60 bg-surface-900/80 hover:bg-surface-800/80 px-3 py-2 text-sm text-slate-200 transition-colors">
              ER diagram
              <span className="block text-[11px] text-slate-500">Entities & relations</span>
            </Link>
            <Link href="/diagram?template=c4" className="rounded-lg border border-slate-700/60 bg-surface-900/80 hover:bg-surface-800/80 px-3 py-2 text-sm text-slate-200 transition-colors">
              C4 context
              <span className="block text-[11px] text-slate-500">System context</span>
            </Link>
          </div>
        </section>

        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Recent diagrams</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="space-y-3 text-sm">
            <p className="text-slate-500">No diagrams yet. Create one above or start from a template:</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/diagram?template=flowchart" className="px-3 py-1.5 rounded-lg bg-surface-800 border border-slate-600 text-slate-200 hover:bg-surface-700 transition-colors">Flowchart</Link>
              <Link href="/diagram?template=sequence" className="px-3 py-1.5 rounded-lg bg-surface-800 border border-slate-600 text-slate-200 hover:bg-surface-700 transition-colors">Sequence</Link>
              <Link href="/diagram?template=class" className="px-3 py-1.5 rounded-lg bg-surface-800 border border-slate-600 text-slate-200 hover:bg-surface-700 transition-colors">Class</Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map((p) => (
              <li key={p.id} className="group relative">
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
                    {p.description && (
                      <span className="text-[11px] text-slate-400 block truncate">{p.description}</span>
                    )}
                    <span className="text-xs text-slate-500">{formatDate(p.updatedAt)}</span>
                  </div>
                  <span className="text-slate-500 shrink-0" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-900/95 rounded-md px-1 py-0.5 border border-slate-700/50">
                  <button type="button" onClick={(e) => handleRename(e, p)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded" title="Rename">Rename</button>
                  <button type="button" onClick={(e) => handleDuplicate(e, p)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded" title="Duplicate">Duplicate</button>
                  <button type="button" onClick={(e) => handleDelete(e, p)} className="p-1.5 text-red-400 hover:text-red-300 rounded" title="Delete">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-10 border-t border-slate-800 pt-4 text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
          <span>Questions or ideas?</span>
          <a
            href="mailto:ozben+mermaidgpt@ozbenergin.com?subject=MermaidGPT%20feedback"
            className="underline underline-offset-4 decoration-slate-600 hover:decoration-sky-500 hover:text-slate-300"
          >
            Send feedback
          </a>
        </footer>
      </main>
    </div>
  );
}
