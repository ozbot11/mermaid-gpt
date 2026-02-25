"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";

const DEBOUNCE_MS = 300;
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const ZOOM_SENSITIVITY = 0.002;

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
  const viewportRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hovering, setHovering] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const render = useCallback(async (input: string) => {
    ensureMermaidInit();
    const trimmed = input.trim();
    if (!trimmed) {
      setSvg("");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { svg: out } = await mermaid.render(
        `mermaid-${Date.now()}`,
        trimmed
      );
      setSvg(out);
      onSvgReady?.(out);
    } catch {
      setSvg("");
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

  // Reset pan when diagram changes
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [svg]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!svg) return;
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (1 + delta)));
      if (newScale === scale) return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const wx = e.clientX - rect.left;
        const wy = e.clientY - rect.top;
        const scaleFactor = newScale / scale;
        setPan((p) => ({
          x: wx - (wx - p.x) * scaleFactor,
          y: wy - (wy - p.y) * scaleFactor,
        }));
      }
      setScale(newScale);
    },
    [scale, svg]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!svg) return;
      if (e.button !== 0) return;
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan, svg]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      setPan({
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (!isPanning) return;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  const resetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const content = useMemo(() => {
    if (loading && !svg) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-500">
          <div className="w-6 h-6 border-2 border-slate-600 border-t-sky-500 rounded-full animate-spin mb-2" />
          <span className="text-xs">Rendering…</span>
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
        className="flex items-center justify-center min-h-[200px] p-4 [&>svg]:max-w-full [&>svg]:h-auto origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }, [loading, svg, scale, pan]);

  return (
    <div className="h-full min-h-[300px] rounded-lg border border-slate-700/50 bg-surface-900 overflow-hidden flex flex-col relative">
      {svg && (
        <div className="shrink-0 flex items-center justify-end gap-1 py-1.5 px-2 border-b border-slate-700/50 bg-surface-900/80">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.1))}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors text-sm font-medium"
            title="Zoom out"
          >
            −
          </button>
          <span className="text-xs text-slate-500 min-w-[2.5rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.1))}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors text-sm font-medium"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetView}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors text-xs"
            title="Reset zoom and pan"
          >
            Reset
          </button>
        </div>
      )}
      <div
        ref={viewportRef}
        className={`flex-1 overflow-hidden min-h-0 ${svg ? (isPanning ? "cursor-grabbing" : "cursor-grab") : ""}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{ touchAction: "none" }}
      >
        {content}
      </div>
      {svg && hovering && (
        <div className="pointer-events-none absolute bottom-2 left-2 max-w-xs rounded-md bg-slate-900/90 border border-slate-700/70 px-2 py-1 text-[11px] text-slate-300 shadow-lg">
          Hover diagram nodes to see Mermaid tooltips. Scroll to zoom and drag to pan the view.
        </div>
      )}
    </div>
  );
}
