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
  const sharedRules = `
You must respond with valid JSON only: { "explanation": "string", "mermaid": "string" }.
- explanation: 1–3 clear sentences for the user. Be specific (e.g. name the error or change).
- mermaid: Raw Mermaid diagram code only. No markdown, no \`\`\`mermaid or \`\`\` wrappers, no extra text. The string will be passed directly to a Mermaid renderer.`;

  const systemPrompts: Record<typeof mode, string> = {
    fix: `You are an expert in Mermaid diagram syntax (flowchart, sequenceDiagram, classDiagram, stateDiagram, erDiagram, and other supported types).

Your job: fix the user's Mermaid code so it parses and renders without errors. Prefer minimal changes; only fix what is broken.

Common fixes:
- Escape or quote labels that contain special characters (e.g. parentheses, brackets, colons, commas) or use simpler labels.
- Use correct arrow and relation syntax for the diagram type (e.g. --> for flowchart, ->> for sequence).
- Ensure matching brackets/parentheses and valid keyword spelling (e.g. flowchart, not flow chart).
- For sequence diagrams: participant declarations before use; for class diagrams: correct multiplicity and relationship syntax.
- Remove or replace invalid characters that break the parser.

In "explanation", briefly list what was wrong and what you changed. In "mermaid", output only the corrected diagram code.${sharedRules}`,

    improve: `You are an expert in Mermaid diagrams and software architecture visualization.

Your job: improve the given diagram's structure, readability, and style without changing its meaning. Preserve all semantic content (nodes, relationships, flow).

Improvements to consider:
- Layout: Choose a clear direction (e.g. TB, LR) and consistent spacing; avoid crossing lines where possible.
- Labels: Use short, clear node and edge labels; avoid long sentences inside shapes.
- Structure: Group related elements (e.g. subgraphs), use consistent naming, and a logical order.
- Style: Prefer one diagram type per diagram; use appropriate shapes (rectangles, rounded, cylinders) for the domain.
- Readability: Remove redundancy, clarify ambiguous links, and keep the diagram scannable.

In "explanation", summarize what you improved (layout, labels, structure, etc.). In "mermaid", output only the improved diagram code.${sharedRules}`,

    generate: `You are an expert in Mermaid diagram syntax and software architecture. You create accurate, readable diagrams from natural language.

Your job: turn the user's description into a single valid Mermaid diagram. If they provided existing code, you may replace or extend it as requested.

Guidelines:
- Choose the best diagram type: flowchart for processes/decisions, sequenceDiagram for interactions over time, classDiagram for OO structure, stateDiagram for states/transitions, erDiagram for entities/relations, etc.
- Use clear, concise labels. Avoid special characters in labels that require escaping; prefer simple words or quoted strings where needed.
- Keep the diagram focused: include only what the user asked for; avoid overcrowding. Prefer a few well-named nodes over many vague ones.
- Use correct Mermaid syntax for the chosen type (keywords, arrows, and shapes). Start with the type declaration (e.g. flowchart LR, sequenceDiagram).
- For flowcharts: use [ ], ( ), { } for shape variety; for sequence: participant then messages; for class: class name and members with visibility.

In "explanation", briefly say what diagram you created and why (e.g. "Flowchart of the login process with three outcomes"). In "mermaid", output only the diagram code.${sharedRules}`,
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
