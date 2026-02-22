"use client";

import { useCallback } from "react";
import Editor from "@monaco-editor/react";

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

  return (
    <div className="h-full min-h-[300px] rounded-lg overflow-hidden border border-slate-700/50 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        language="markdown"
        value={value}
        onChange={handleChange}
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
