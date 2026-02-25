"use client";

import { useLayoutEffect, useState } from "react";

interface TutorialOverlayProps {
  open: boolean;
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onDone: () => void;
}

type TooltipPlacement = "top" | "bottom" | "left" | "right" | "center";

const STEPS: {
  title: string;
  body: string;
  target: string | null;
  tooltipPlacement: TooltipPlacement;
}[] = [
  {
    title: "Welcome to MermaidGPT",
    body:
      "This quick tour walks you from corner to corner. You'll see where to write code, preview the diagram, and use the AI assistant.",
    target: null,
    tooltipPlacement: "center",
  },
  {
    title: "File, Edit, and Templates",
    body:
      "Use the menu here: File to create, save, and export; Edit to copy or reset; Templates to start from flowchart, sequence, and more.",
    target: "menu",
    tooltipPlacement: "bottom",
  },
  {
    title: "Editor — left",
    body:
      "Write Mermaid diagram code here. You get syntax highlighting, snippets (try typing 'flow' + Tab), and AI inline suggestions as you type.",
    target: "editor",
    tooltipPlacement: "right",
  },
  {
    title: "Preview — center",
    body:
      "Your diagram renders here in real time. Zoom with the controls or scroll; drag to pan. Invalid syntax won't show an error—just fix the code and it updates.",
    target: "preview",
    tooltipPlacement: "left",
  },
  {
    title: "GPT Assistant — right",
    body:
      "Ask to fix syntax, improve structure, or generate from a description. Pick a mode, send a message, then click Apply AI Changes to update the editor.",
    target: "gpt",
    tooltipPlacement: "left",
  },
];

const PADDING = 8;
const HIGHLIGHT_BORDER = 3;

export default function TutorialOverlay({
  open,
  step,
  onNext,
  onPrev,
  onSkip,
  onDone,
}: TutorialOverlayProps) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const clampedStep = Math.max(0, Math.min(step, STEPS.length - 1));
  const isLast = clampedStep >= STEPS.length - 1;
  const current = STEPS[clampedStep];

  useLayoutEffect(() => {
    if (!open || !current.target) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-tutorial-target="${current.target}"]`);
    if (!el) {
      setHighlightRect(null);
      return;
    }
    const update = () => setHighlightRect(el.getBoundingClientRect());
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, [open, clampedStep, current.target]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" aria-hidden>
      {/* Dim overlay — clickable to skip; pointer-events on this layer only */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-auto transition-opacity duration-200"
        onClick={onSkip}
        aria-hidden
      />
      {/* Highlight ring around target */}
      {highlightRect && (
        <div
          className="absolute pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: highlightRect.left - PADDING - HIGHLIGHT_BORDER,
            top: highlightRect.top - PADDING - HIGHLIGHT_BORDER,
            width: highlightRect.width + (PADDING + HIGHLIGHT_BORDER) * 2,
            height: highlightRect.height + (PADDING + HIGHLIGHT_BORDER) * 2,
            borderRadius: 12,
            boxShadow: "0 0 0 3px rgba(56, 189, 248, 0.9), 0 0 24px rgba(56, 189, 248, 0.35)",
            backgroundColor: "transparent",
          }}
        />
      )}
      {/* Tooltip card — positioned by placement; pointer-events so buttons work */}
      <div
        className="absolute z-10 pointer-events-auto w-[min(360px,calc(100vw-32px))] rounded-xl border border-slate-700/70 bg-surface-900 px-4 py-3 shadow-2xl transition-all duration-300"
        style={(() => {
          const gap = 16;
          if (current.tooltipPlacement === "center") {
            return {
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            };
          }
          if (!highlightRect) {
            return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
          }
          const pad = PADDING + HIGHLIGHT_BORDER + gap;
          const cardH = 160;
          const cardW = 360;
          switch (current.tooltipPlacement) {
            case "bottom":
              return {
                left: Math.max(16, Math.min(highlightRect.left, highlightRect.right - cardW)),
                top: highlightRect.bottom + pad,
              };
            case "top":
              return {
                left: Math.max(16, Math.min(highlightRect.left, highlightRect.right - cardW)),
                top: Math.max(16, highlightRect.top - cardH - pad),
              };
            case "right":
              return {
                left: highlightRect.right + pad,
                top: highlightRect.top + highlightRect.height / 2 - cardH / 2,
              };
            case "left":
              return {
                left: Math.max(16, highlightRect.left - cardW - pad),
                top: highlightRect.top + highlightRect.height / 2 - cardH / 2,
              };
            default:
              return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
          }
        })()}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{current.title}</h2>
            <p className="mt-1 text-xs text-slate-400">{current.body}</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="p-1 text-slate-400 hover:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/50 pointer-events-auto"
            aria-label="Skip tutorial"
          >
            ×
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
          <span>
            Step {clampedStep + 1} of {STEPS.length}
          </span>
          <div className="flex gap-2">
            {clampedStep > 0 && (
              <button
                type="button"
                onClick={onPrev}
                className="px-2 py-1 rounded-md border border-slate-700/70 bg-slate-800/80 text-slate-200 text-[11px] hover:bg-slate-700"
              >
                Back
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={onNext}
                className="px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px]"
              >
                Next
              </button>
            )}
            {isLast && (
              <button
                type="button"
                onClick={onDone}
                className="px-2 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-[11px]"
              >
                Done
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="mt-2 text-[11px] text-slate-500 hover:text-slate-300 underline underline-offset-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
