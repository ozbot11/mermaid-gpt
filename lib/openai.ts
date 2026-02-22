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
  const systemPrompts: Record<typeof mode, string> = {
    fix: `You are an expert in Mermaid diagram syntax. Fix the given Mermaid code so it compiles and renders correctly. Return ONLY valid Mermaid code when providing the fix. Respond with JSON: { "explanation": "brief explanation of fixes", "mermaid": "valid mermaid code" }.`,
    improve: `You are an expert in Mermaid diagrams and software architecture. Refactor and improve the structure, readability, and style of the given Mermaid diagram. Keep the same meaning. Return JSON: { "explanation": "what you improved", "mermaid": "improved valid mermaid code" }.`,
    generate: `You are an expert in Mermaid diagram syntax and software architecture diagrams. Convert the user's plain English description into valid Mermaid code. If they also provide existing code, you may replace or extend it. Always return valid Mermaid code. Respond with JSON: { "explanation": "what diagram you created", "mermaid": "valid mermaid code" }.`,
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
