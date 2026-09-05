import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

export class AuthError extends Error {}

export async function requireUser(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new AuthError("Authentication required");
  const token = header.slice(7);
  try {
    return await adminAuth.verifyIdToken(token, true);
  } catch {
    throw new AuthError("Invalid or expired session");
  }
}
