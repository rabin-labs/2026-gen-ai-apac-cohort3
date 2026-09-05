import { z } from "zod";

export const modeSchema = z.enum(["explore", "decide", "reflect", "replay"]);
export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(8000)
});
export const chatRequestSchema = z.object({
  mode: modeSchema,
  decisionId: z.string().min(8).max(128).optional(),
  messages: z.array(messageSchema).min(1).max(40)
}).strict();
export const decisionSnapshotSchema = z.object({
  title: z.string().min(1).max(120),
  decision: z.string().min(1).max(2000),
  options: z.array(z.string().max(400)).max(8),
  priorities: z.array(z.string().max(400)).max(8),
  assumptions: z.array(z.string().max(600)).max(10),
  risks: z.array(z.string().max(600)).max(10),
  expectedOutcome: z.string().max(1200),
  confidence: z.number().int().min(0).max(100),
  reviewDate: z.string().date().nullable(),
  sensitive: z.boolean().default(false)
});
export const modelResponseSchema = z.object({
  reply: z.string().min(1).max(8000),
  readyForSnapshot: z.boolean(),
  snapshot: decisionSnapshotSchema.nullable()
});
export const saveDecisionSchema = decisionSnapshotSchema.extend({
  conversation: z.array(messageSchema).min(1).max(40)
});

export type ChatMessage = z.infer<typeof messageSchema>;
export type DecisionSnapshot = z.infer<typeof decisionSnapshotSchema>;
