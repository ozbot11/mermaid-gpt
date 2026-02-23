export const STORAGE_KEY = "mermaid-gpt-draft";

export const DEFAULT_CODE = `flowchart LR
  A[Start] --> B{OK?}
  B -->|Yes| C[End]
  B -->|No| D[Retry]`;
