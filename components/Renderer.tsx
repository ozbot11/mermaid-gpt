"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";

const DEBOUNCE_MS = 300;

let mermaidInitialized = false;
function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
  });
  mermaidInitialized = true;
}

interface RendererPanelProps {
  code: string;
  onSvgReady?: (svg: string) => void;
}

export default function RendererPanel({ code, onSvgReady }: RendererPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const render = useCallback(async (input: string) => {
    ensureMermaidInit();
    const trimmed = input.trim();
    if (!trimmed) {
      setSvg("");
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { svg: out } = await mermaid.render(
        `mermaid-${Date.now()}`,
        trimmed
      );
      setSvg(out);
      onSvgReady?.(out);
    } catch (err) {
      setSvg("");
      setError(err instanceof Error ? err.message : "Failed to render diagram");
    } finally {
      setLoading(false);
    }
  }, [onSvgReady]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const hasCode = code.trim().length > 0;
    if (hasCode) setLoading(true);
    timerRef.current = setTimeout(() => render(code), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [code, render]);

  const content = useMemo(() => {
    if (loading && !svg && !error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin mb-2" />
          <span className="text-xs">Rendering…</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-4 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-sm font-mono whitespace-pre-wrap">
          {error}
        </div>
      );
    }
    if (!svg) {
      return (
        <div className="flex items-center justify-center h-full min-h-[200px] text-slate-500 text-sm">
          <span>Enter Mermaid code to preview</span>
        </div>
      );
    }
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center min-h-[200px] p-4 overflow-auto transition-opacity duration-200 [&>svg]:max-w-full [&>svg]:h-auto"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "center center",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }, [error, loading, svg, zoom]);

  return (
    <div className="h-full min-h-[300px] rounded-lg border border-slate-700/50 bg-surface-900 overflow-hidden flex flex-col">
      {svg && !error && (
        <div className="shrink-0 flex items-center justify-end gap-1 py-1.5 px-2 border-b border-slate-700/50 bg-surface-900/80">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors text-sm font-medium"
            title="Zoom out"
          >
            −
          </button>
          <span className="text-xs text-slate-500 min-w-[2.5rem] text-center">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors text-sm font-medium"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors text-xs"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto min-h-0">{content}</div>
    </div>
  );
}
