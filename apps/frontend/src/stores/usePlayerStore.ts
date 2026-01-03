import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createPlayer,
  fetchPlayer,
  type Guess,
  makeGuess,
  type PendingGuess,
  type Player,
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

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      player: null,
      loading: false,
      canPlay: (): boolean => {
        const state = usePlayerStore.getState();

        return !!state.player?.guesses.every(
          (guess) => guess.status === "resolved",
        ) as boolean;
      },
      getScore: (): number => {
        const player = usePlayerStore.getState().player;
        if (!player) return 0;

        return player.guesses.reduce((acc, g) => {
          if (g.status === "pending") return acc;
          return g.outcome === "win" ? acc + 1 : acc;
        }, 0);
      },
      getPendingGuess: () => {
        const player = usePlayerStore.getState().player;
        if (!player) return null;

        const pendingGuess = player.guesses.find(
          (g) => g.status === "pending",
        ) as PendingGuess | undefined;

        return pendingGuess || null;
      },
      makeGuess: async (direction) => {
        const { player } = usePlayerStore.getState();
        if (!player) throw new Error("Player not found");

        const pendingGuess = await makeGuess(player.playerId, direction);

        set({
          player: {
            ...player,
            guesses: [...player.guesses, pendingGuess],
          },
        });
      },
      fetchPlayer: async () => {
        const playerId = usePlayerStore.getState().player?.playerId;
        const player = playerId
          ? await fetchPlayer(playerId)
          : await createPlayer();

        set({ player });
      },
      resolveGuess: async () => {
        const playerId = usePlayerStore.getState().player?.playerId;
        if (!playerId) throw new Error("Player not found");
        const resolvedGuess = await resolveGuess(playerId);

        set(({ player }) => ({
          player: player
            ? {
                ...player,
                guesses: player.guesses.map((g) =>
                  g.guessId === resolvedGuess.guessId ? resolvedGuess : g,
                ),
              }
            : null,
        }));
      },
    }),

    { name: "player-data" },
  ),
);
