import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createPlayer,
  fetchPlayer,
  type Guess,
  makeGuess,
  type PendingGuess,
  type Player,
  type ResolvedGuess,
  resolveGuess,
} from "../api";

interface PlayerState {
  player: Player | null;
  loading: boolean;
  canPlay(): boolean;
  getScore(): number;
  getPendingGuess(): PendingGuess | null;

  fetchPlayer(): Promise<void>;
  makeGuess(direction: Guess["direction"]): Promise<void>;
  resolveGuess(): Promise<void>;
}

const canPlayerPlay = (player: Player) =>
  player.guesses.every((guess) => guess.status === "resolved");

const getPlayerScore = (player: Player) =>
  player.guesses.reduce((acc, g) => {
    if (g.status === "pending") return acc;

    return g.outcome === "win" ? acc + 1 : acc;
  }, 0);

const getPendingGuess = (player: Player) =>
  player.guesses.find((g) => g.status === "pending") || null;

const appendPlayerGuess = (player: Player, guess: Guess) => ({
  ...player,
  guesses: [...player.guesses, guess],
});

const resolvePlayerGuess = (player: Player, resolvedGuess: ResolvedGuess) => ({
  ...player,
  guesses: player.guesses.map((g) =>
    g.guessId === resolvedGuess.guessId ? resolvedGuess : g,
  ),
});

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      player: null,
      loading: false,
      canPlay: (): boolean => {
        const { player } = usePlayerStore.getState();
        return !!player && canPlayerPlay(player);
      },
      getScore: (): number => {
        const { player } = usePlayerStore.getState();

        return player ? getPlayerScore(player) : 0;
      },
      getPendingGuess: () => {
        const { player } = usePlayerStore.getState();
        if (!player) return null;

        const guess = getPendingGuess(player);
        return guess as PendingGuess | null;
      },
      makeGuess: async (direction) => {
        const { player } = usePlayerStore.getState();
        if (!player) throw new Error("Player not found");

        const pendingGuess = await makeGuess(player.playerId, direction);

        set({ player: appendPlayerGuess(player, pendingGuess) });
      },
      fetchPlayer: async () => {
        const playerId = usePlayerStore.getState().player?.playerId;
        const player = playerId
          ? await fetchPlayer(playerId)
          : await createPlayer();

        set({ player });
      },
      resolveGuess: async () => {
        const { player } = usePlayerStore.getState();
        if (!player) throw new Error("Player not found");
        const resolvedGuess = await resolveGuess(player.playerId);

        set({ player: resolvePlayerGuess(player, resolvedGuess) });
      },
    }),

    { name: "player-data" },
  ),
);
