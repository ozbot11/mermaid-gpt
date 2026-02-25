"use client";

import { useCallback, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

const INLINE_DEBOUNCE_MS = 500;
const MIN_PREFIX_LENGTH = 10;

/** Minimal types for Monaco inline completions callback (avoids monaco namespace in type position). */
interface InlineCompletionModel {
  getLineCount(): number;
  getLineMaxColumn(lineNumber: number): number;
  getValueInRange(range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  }): string;
}
interface InlineCompletionPosition {
  lineNumber: number;
  column: number;
}
interface InlineCompletionToken {
  isCancellationRequested: boolean;
}

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EditorPanel({ value, onChange }: EditorPanelProps) {
  const completionAbortRef = useRef<AbortController | null>(null);

  const handleChange = useCallback(
    (val: string | undefined) => {
      onChange(val ?? "");
    },
    [onChange]
  );

  const handleMount: OnMount = (editor, monaco) => {
    if (!monaco) return;
    monaco.languages.registerCompletionItemProvider("markdown", {
      triggerCharacters: ["f", "s", "a", "c"],
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: "flowchart-basic",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "flowchart LR\n" +
              "  A[Start] --> B{Condition}\n" +
              "  B -->|Yes| C[Process]\n" +
              "  B -->|No| D[End]\n" +
              "  C --> D\n",
            documentation: "Basic flowchart skeleton",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
          {
            label: "sequence-basic",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "sequenceDiagram\n" +
              "  participant U as User\n" +
              "  participant S as Server\n" +
              "  U->>S: Request\n" +
              "  S-->>U: Response\n",
            documentation: "Basic sequence diagram skeleton",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
          {
            label: "architecture-basic",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "architecture-beta\n" +
              "group api(cloud)[API]\n\n" +
              "service db(database)[Database] in api\n" +
              "service cache(disk)[Storage] in api\n" +
              "service server(server)[Server] in api\n\n" +
              "db:R -- L:server\n" +
              "cache:T -- B:server\n",
            documentation: "Simple architecture-beta diagram",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
          {
            label: "state-basic",
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText:
              "stateDiagram-v2\n" +
              "  [*] --> Idle\n" +
              "  Idle --> Loading : fetch\n" +
              "  Loading --> Success : done\n" +
              "  Loading --> Error : fail\n" +
              "  Success --> [*]\n" +
              "  Error --> Loading : retry\n",
            documentation: "State machine skeleton",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          },
        ];
        return { suggestions };
      },
    });

    monaco.languages.registerInlineCompletionsProvider("markdown", {
      provideInlineCompletions: async (
        model: InlineCompletionModel,
        position: InlineCompletionPosition,
        _context: unknown,
        token: InlineCompletionToken
      ) => {
        const lineCount = model.getLineCount();
        const endLine = lineCount;
        const endColumn = model.getLineMaxColumn(endLine);
        const prefix = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });
        const suffix = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: endLine,
          endColumn,
        });
        if (prefix.length < MIN_PREFIX_LENGTH) {
          return { items: [] };
        }

        await new Promise((r) => setTimeout(r, INLINE_DEBOUNCE_MS));
        if (token.isCancellationRequested) return { items: [] };

        if (completionAbortRef.current) {
          completionAbortRef.current.abort();
        }
        completionAbortRef.current = new AbortController();
        const signal = completionAbortRef.current.signal;

        try {
          const res = await fetch("/api/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            signal,
            body: JSON.stringify({ prefix, suffix }),
          });
          if (token.isCancellationRequested) return { items: [] };
          if (!res.ok) return { items: [] };
          const data = (await res.json()) as { completion?: string };
          const text = typeof data.completion === "string" ? data.completion.trim() : "";
          if (!text || token.isCancellationRequested) return { items: [] };
          return {
            items: [
              {
                insertText: text,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              },
            ],
          };
        } catch {
          return { items: [] };
        } finally {
          completionAbortRef.current = null;
        }
      },
      freeThreading: true,
    });
  };

  return (
    <div className="h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-700/50 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        language="markdown"
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          lineHeight: 20,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          formatOnPaste: true,
          formatOnType: true,
          tabSize: 2,
          insertSpaces: true,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          bracketPairColorization: { enabled: true },
          renderLineHighlight: "line",
          inlineSuggest: { enabled: true },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false,
          },
        }}
      />
    </div>
  );
}
