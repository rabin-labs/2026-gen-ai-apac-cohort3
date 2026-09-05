import { describe, expect, it } from "vitest";
import { parseModelResponse } from "../lib/model-response";

const valid = {
  reply: "Which outcome matters most to you?",
  readyForSnapshot: false,
  snapshot: null
};

describe("Gemini response contract", () => {
  it("accepts the required JSON shape", () => {
    expect(parseModelResponse(JSON.stringify(valid))).toEqual(valid);
  });

  it("accepts JSON wrapped in a markdown fence", () => {
    expect(parseModelResponse(`\`\`\`json\n${JSON.stringify(valid)}\n\`\`\``)).toEqual(valid);
  });

  it("rejects renamed or missing contract fields", () => {
    expect(() => parseModelResponse(JSON.stringify({ response: "A question" }))).toThrow();
  });

  it("rejects an incomplete snapshot", () => {
    expect(() => parseModelResponse(JSON.stringify({
      reply: "Here is your snapshot.", readyForSnapshot: true, snapshot: { title: "Choice" }
    }))).toThrow();
  });
});
