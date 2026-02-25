"use client";

import { useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EditorPanel({ value, onChange }: EditorPanelProps) {
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
