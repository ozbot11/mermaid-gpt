"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import EditorPanel from "@/components/Editor";
import RendererPanel from "@/components/Renderer";
import GPTPanel from "@/components/GPTPanel";
import AuthButton from "@/components/AuthButton";
import ProjectsDropdown from "@/components/ProjectsDropdown";
import { TEMPLATES, TEMPLATE_LABELS } from "@/lib/templates";
import type { ExampleTemplate } from "@/types";

const STORAGE_KEY = "mermaid-gpt-draft";
const MIN_PANEL_PCT = 15;
const MAX_PANEL_PCT = 70;
const RESIZER_WIDTH = 6;

const DEFAULT_CODE = `flowchart LR
  A[Start] --> B{OK?}
  B -->|Yes| C[End]
  B -->|No| D[Retry]`;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function loadDraft(): string {
  if (typeof window === "undefined") return DEFAULT_CODE;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s && s.trim()) return s;
  } catch {
    // ignore
  }
  return DEFAULT_CODE;
}

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [mermaidCode, setMermaidCode] = useState(DEFAULT_CODE);
  const [hydrated, setHydrated] = useState(false);
  const [svgForExport, setSvgForExport] = useState<string>("");
  const [gptCollapsed, setGptCollapsed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<"svg" | "png" | null>(null);
  const [panelSizes, setPanelSizes] = useState({ editor: 40, renderer: 40, gpt: 20 });
  const [resizing, setResizing] = useState<"left" | "right" | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Ref always holds latest editor content so GPT request uses current version at send time
  const mermaidCodeRef = useRef(mermaidCode);

  const allowed = Boolean(session?.user?.allowed);

  useEffect(() => {
    setMermaidCode(loadDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    mermaidCodeRef.current = mermaidCode;
  }, [mermaidCode]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, mermaidCode);
    } catch {
      // ignore
    }
  }, [hydrated, mermaidCode]);

  const handleSvgReady = useCallback((svg: string) => {
    setSvgForExport(svg);
  }, []);

  const exportSvg = useCallback(() => {
    if (!svgForExport) return;
    const blob = new Blob([svgForExport], { type: "image/svg+xml" });
    downloadBlob(blob, "diagram.svg");
    setExportFeedback("svg");
    setTimeout(() => setExportFeedback(null), 1500);
  }, [svgForExport]);

  const PNG_SCALE = 2; // 2x resolution for sharper export

  const exportPng = useCallback(() => {
    if (!svgForExport) return;
    const img = new Image();
    const blob = new Blob([svgForExport], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const baseW = img.naturalWidth || img.width || 800;
      const baseH = img.naturalHeight || img.height || 600;
      const w = Math.round(baseW * PNG_SCALE);
      const h = Math.round(baseH * PNG_SCALE);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
      ctx.scale(PNG_SCALE, PNG_SCALE);
      ctx.drawImage(img, 0, 0, baseW, baseH);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.toBlob(
        (b) => {
          if (b) downloadBlob(b, "diagram.png");
          URL.revokeObjectURL(url);
          setExportFeedback("png");
          setTimeout(() => setExportFeedback(null), 1500);
        },
        "image/png",
        1
      );
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  }, [svgForExport]);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      // ignore
    }
  }, [mermaidCode]);

  const resetDiagram = useCallback(() => {
    setMermaidCode(DEFAULT_CODE);
  }, []);

  const applyTemplate = useCallback((key: ExampleTemplate) => {
    setMermaidCode(TEMPLATES[key]);
  }, []);

  const templateOptions = useMemo(
    () =>
      (Object.keys(TEMPLATES) as ExampleTemplate[]).map((key) => ({
        value: key,
        label: TEMPLATE_LABELS[key],
      })),
    []
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const w = rect.width;
      if (w <= 0) return;
      const x = e.clientX - rect.left;
      if (resizing === "left") {
        const editorPct = Math.min(MAX_PANEL_PCT, Math.max(MIN_PANEL_PCT, (x / w) * 100));
        const rest = 100 - editorPct - panelSizes.gpt;
        const rendererPct = Math.min(MAX_PANEL_PCT, Math.max(MIN_PANEL_PCT, rest));
        const gptPct = 100 - editorPct - rendererPct;
        setPanelSizes({
          editor: editorPct,
          renderer: rendererPct,
          gpt: Math.max(MIN_PANEL_PCT, Math.min(MAX_PANEL_PCT, gptPct)),
        });
      } else {
        const gptPct = Math.min(MAX_PANEL_PCT, Math.max(MIN_PANEL_PCT, ((rect.right - e.clientX) / w) * 100));
        const rest = 100 - panelSizes.editor - gptPct;
        const rendererPct = Math.min(MAX_PANEL_PCT, Math.max(MIN_PANEL_PCT, rest));
        const editorPct = 100 - rendererPct - gptPct;
        setPanelSizes({
          editor: Math.max(MIN_PANEL_PCT, Math.min(MAX_PANEL_PCT, editorPct)),
          renderer: rendererPct,
          gpt: gptPct,
        });
      }
    },
    [resizing, panelSizes.gpt, panelSizes.editor]
  );

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (!resizing) return;
    document.body.classList.add("select-none");
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", handleResizeEnd);
    return () => {
      document.body.classList.remove("select-none");
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [resizing, handleResizeMove, handleResizeEnd]);

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
    <div className="flex flex-col h-screen bg-surface-950">
      <header className="shrink-0 flex flex-wrap items-center gap-2 py-2.5 px-4 border-b border-slate-700/60 bg-surface-900/95 backdrop-blur-sm transition-colors">
        <h1 className="text-lg font-semibold text-slate-100 mr-2 tracking-tight">
          MermaidGPT
        </h1>
        <div className="h-5 w-px bg-slate-600" aria-hidden />
        <select
          aria-label="Load example template"
          className="px-2.5 py-1.5 text-sm rounded-md bg-surface-800 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-shadow"
          value=""
          onChange={(e) => {
            const v = e.target.value as ExampleTemplate;
            if (v) applyTemplate(v);
            e.target.value = "";
          }}
        >
          <option value="">Templates</option>
          {templateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ProjectsDropdown
          mermaidCode={mermaidCode}
          onLoadProject={setMermaidCode}
          onNewProject={() => setMermaidCode(DEFAULT_CODE)}
        />
        <button
          type="button"
          onClick={copyCode}
          className="px-2.5 py-1.5 text-sm rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          title="Copy Mermaid code"
        >
          {copyFeedback ? "Copied!" : "Copy code"}
        </button>
        <button
          type="button"
          onClick={resetDiagram}
          className="px-2.5 py-1.5 text-sm rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          title="Reset to default diagram"
        >
          Reset
        </button>
        <div className="h-5 w-px bg-slate-600" aria-hidden />
        <button
          type="button"
          onClick={exportSvg}
          disabled={!svgForExport}
          className="px-2.5 py-1.5 text-sm rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          title="Export as SVG"
        >
          {exportFeedback === "svg" ? "Saved!" : "SVG"}
        </button>
        <button
          type="button"
          onClick={exportPng}
          disabled={!svgForExport}
          className="px-2.5 py-1.5 text-sm rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          title="Download as PNG"
        >
          {exportFeedback === "png" ? "Saved!" : "PNG"}
        </button>
        <div className="ml-auto">
          <AuthButton />
        </div>
      </header>

      <main
        ref={mainRef}
        className="flex-1 min-h-0 flex flex-col lg:flex-row p-3 gap-3 lg:gap-0"
        style={
          {
            "--editor-pct": `${panelSizes.editor}%`,
            "--renderer-pct": `${panelSizes.renderer}%`,
            "--gpt-pct": `${panelSizes.gpt}%`,
            "--resizer-w": `${RESIZER_WIDTH}px`,
          } as React.CSSProperties
        }
      >
        <section
          className="min-h-0 flex flex-col flex-1 min-w-0 w-full lg:w-[var(--editor-pct)] lg:max-w-[var(--editor-pct)]"
          aria-label="Editor"
        >
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Editor</span>
          </div>
          <div className="flex-1 min-h-[280px] rounded-lg overflow-hidden border border-slate-700/50 bg-[#1e1e1e] shadow-inner transition-shadow">
            <EditorPanel value={mermaidCode} onChange={setMermaidCode} />
          </div>
        </section>
        <div
          className="hidden lg:block shrink-0 w-[var(--resizer-w)] min-w-[var(--resizer-w)] cursor-col-resize border-l border-r border-slate-700/50 bg-slate-800/30 hover:bg-sky-500/20 transition-colors"
          onMouseDown={(e) => e.button === 0 && setResizing("left")}
          aria-label="Resize editor and preview"
          role="separator"
        />
        <section
          className="min-h-0 flex flex-col flex-1 min-w-0 w-full lg:w-[var(--renderer-pct)] lg:max-w-[var(--renderer-pct)]"
          aria-label="Preview"
        >
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Preview</span>
          </div>
          <div className="flex-1 min-h-[280px]">
            <RendererPanel code={mermaidCode} onSvgReady={handleSvgReady} />
          </div>
        </section>
        <div
          className="hidden lg:block shrink-0 w-[var(--resizer-w)] min-w-[var(--resizer-w)] cursor-col-resize border-l border-r border-slate-700/50 bg-slate-800/30 hover:bg-sky-500/20 transition-colors"
          onMouseDown={(e) => e.button === 0 && setResizing("right")}
          aria-label="Resize preview and GPT"
          role="separator"
        />
        <aside
          className="min-w-0 min-h-[200px] flex flex-col flex-1 min-w-0 w-full lg:w-[var(--gpt-pct)] lg:max-w-[var(--gpt-pct)]"
          aria-label="GPT Assistant"
        >
          <GPTPanel
            currentMermaid={mermaidCode}
            getCurrentMermaid={() => mermaidCodeRef.current}
            onApplyMermaid={setMermaidCode}
            collapsed={gptCollapsed}
            onToggleCollapsed={() => setGptCollapsed((c) => !c)}
          />
        </aside>
      </main>
    </div>
  );
}
