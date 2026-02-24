"use client";

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-700/70 bg-surface-900 px-4 py-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-100">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Power user helpers for the editor and GPT assistant.
        </p>
        <dl className="space-y-2 text-xs text-slate-200">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Save as…</dt>
            <dd className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/70">
              Ctrl/Cmd + S
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Toggle shortcuts help</dt>
            <dd className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/70">
              ?
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">Send GPT message</dt>
            <dd className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/70">
              Enter
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-slate-400">New line in GPT input</dt>
            <dd className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/70">
              Shift + Enter
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

