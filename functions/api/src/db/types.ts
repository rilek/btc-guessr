import type z from "zod";
import type {
  GuessSchema,
  PendingGuessSchema,
  ResolvedGuessSchema,
} from "./schema";

export type Guess = z.infer<typeof GuessSchema>;
export type PendingGuess = z.infer<typeof PendingGuessSchema>;
export type ResolvedGuess = z.infer<typeof ResolvedGuessSchema>;
export type Player = z.infer<typeof import("./schema").PlayerSchema>;

export type DB = typeof import("./");
