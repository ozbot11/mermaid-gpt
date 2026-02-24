import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  return NextResponse.json(
    { ok: true, openaiConfigured: hasOpenAI },
    { status: 200 }
  );
}
