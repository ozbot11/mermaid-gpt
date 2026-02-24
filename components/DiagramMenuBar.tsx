"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { getProjects, getProject } from "@/lib/db";
import type { ExampleTemplate } from "@/types";
import type { Project } from "@/types";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

export interface DiagramMenuBarProps {
  documentTitle: string;
  isDirty: boolean;
  mermaidCode: string;
  hasSvgForExport: boolean;
  onNew: () => void;
  onLoadProject: (code: string, project?: Project) => void;
  onSaveCurrent: () => void;
  onExportSvg: () => void;
  onExportPng: () => void;
  onCopyLink: () => void;
  onCopyCode: () => void;
  onReset: () => void;
  onApplyTemplate: (key: ExampleTemplate) => void;
  templateOptions: { value: ExampleTemplate; label: string }[];
  copyCodeFeedback: boolean;
  copyLinkFeedback: boolean;
  exportFeedback: "svg" | "png" | null;
  saveInProgress: boolean;
  authButton: React.ReactNode;
}

type MenuId = "file" | "edit" | "templates" | null;

export default function DiagramMenuBar({
  documentTitle,
  isDirty,
  mermaidCode,
  hasSvgForExport,
  onNew,
  onLoadProject,
  onSaveCurrent,
  onExportSvg,
  onExportPng,
  onCopyLink,
  onCopyCode,
  onReset,
  onApplyTemplate,
  templateOptions,
  copyCodeFeedback,
  copyLinkFeedback,
  exportFeedback,
  saveInProgress,
  authButton,
}: DiagramMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [burgerOpen, setBurgerOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [openSubmenu, setOpenSubmenu] = useState<"open" | null>(null);
  const fileRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const refreshProjects = useCallback(() => {
    getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    if (openMenu === "file") refreshProjects();
  }, [openMenu, refreshProjects]);

  useEffect(() => {
    if (!burgerOpen) return;
    refreshProjects();
  }, [burgerOpen, refreshProjects]);

  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuBarRef.current?.contains(target)) return;
      setOpenMenu(null);
      setOpenSubmenu(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  const handleLoad = useCallback(
    (id: number) => {
      getProject(id).then((p) => {
        if (p) {
          onLoadProject(p.mermaidCode, p);
          setOpenMenu(null);
          setOpenSubmenu(null);
          setBurgerOpen(false);
        }
      });
    },
    [onLoadProject]
  );

  const handleSave = useCallback(() => {
    onSaveCurrent();
    setOpenMenu(null);
    setBurgerOpen(false);
  }, [onSaveCurrent]);

  const menuButton = (id: MenuId, label: string) => (
    <button
      type="button"
      onClick={() => setOpenMenu((m) => (m === id ? null : id))}
      className="px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700/60 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/50"
      aria-expanded={openMenu === id}
      aria-haspopup="true"
    >
      {label}
    </button>
  );

  const dropdown = (anchorRef: React.RefObject<HTMLDivElement | null>, id: MenuId, children: React.ReactNode) => {
    if (openMenu !== id || !anchorRef.current) return null;
    const rect = anchorRef.current.getBoundingClientRect();
    return createPortal(
      <div
        className="min-w-[200px] py-1 rounded-lg border border-slate-700/50 bg-surface-900 shadow-xl z-[100] text-sm"
        style={{ position: "fixed", top: rect.bottom + 4, left: rect.left }}
      >
        {children}
      </div>,
      document.body
    );
  };

  const fileMenuContent = () => (
    <>
      <button type="button" onClick={() => { onNew(); setOpenMenu(null); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800">
        New
      </button>
      <div className="relative">
        <button
          type="button"
          onMouseEnter={() => setOpenSubmenu("open")}
          onClick={() => setOpenSubmenu((s) => (s === "open" ? null : "open"))}
          className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 flex items-center justify-between"
        >
          Open
          <span className="text-slate-500">▸</span>
        </button>
        {openSubmenu === "open" && (
          <div
            className="absolute left-full top-0 ml-0.5 min-w-[220px] max-h-[70vh] overflow-y-auto py-1 rounded-lg border border-slate-700/50 bg-surface-900 shadow-xl"
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            {projects.length === 0 ? (
              <p className="px-3 py-2 text-slate-500 text-xs">No saved diagrams</p>
            ) : (
              projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLoad(p.id)}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 block"
                >
                  <span className="font-medium truncate block">{p.name}</span>
                  <span className="text-xs text-slate-500">{formatDate(p.updatedAt)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={handleSave} disabled={saveInProgress} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 disabled:opacity-50">
        {saveInProgress ? "Saving…" : "Save as…"}
      </button>
      <div className="my-1 border-t border-slate-700/50" />
      <button type="button" onClick={() => { onExportSvg(); setOpenMenu(null); }} disabled={!hasSvgForExport} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 disabled:opacity-50">
        Export as SVG
      </button>
      <button type="button" onClick={() => { onExportPng(); setOpenMenu(null); }} disabled={!hasSvgForExport} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 disabled:opacity-50">
        Export as PNG
      </button>
      <button type="button" onClick={() => { onCopyLink(); setOpenMenu(null); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800">
        {copyLinkFeedback ? "Link copied!" : "Copy link"}
      </button>
      <div className="my-1 border-t border-slate-700/50" />
      <Link href="/" className="block px-3 py-2 text-slate-200 hover:bg-slate-800" onClick={() => setOpenMenu(null)}>
        Back to home
      </Link>
    </>
  );

  const editMenuContent = () => (
    <>
      <button type="button" onClick={() => { onCopyCode(); setOpenMenu(null); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800">
        {copyCodeFeedback ? "Copied!" : "Copy code"}
      </button>
      <button type="button" onClick={() => { onReset(); setOpenMenu(null); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800">
        Reset diagram
      </button>
    </>
  );

  const templatesMenuContent = () => (
    <>
      {templateOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => { onApplyTemplate(opt.value); setOpenMenu(null); }}
          className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800"
        >
          {opt.label}
        </button>
      ))}
    </>
  );

  return (
    <div ref={menuBarRef} className="flex items-center gap-1 flex-wrap">
      {/* Desktop: File / Edit / Templates */}
      <div className="hidden md:flex items-center gap-0.5">
        <div ref={fileRef}>{menuButton("file", "File")}</div>
        {dropdown(fileRef, "file", fileMenuContent())}
        <div ref={editRef}>{menuButton("edit", "Edit")}</div>
        {dropdown(editRef, "edit", editMenuContent())}
        <div ref={templatesRef}>{menuButton("templates", "Templates")}</div>
        {dropdown(templatesRef, "templates", templatesMenuContent())}
      </div>

      {/* Mobile: Burger */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          onClick={() => setBurgerOpen((o) => !o)}
          className="p-2 text-slate-400 hover:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          aria-label="Menu"
          aria-expanded={burgerOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {burgerOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" aria-hidden onClick={() => setBurgerOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] z-50 bg-surface-900 border-r border-slate-700/50 shadow-xl overflow-y-auto">
              <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
                <span className="font-semibold text-slate-100">Menu</span>
                <button type="button" onClick={() => setBurgerOpen(false)} className="p-2 text-slate-400 hover:text-slate-200">×</button>
              </div>
              <div className="p-2 space-y-1">
                <p className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">File</p>
                <button type="button" onClick={() => { onNew(); setBurgerOpen(false); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded">New</button>
                <div className="py-1">
                  <p className="px-2 text-xs text-slate-500 mb-1">Open</p>
                  {projects.length === 0 ? (
                    <p className="px-3 py-2 text-slate-500 text-sm">No saved diagrams</p>
                  ) : (
                    projects.slice(0, 10).map((p) => (
                      <button key={p.id} type="button" onClick={() => handleLoad(p.id)} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded block">
                        <span className="font-medium truncate block">{p.name}</span>
                        <span className="text-xs text-slate-500">{formatDate(p.updatedAt)}</span>
                      </button>
                    ))
                  )}
                </div>
                <button type="button" onClick={handleSave} disabled={saveInProgress} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded disabled:opacity-50">{saveInProgress ? "Saving…" : "Save as…"}</button>
                <div className="border-t border-slate-700/50 my-2" />
                <button type="button" onClick={() => { onExportSvg(); setBurgerOpen(false); }} disabled={!hasSvgForExport} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded disabled:opacity-50">Export as SVG</button>
                <button type="button" onClick={() => { onExportPng(); setBurgerOpen(false); }} disabled={!hasSvgForExport} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded disabled:opacity-50">Export as PNG</button>
                <button type="button" onClick={() => { onCopyLink(); setBurgerOpen(false); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded">{copyLinkFeedback ? "Link copied!" : "Copy link"}</button>
                <div className="border-t border-slate-700/50 my-2" />
                <Link href="/" onClick={() => setBurgerOpen(false)} className="block px-3 py-2 text-slate-200 hover:bg-slate-800 rounded">Back to home</Link>

                <p className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mt-4">Edit</p>
                <button type="button" onClick={() => { onCopyCode(); setBurgerOpen(false); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded">{copyCodeFeedback ? "Copied!" : "Copy code"}</button>
                <button type="button" onClick={() => { onReset(); setBurgerOpen(false); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded">Reset diagram</button>

                <p className="px-2 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mt-4">Templates</p>
                {templateOptions.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => { onApplyTemplate(opt.value); setBurgerOpen(false); }} className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded">
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-5 w-px bg-slate-600 mx-1" aria-hidden />
      <span className="text-slate-500 text-sm truncate max-w-[140px] sm:max-w-[220px]" title={documentTitle}>
        {documentTitle}
        {isDirty && <span className="text-amber-400 ml-1">•</span>}
      </span>
      <div className="flex-1 min-w-0" />
      {authButton}
    </div>
  );
}
