import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { continueConversation } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!checkRateLimit(`chat:${user.uid}`)) return NextResponse.json({ error: "Please pause before sending another message." }, { status: 429 });
    const input = chatRequestSchema.parse(await request.json());
    const result = await continueConversation(input.mode, input.messages);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof SyntaxError || (error && typeof error === "object" && "issues" in error)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    console.error("chat_request_failed", { errorType: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "The conversation service is temporarily unavailable." }, { status: 503 });
  }
}
