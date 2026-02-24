export type GPTMode = "fix" | "improve" | "generate";

export interface GPTMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mermaid?: string;
  timestamp: number;
}

export interface GPTResponse {
  explanation: string;
  mermaid: string;
}

export interface Project {
  id: number;
  name: string;
  mermaidCode: string;
  createdAt: number;
  updatedAt: number;
  description?: string;
}

export type ExampleTemplate =
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "mindmap"
  | "architecture"
  | "gantt"
  | "pie"
  | "journey"
  | "gitGraph"
  | "block"
  | "timeline"
  | "c4";
