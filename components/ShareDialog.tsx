"use client";

import { useCallback, useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
}

export default function ShareDialog({ open, onClose, shareUrl }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [shareUrl]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700/70 bg-surface-900 p-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 id="share-dialog-title" className="text-sm font-semibold text-slate-100">
            Share diagram
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Anyone with this link can view and copy this diagram. They can open it in MermaidGPT and save it to their own projects.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 min-w-0 rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2 text-xs text-slate-200 font-mono truncate"
            aria-label="Share link"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </>
  );
}
