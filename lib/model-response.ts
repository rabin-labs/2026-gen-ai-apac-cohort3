import { modelResponseSchema } from "./schemas";


export const modelOutputContract = `Return exactly one JSON object with all three top-level fields:
{
  "reply": "A concise, empathetic response ending with at most one focused question",
  "readyForSnapshot": false,
  "snapshot": null
}

When enough information exists, set readyForSnapshot to true and use this exact snapshot shape:
{
  "reply": "string",
  "readyForSnapshot": true,
  "snapshot": {
    "title": "string, maximum 120 characters",
    "decision": "string",
    "options": ["string"],
    "priorities": ["string"],
    "assumptions": ["string"],
    "risks": ["string"],
    "expectedOutcome": "string",
    "confidence": 0,
    "reviewDate": null,
    "sensitive": false
  }
}

confidence must be an integer from 0 to 100. reviewDate must be YYYY-MM-DD or null.
Never rename or omit reply, readyForSnapshot, or snapshot. Do not wrap the object in another field.`;

export function parseModelResponse(text: string) {
  const trimmed = text.trim();
  const withoutFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;
  return modelResponseSchema.parse(JSON.parse(withoutFence));
}
