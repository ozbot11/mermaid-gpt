"use client";

interface TutorialOverlayProps {
  open: boolean;
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onDone: () => void;
}

const STEPS: { title: string; body: string }[] = [
  {
    title: "Welcome to MermaidGPT",
    body:
      "On the left you write Mermaid. In the middle you see a live diagram. On the right, the GPT assistant helps you fix, improve, or generate diagrams.",
  },
  {
    title: "File, Edit, and Templates",
    body:
      "Use the File menu to create, open, save, and export diagrams, or copy a share link. Edit lets you copy/reset, and Templates gives you common starting points.",
  },
  {
    title: "GPT assistant",
    body:
      "Paste broken Mermaid or describe the diagram you want. Choose a mode (Fix, Improve, Generate), then click Apply AI Changes to update the editor.",
  },
];

export default function TutorialOverlay({
  open,
  step,
  onNext,
  onPrev,
  onSkip,
  onDone,
}: TutorialOverlayProps) {
  if (!open) return null;

  const clampedStep = Math.max(0, Math.min(step, STEPS.length - 1));
  const isLast = clampedStep >= STEPS.length - 1;
  const current = STEPS[clampedStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onSkip} />
      <div className="relative z-10 max-w-lg w-full mx-4 rounded-xl border border-slate-700/70 bg-surface-900 px-4 py-3 shadow-2xl">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{current.title}</h2>
            <p className="mt-1 text-xs text-slate-400">{current.body}</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="p-1 text-slate-400 hover:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/50"
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

