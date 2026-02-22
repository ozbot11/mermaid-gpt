import { NextRequest, NextResponse } from "next/server";
import { getGPTResponse } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const message = typeof body.message === "string" ? body.message : "";
    const mermaid = typeof body.mermaid === "string" ? body.mermaid : "";
    const mode = ["fix", "improve", "generate"].includes(body.mode)
      ? body.mode
      : "improve";

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const result = await getGPTResponse(message, mermaid, mode);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
