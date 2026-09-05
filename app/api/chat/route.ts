import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { continueConversation } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schemas";
import { ZodError } from "zod";

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
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request.", code: "INVALID_REQUEST" }, { status: 400 });
    if (error instanceof ZodError) {
      const isModelOutput = error.issues.some(issue => issue.path[0] === "reply" || issue.path[0] === "snapshot" || issue.path[0] === "readyForSnapshot");
      const validationIssues = error.issues.map(issue => ({
        path: issue.path.join("."),
        code: issue.code,
        message: issue.message
      }));
      console.error("chat_validation_failed", {
        code: isModelOutput ? "MODEL_RESPONSE_INVALID" : "INVALID_REQUEST",
        issues: validationIssues
      });
      return NextResponse.json({
        error: isModelOutput ? "Gemini returned an unexpected response. Please try again." : "Invalid request.",
        code: isModelOutput ? "MODEL_RESPONSE_INVALID" : "INVALID_REQUEST",
        ...(process.env.NODE_ENV === "development" ? { validationIssues } : {})
      }, { status: isModelOutput ? 502 : 400 });
    }
    const message = error instanceof Error ? error.message : "";
    const normalized = message.toLowerCase();
    const providerStatus = error && typeof error === "object" && "status" in error ? String(error.status) : "unknown";
    const safeProviderMessage = message
      .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted-api-key]")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 600);
    const diagnostic = normalized.includes("secret") || normalized.includes("credential") || normalized.includes("permission_denied")
      ? { error: "The server could not access Gemini credentials in Secret Manager.", code: "SECRET_ACCESS_FAILED" }
      : normalized.includes("api key") || normalized.includes("api_key") || normalized.includes("generative language")
        ? { error: "The Gemini API rejected the configured API key or its API restrictions.", code: "GEMINI_KEY_REJECTED" }
        : providerStatus === "404" || normalized.includes("not found") || normalized.includes("no longer available")
          ? { error: "The configured Gemini model is unavailable to this project.", code: "GEMINI_MODEL_UNAVAILABLE" }
          : { error: "The conversation service is temporarily unavailable.", code: "CONVERSATION_FAILED" };
    console.error("chat_request_failed", {
      errorType: error instanceof Error ? error.name : "unknown",
      code: diagnostic.code,
      providerStatus,
      providerMessage: safeProviderMessage
    });
    return NextResponse.json({
      ...diagnostic,
      ...(process.env.NODE_ENV === "development" ? { providerStatus, providerMessage: safeProviderMessage } : {})
    }, { status: 503 });
  }
}
