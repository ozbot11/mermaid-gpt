"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { GPTMessage, GPTMode } from "@/types";

function stripMermaidFences(raw: string): string {
  let s = raw.trim();
  if (/^```(?:mermaid)?\s*\n*/i.test(s)) s = s.replace(/^```(?:mermaid)?\s*\n*/i, "");
  if (/\n*\s*```\s*$/.test(s)) s = s.replace(/\n*\s*```\s*$/, "");
  return s.trim();
}

interface GPTPanelProps {
  currentMermaid: string;
  /** Called at send time to get the latest editor content (avoids stale closures). */
  getCurrentMermaid?: () => string;
  onApplyMermaid: (mermaid: string) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const MODES: { value: GPTMode; label: string }[] = [
  { value: "fix", label: "Fix Syntax" },
  { value: "improve", label: "Improve Structure" },
  { value: "generate", label: "Generate From Description" },
];

export default function GPTPanel({
  currentMermaid,
  getCurrentMermaid,
  onApplyMermaid,
  collapsed,
  onToggleCollapsed,
}: GPTPanelProps) {
  const [messages, setMessages] = useState<GPTMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<GPTMode>("improve");
  const [pendingMermaid, setPendingMermaid] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const lastFailedInputRef = useRef<string>("");

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    if (!overrideInput) setInput("");
    lastFailedInputRef.current = text;
    const userMsg: GPTMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const mermaidToSend = getCurrentMermaid?.() ?? currentMermaid;
      const res = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mermaid: mermaidToSend,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      const explanation = data.explanation ?? "";
      const mermaidCode = stripMermaidFences(data.mermaid ?? "");

      setPendingMermaid(mermaidCode || null);
      const assistantMsg: GPTMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: explanation,
        mermaid: mermaidCode,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      lastFailedInputRef.current = text;
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const content = isOffline
        ? "You appear to be offline. Check your connection and try again."
        : err instanceof Error
          ? err.message
          : "Something went wrong. Try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `Error: ${content}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentMermaid, mode, getCurrentMermaid]);

  const handleApply = useCallback(() => {
    if (pendingMermaid) {
      onApplyMermaid(pendingMermaid);
      setPendingMermaid(null);
      setAppliedFeedback(true);
      setTimeout(() => setAppliedFeedback(false), 1500);
    }
  }, [pendingMermaid, onApplyMermaid]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  const quickActions = useCallback(
    (label: string, prompt: string) => {
      setInput(prompt);
      setMode(label === "Fix Diagram" ? "fix" : label === "Improve Diagram" ? "improve" : "generate");
    },
    []
  );

  if (collapsed) {
    return (
      <div className="flex flex-col border-l border-slate-700/50 bg-surface-900">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center justify-center py-3 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50 rounded"
          aria-label="Expand GPT panel"
          title="Expand panel"
        >
          <span className="text-xs font-medium">GPT</span>
          <svg className="w-4 h-4 ml-1 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-w-0 h-full border-l border-slate-700/50 bg-surface-900">
      <div className="flex items-center justify-between shrink-0 py-2 px-3 border-b border-slate-700/50">
        <span className="text-sm font-medium text-slate-200">GPT Assistant</span>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          aria-label="Minimize panel"
          title="Minimize panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="shrink-0 p-2 space-y-2 border-b border-slate-700/50">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as GPTMode)}
          className="w-full px-2.5 py-1.5 text-sm rounded-md bg-surface-800 border border-slate-600 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-shadow"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => quickActions("Fix Diagram", "Fix any syntax errors in my Mermaid diagram.")}
            className="px-2 py-1 text-xs rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          >
            Fix
          </button>
          <button
            type="button"
            onClick={() => quickActions("Improve Diagram", "Improve the structure and readability of my Mermaid diagram.")}
            className="px-2 py-1 text-xs rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          >
            Improve
          </button>
          <button
            type="button"
            onClick={() => quickActions("Generate From Text", "Generate a Mermaid diagram from this description: ")}
            className="px-2 py-1 text-xs rounded-md bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
          >
            Generate
          </button>
        </div>
        {pendingMermaid && (
          <button
            type="button"
            onClick={handleApply}
            className="w-full py-2 text-sm font-medium rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50"
          >
            {appliedFeedback ? "Applied!" : "Apply AI Changes"}
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2 space-y-3 min-h-0 scroll-smooth"
      >
        {messages.length === 0 && (
          <p className="text-xs text-slate-500">
            Fix syntax, improve structure, or generate a diagram from a description.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg p-2.5 text-sm transition-opacity ${
              msg.role === "user"
                ? "bg-slate-700/50 text-slate-200 ml-4"
                : "bg-slate-800/50 text-slate-300 mr-4"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            {msg.mermaid && (
              <pre className="mt-2 p-2 rounded bg-surface-950 text-xs overflow-x-auto border border-slate-700/50">
                {msg.mermaid}
              </pre>
            )}
          </div>
        ))}
        {loading && (
          <div className="rounded-lg p-2.5 bg-slate-800/50 text-slate-400 text-sm flex items-center gap-2">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]" />
            </span>
            <span>Thinking…</span>
          </div>
        )}
        {messages.length > 0 && messages[messages.length - 1].role === "assistant" && messages[messages.length - 1].content.startsWith("Error:") && (
          <button
            type="button"
            onClick={() => send(lastFailedInputRef.current)}
            className="px-3 py-1.5 text-xs rounded-md bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      <div className="shrink-0 p-2 border-t border-slate-700/50">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your diagram… (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 min-w-0 px-3 py-2 rounded-md bg-surface-800 border border-slate-600 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 resize-none transition-shadow"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={loading}
            className="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/50 shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
