/** Strip markdown code fences so Mermaid only gets raw diagram code. */
function stripMermaidFences(raw: string): string {
  let s = raw.trim();
  const open = /^```(?:mermaid)?\s*\n*/i;
  const close = /\n*\s*```\s*$/;
  if (open.test(s)) s = s.replace(open, "");
  if (close.test(s)) s = s.replace(close, "");
  return s.trim();
}

export async function getGPTResponse(
  userMessage: string,
  currentMermaid: string,
  mode: "fix" | "improve" | "generate"
): Promise<{ explanation: string; mermaid: string }> {
  const validateRule = `
CRITICAL - VALIDATE BEFORE RETURN:
- You must NEVER return broken or invalid Mermaid code. The "mermaid" field will be rendered by a real Mermaid parser; invalid syntax will break the app.
- Before returning, mentally verify: does this diagram type use only the syntax allowed for that type? Would a Mermaid parser accept this exactly as written?
- If the input code is invalid, you MUST fix or replace it with valid syntax. Never echo back invalid code unchanged.
- When in doubt, output a simpler diagram that you are certain is valid (e.g. a minimal flowchart or the correct gitGraph/sequence/class syntax) and explain in "explanation" what you did.`;

  const sharedRules = `
You must respond with valid JSON only: { "explanation": "string", "mermaid": "string" }.
- explanation: 1–3 clear sentences for the user. Be specific (e.g. name the error or change).
- mermaid: Raw Mermaid diagram code only. No markdown, no \`\`\`mermaid or \`\`\` wrappers, no extra text. The string will be passed directly to a Mermaid renderer.
${validateRule}`;

  const strictDiagramTypes = `
Diagram-type rules (follow exactly; mixing types causes parse errors):
- gitGraph: ONLY "gitGraph" then commit/branch/checkout/merge. NO subgraph, NO flowchart arrows (-->), NO node definitions like main[Main]. Valid: first line "gitGraph", then lines like "  commit", "  branch dev", "  checkout dev", "  commit", "  checkout main", "  merge dev".
- flowchart: Starts with "flowchart" then direction (LR/TB/etc). Use --> for edges, [ ] ( ) { } for nodes. Subgraphs use subgraph ... end.
- sequenceDiagram: "sequenceDiagram" then participant lines, then message arrows (->>, -->>, etc).
- classDiagram: "classDiagram" then class X { ... }, then relationship lines with <|-- etc.
- stateDiagram-v2: "stateDiagram-v2" then state names and : for transitions.
- erDiagram: "erDiagram" then ENTITY { } and relation lines with ||--o{ etc.`;

  const systemPrompts: Record<typeof mode, string> = {
    fix: `You are an expert in Mermaid diagram syntax (flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram, gitGraph, and other supported types).

Your job: fix the user's Mermaid code so it parses and renders without errors. Prefer minimal changes; only fix what is broken. NEVER return the same code if it is invalid—you MUST output valid, renderable Mermaid.

Common fixes:
- Escape or quote labels that contain special characters (e.g. parentheses, brackets, colons, commas) or use simpler labels.
- Use correct arrow and relation syntax for the diagram type (e.g. --> for flowchart, ->> for sequence). Do not use flowchart arrows in gitGraph.
- Ensure matching brackets/parentheses and valid keyword spelling (e.g. flowchart, not flow chart).
- For sequence diagrams: participant declarations before use; for class diagrams: correct multiplicity and relationship syntax.
- For gitGraph: use only commit, branch, checkout, merge; no subgraph, no --> or node definitions. Convert invalid gitGraph to valid gitGraph syntax.
- Remove or replace invalid characters that break the parser. If the diagram type is wrong or mixed, rewrite it as one valid type.

In "explanation", briefly list what was wrong and what you changed. In "mermaid", output only the corrected diagram code.${strictDiagramTypes}${sharedRules}`,

    improve: `You are an expert in Mermaid diagrams and software architecture visualization.

Your job: improve the given diagram's structure, readability, and style without changing its meaning. Preserve all semantic content (nodes, relationships, flow). If the given code is INVALID or uses wrong syntax for its diagram type, you MUST fix it first so it is valid, then improve. NEVER return invalid or broken code. Your "mermaid" output must always parse and render.

Improvements to consider:
- Layout: Choose a clear direction (e.g. TB, LR) and consistent spacing; avoid crossing lines where possible.
- Labels: Use short, clear node and edge labels; avoid long sentences inside shapes.
- Structure: Group related elements (e.g. subgraphs only where the diagram type supports them), use consistent naming, and a logical order.
- Style: Use exactly one diagram type with correct syntax (flowchart, sequenceDiagram, gitGraph, etc.). For gitGraph use only commit/branch/checkout/merge—no subgraph or -->.
- Readability: Remove redundancy, clarify ambiguous links, and keep the diagram scannable.

In "explanation", summarize what you improved (and if you had to fix invalid syntax first, say so). In "mermaid", output only valid, renderable diagram code.${strictDiagramTypes}${sharedRules}`,

    generate: `You are an expert in Mermaid diagram syntax and software architecture. You create accurate, readable diagrams from natural language.

Your job: turn the user's description into a single valid Mermaid diagram. If they provided existing code, you may replace or extend it as requested. You must NEVER output invalid Mermaid—only syntax that will parse and render.

Guidelines:
- Choose the best diagram type: flowchart for processes/decisions, sequenceDiagram for interactions over time, classDiagram for OO structure, stateDiagram for states/transitions, erDiagram for entities/relations, gitGraph for git branches/commits, etc.
- Use the exact syntax for that type (e.g. gitGraph: only gitGraph, commit, branch, checkout, merge—no subgraph or flowchart arrows).
- Use clear, concise labels. Avoid special characters in labels that require escaping; prefer simple words or quoted strings where needed.
- Keep the diagram focused: include only what the user asked for; avoid overcrowding. Prefer a few well-named nodes over many vague ones.
- Start with the type declaration (e.g. flowchart LR, sequenceDiagram, gitGraph). For flowcharts: use [ ], ( ), { } for shape variety; for sequence: participant then messages; for class: class name and members with visibility.

In "explanation", briefly say what diagram you created and why. In "mermaid", output only valid, renderable diagram code.${strictDiagramTypes}${sharedRules}`,
  };

  const system = systemPrompts[mode];
  const userContent = `${userMessage}\n\nCurrent Mermaid code (if any):\n\`\`\`mermaid\n${currentMermaid}\n\`\`\``;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `OpenAI API error: ${res.status}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(raw) as { explanation?: string; mermaid?: string };
  const mermaidRaw = typeof parsed.mermaid === "string" ? parsed.mermaid : "";
  return {
    explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
    mermaid: stripMermaidFences(mermaidRaw),
  };
}
