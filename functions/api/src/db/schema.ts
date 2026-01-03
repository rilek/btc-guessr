import { z } from "zod";

export const PendingGuessSchema = z.object({
  guessId: z.uuid().default(() => crypto.randomUUID()),
  createdAt: z.string().default(() => new Date().toISOString()),
  referencePrice: z.number(),
  direction: z.enum(["up", "down"]),
  status: z.literal("pending").default("pending"),
});

export const ResolvedGuessSchema = PendingGuessSchema.extend({
  status: z.literal("resolved").default("resolved"),
  resolvedAt: z.string(),
  resolvedPrice: z.number(),
  outcome: z.enum(["win", "lose"]),
});

export const GuessSchema = z.union([PendingGuessSchema, ResolvedGuessSchema]);

export const PlayerSchema = z.object({
  playerId: z.uuid(),
  guesses: z.array(GuessSchema).default([]),
  createdAt: z.string(),
});
