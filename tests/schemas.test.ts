import { describe, expect, it } from "vitest";
import { chatRequestSchema, modelResponseSchema } from "../lib/schemas";

describe("boundary schemas", () => {
  it("rejects a client-supplied user identifier", () => {
    expect(() => chatRequestSchema.parse({ mode: "decide", userId: "victim", messages: [{ role: "user", content: "A decision" }] })).toThrow();
  });

  it("rejects oversized messages", () => {
    expect(() => chatRequestSchema.parse({ mode: "decide", messages: [{ role: "user", content: "x".repeat(8001) }] })).toThrow();
  });

  it("rejects an invalid model confidence score", () => {
    expect(() => modelResponseSchema.parse({ reply: "Ready", readyForSnapshot: true, snapshot: {
      title: "Choice", decision: "Choose", options: [], priorities: [], assumptions: [], risks: [],
      expectedOutcome: "Good", confidence: 101, reviewDate: null, sensitive: false
    } })).toThrow();
  });
});
