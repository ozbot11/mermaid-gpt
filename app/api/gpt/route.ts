import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGPTResponse } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rateLimit";
import { recordUsage } from "@/lib/usage";

const MAX_MESSAGE_LENGTH = 4_000;
const MAX_MERMAID_LENGTH = 20_000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.user.allowed) {
      return NextResponse.json(
        { error: "Access denied. You are not allowed to use this app." },
        { status: 403 }
      );
    }

    const rateLimitKey = session.user.email ?? session.user.id ?? "anon";
    const rate = checkRateLimit(rateLimitKey);
    if (!rate.allowed) {
      const retrySec = rate.retryAfterMs ? Math.ceil(rate.retryAfterMs / 1000) : 60;
      return NextResponse.json(
        { error: `Too many requests. Please try again in ${retrySec} seconds.` },
        { status: 429, headers: { "Retry-After": String(retrySec) } }
      );
    }

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

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` },
        { status: 400 }
      );
    }

    if (mermaid.length > MAX_MERMAID_LENGTH) {
      return NextResponse.json(
        { error: `Diagram is too long (max ${MAX_MERMAID_LENGTH} characters).` },
        { status: 400 }
      );
    }

    const result = await getGPTResponse(message, mermaid, mode);
    if (result.usage && session.user.email) {
      recordUsage(session.user.email, result.usage, "gpt");
    }
    return NextResponse.json({
      explanation: result.explanation,
      mermaid: result.mermaid,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg === "OPENAI_RATE_LIMIT") {
      return NextResponse.json(
        { error: "AI service is busy. Please try again in a minute." },
        { status: 429 }
      );
    }
    if (msg === "OPENAI_SERVER_ERROR") {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
