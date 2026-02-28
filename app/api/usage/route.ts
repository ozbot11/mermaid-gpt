import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsage } from "@/lib/usage";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Sign in to view usage." },
        { status: 401 }
      );
    }

    const stats = getUsage(session.user.email);
    if (!stats) {
      return NextResponse.json({
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        bySource: { gpt: 0, complete: 0 },
        requestCount: { gpt: 0, complete: 0 },
        lastUpdated: 0,
      });
    }
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Failed to load usage." },
      { status: 500 }
    );
  }
}
