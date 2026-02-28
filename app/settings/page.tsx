"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import AuthButton from "@/components/AuthButton";
import { useTheme } from "@/lib/ThemeContext";

interface UsageStats {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  bySource: { gpt: number; complete: number };
  requestCount: { gpt: number; complete: number };
  lastUpdated: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      } else {
        setUsage(null);
      }
    } catch {
      setUsage(null);
    } finally {
      setUsageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchUsage();
    else setUsageLoading(false);
  }, [session?.user, fetchUsage]);

  if (status === "loading") {
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
        <p className="text-slate-400 text-center">Sign in to manage settings.</p>
        <AuthButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-950">
      <header className="shrink-0 flex items-center justify-between py-3 px-4 md:px-6 border-b border-slate-700/60 bg-surface-900/95 backdrop-blur-sm">
        <Link href="/" className="text-slate-100 hover:text-white font-semibold text-lg tracking-tight transition-colors">
          MermaidGPT
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/diagram"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Diagram
          </Link>
          <AuthButton />
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full py-8 px-4 md:px-6">
        <h1 className="text-2xl font-semibold text-slate-100 mb-6">Settings</h1>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Appearance
          </h2>
          <div className="rounded-xl border border-slate-700/60 bg-surface-900/80 p-4">
            <p className="text-sm text-slate-300 mb-3">Theme</p>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    theme === t
                      ? "bg-sky-600 text-white"
                      : "bg-slate-700/80 text-slate-300 hover:bg-slate-600/80"
                  }`}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            AI usage
          </h2>
          <div className="rounded-xl border border-slate-700/60 bg-surface-900/80 p-4">
            {usageLoading ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : usage ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total tokens</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {usage.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">Requests</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {(usage.requestCount.gpt + usage.requestCount.complete).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>GPT assistant (chat)</span>
                    <span>{usage.bySource.gpt.toLocaleString()} tokens · {usage.requestCount.gpt} requests</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Inline completion</span>
                    <span>{usage.bySource.complete.toLocaleString()} tokens · {usage.requestCount.complete} requests</span>
                  </div>
                </div>
                {usage.lastUpdated > 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Last activity: {new Date(usage.lastUpdated).toLocaleString()}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  Usage is tracked per session. Stats reset when the server restarts (in-memory store).
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">No usage data yet. Use the GPT panel or inline completion to see stats here.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="rounded-xl border border-slate-700/60 bg-surface-900/80 p-4">
            <div className="flex items-center gap-3 mb-4">
              {session.user?.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  className="h-12 w-12 rounded-full border border-slate-600"
                />
              ) : (
                <div className="h-12 w-12 rounded-full border border-slate-600 bg-slate-700 flex items-center justify-center text-slate-400 text-lg font-medium">
                  {(session.user?.name ?? session.user?.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-slate-100">
                  {session.user?.name ?? "User"}
                </p>
                <p className="text-sm text-slate-400 truncate max-w-[240px]">
                  {session.user?.email ?? ""}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              You signed in with your provider. To change email or password, use your provider&apos;s account settings.
            </p>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-3 py-2 rounded-lg text-sm bg-slate-700/80 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
