import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInlineCompletion } from "@/lib/openai";
import { checkRateLimit } from "@/lib/rateLimit";
import { recordUsage } from "@/lib/usage";

const MAX_PREFIX = 8_000;
const MAX_SUFFIX = 2_000;

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
    const prefix = typeof body.prefix === "string" ? body.prefix.slice(0, MAX_PREFIX) : "";
    const suffix = typeof body.suffix === "string" ? body.suffix.slice(0, MAX_SUFFIX) : "";

    const { completion, usage } = await getInlineCompletion(prefix, suffix);
    if (usage && session.user.email) {
      recordUsage(session.user.email, usage, "complete");
    }
    return NextResponse.json({ completion });
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
