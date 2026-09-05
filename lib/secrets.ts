import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

let cachedKey: string | undefined;

export async function getGeminiApiKey() {
  if (cachedKey) return cachedKey;

  if (process.env.NODE_ENV !== "production" && process.env.GEMINI_API_KEY) {
    cachedKey = process.env.GEMINI_API_KEY;
    return cachedKey;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const secretId = process.env.GEMINI_API_KEY_SECRET ?? "gemini-api-key";
  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT is not configured");

  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretId}/versions/latest`
  });
  const value = version.payload?.data?.toString();
  if (!value) throw new Error("Gemini credential is unavailable");
  cachedKey = value;
  return cachedKey;
}
