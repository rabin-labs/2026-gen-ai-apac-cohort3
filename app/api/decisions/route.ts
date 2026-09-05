import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveDecisionSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const snapshot = await adminDb.collection("users").doc(user.uid).collection("decisions").orderBy("createdAt", "desc").limit(20).get();
    const decisions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.().toISOString() }));
    return NextResponse.json({ decisions }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("decision_list_failed", { errorType: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "Journal history is unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!checkRateLimit(`save:${user.uid}`, 10)) return NextResponse.json({ error: "Too many save attempts." }, { status: 429 });
    const input = saveDecisionSchema.parse(await request.json());
    const ref = adminDb.collection("users").doc(user.uid).collection("decisions").doc();
    await ref.set({ ...input, schemaVersion: 1, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), ownerUid: user.uid });
    return NextResponse.json({ decision: { id: ref.id, ...input } }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error && typeof error === "object" && "issues" in error) return NextResponse.json({ error: "The decision snapshot is invalid." }, { status: 400 });
    console.error("decision_save_failed", { errorType: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "The snapshot could not be saved." }, { status: 503 });
  }
}
