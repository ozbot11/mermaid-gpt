"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getProjects, saveProject, getProject, deleteProject } from "@/lib/db";
import type { Project } from "@/types";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

interface ProjectsDropdownProps {
  mermaidCode: string;
  onLoadProject: (mermaidCode: string) => void;
  onNewProject: () => void;
}

export default function ProjectsDropdown({ mermaidCode, onLoadProject, onNewProject }: ProjectsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const refresh = useCallback(() => {
    getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (open) {
      refresh();
      const btn = buttonRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setDropdownRect({ top: rect.bottom + 4, left: rect.left });
      }
    } else {
      setDropdownRect(null);
    }
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSaveCurrent = useCallback(() => {
    const name = window.prompt("Project name", "Untitled");
    if (name === null) return;
    setSaving(true);
    saveProject({ name: name.trim() || "Untitled", mermaidCode })
      .then(() => refresh())
      .finally(() => setSaving(false));
  }, [mermaidCode, refresh]);

  const handleLoad = useCallback(
    (id: number) => {
      getProject(id).then((p) => {
        if (p) {
          onLoadProject(p.mermaidCode);
          setOpen(false);
        }
      });
    },
    [onLoadProject]
  );

  const handleDelete = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project?")) return;
    setDeletingId(id);
    deleteProject(id)
      .then(() => refresh())
      .finally(() => setDeletingId(null));
  }, [refresh]);

  const handleNewProject = useCallback(() => {
    onNewProject();
    setOpen(false);
  }, [onNewProject]);

  const dropdownPanel =
    open && dropdownRect && typeof document !== "undefined"
      ? createPortal(
          <div
            className="w-72 rounded-lg border border-slate-700/50 bg-surface-900 shadow-xl z-[100] overflow-hidden"
            style={{
              position: "fixed",
              top: dropdownRect.top,
              left: dropdownRect.left,
              maxHeight: "85vh",
            }}
          >
            <div className="p-2 space-y-1.5 border-b border-slate-700/50 shrink-0">
              <button
                type="button"
                onClick={handleNewProject}
                className="w-full px-3 py-2 text-sm rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
              >
                New project
              </button>
              <button
                type="button"
                onClick={handleSaveCurrent}
                disabled={saving}
                className="w-full px-3 py-2 text-sm rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium transition-colors"
              >
                {saving ? "Saving…" : "Save current as project"}
              </button>
            </div>
            <div className="overflow-y-auto p-2" style={{ maxHeight: "280px" }}>
              <p className="text-xs text-slate-500 mb-2">Click a project to open it.</p>
              {projects.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No saved projects yet.</p>
              ) : (
                <ul className="space-y-1">
                  {projects.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-md hover:bg-slate-800/50 group"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoad(p.id)}
                        className="flex-1 min-w-0 text-left px-3 py-2 text-sm text-slate-200 truncate"
                      >
                        <span className="font-medium truncate block">{p.name}</span>
                        <span className="text-xs text-slate-500">{formatDate(p.updatedAt)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, p.id)}
                        disabled={deletingId === p.id}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-2.5 py-1.5 text-sm rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        title="Saved projects"
      >
        Projects
      </button>
      {dropdownPanel}
    </div>
  );
}
