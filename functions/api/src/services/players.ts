import {
  PendingGuessSchema,
  PlayerSchema,
  ResolvedGuessSchema,
} from "@/db/schema";
import type { Guess, PendingGuess, Player, ResolvedGuess } from "@/db/types";
import { type Deps, type Result, resultData, resultError } from "./utils";

export const getPlayer = async (
  { db }: Deps,
  playerId: Player["playerId"],
): Promise<Result<Player | null>> => {
  if (!playerId) return resultError(`Missing playerId parameter`);
  return resultData(await db.getPlayer(playerId));
};

export const createPlayer = async ({ db }: Deps) => {
  const playerId = await db.createPlayer();
  const player = await db.getPlayer(playerId);

  if (!player) return resultError("Failed to create player");

  return resultData(player);
};

const appendGuess = (
  player: Player,
  direction: Guess["direction"],
  referencePrice: number,
) => {
  return PlayerSchema.parse({
    ...player,
    guesses: [
      ...player.guesses,
      PendingGuessSchema.parse({
        direction,
        referencePrice,
      }),
    ],
  });
};

const hasPendingStatus = (player: Player): boolean =>
  player.guesses.some(({ status }) => status === "pending");

export const makeGuess = async (
  { db, binance }: Deps,
  playerId: Player["playerId"],
  direction: Guess["direction"],
): Promise<Result<PendingGuess>> => {
  if (!playerId) return resultError(`Missing playerId parameter`);
  if (!direction) return resultError(`Missing direction parameter`);

  const player = await db.getPlayer(playerId);

  if (player === null) return resultError(`Player doesn't exist`);
  if (hasPendingStatus(player))
    return resultError(`Player already has a pending guess`);

  await db.updatePlayer(
    appendGuess(player, direction, await binance.getBTCPrice()),
  );

  const updatedPlayer = await db.getPlayer(playerId);

  if (!updatedPlayer) return resultError("Failed to retrieve updated player");

  const newGuess = updatedPlayer.guesses.at(-1);

  if (newGuess?.status !== "pending")
    return resultError("Failed to create new guess");

  return resultData(newGuess);
};

const pendingTimeDiff = 60 * 1000;

const hasGuessed = (pendingGuess: PendingGuess, price: number) => {
  return (
    (pendingGuess.direction === "up" && price > pendingGuess.referencePrice) ||
    (pendingGuess.direction === "down" && price < pendingGuess.referencePrice)
  );
};

const makeGuessResolved = (
  player: Player,
  guessId: Guess["guessId"],
  price: number,
) => {
  return PlayerSchema.parse({
    ...player,
    guesses: player.guesses.map((guess) => {
      if (guess.guessId !== guessId) return guess;

      const isCorrect = hasGuessed(guess as PendingGuess, price);

      return ResolvedGuessSchema.parse({
        ...guess,
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolvedPrice: price,
        outcome: isCorrect ? "win" : "lose",
      });
    }),
  });
};

export const resolveGuess = async (
  { db, binance }: Deps,
  playerId: Player["playerId"],
): Promise<Result<ResolvedGuess>> => {
  if (!playerId) return resultError(`Missing playerId parameter`);

  const player = await db.getPlayer(playerId);

  if (player === null) return resultError(`Player doesn't exist`);

  const pendingGuess = player.guesses.find((x) => x.status === "pending");

  if (!pendingGuess) return resultError("No pending guess to resolve");

  if (Date.now() - new Date(pendingGuess.createdAt).getTime() < pendingTimeDiff)
    return resultError("Pending guess cooldown not passed yet");

  const currentPrice = await binance.getBTCPrice();

  db.updatePlayer(
    makeGuessResolved(player, pendingGuess.guessId, currentPrice),
  );

  const updatedPlayer = await db.getPlayer(playerId);
  if (!updatedPlayer) return resultError("Failed to retrieve updated player");
  const newGuess = updatedPlayer.guesses.at(-1) as ResolvedGuess;

  return resultData(newGuess);
};
