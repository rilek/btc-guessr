export type PendingGuess = {
  guessId: string;
  createdAt: string;
  referencePrice: number;
  direction: "up" | "down";
  status: "pending";
};

export type ResolvedGuess = {
  guessId: string;
  createdAt: string;
  referencePrice: number;
  direction: "up" | "down";
  status: "resolved";
  resolvedAt: string;
  resolvedPrice: number;
  outcome: "win" | "lose";
};

export type Guess = PendingGuess | ResolvedGuess;

export type Player = {
  playerId: string;
  guesses: Guess[];
};

const API_URL = import.meta.env.VITE_API_URL;

export const createPlayer = async (): Promise<Player> => {
  const response = await fetch(`${API_URL}/players`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to create player");

  const { data } = (await response.json()) as { data: Player };
  return data;
};

export const fetchPlayer = async (playerId: string): Promise<Player | null> => {
  const response = await fetch(`${API_URL}/players/${playerId}`);

  const { data } = (await response.json()) as { data: Player };
  return data;
};

export const resolveGuess = async (
  playerId: string,
): Promise<ResolvedGuess> => {
  const response = await fetch(`${API_URL}/players/${playerId}/guess/resolve`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Failed to resolve guess");
  const { data } = (await response.json()) as { data: ResolvedGuess };
  return data;
};

export const makeGuess = async (
  playerId: string,
  direction: Guess["direction"],
): Promise<PendingGuess> => {
  const res = await fetch(`${API_URL}/players/${playerId}/guess`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ direction }),
  });

  if (!res.ok) throw new Error("Failed to make a guess");

  const { data } = (await res.json()) as { data: PendingGuess };

  return data;
};

export const fetchBtcPrice = async () => {
  const res = await fetch(`${API_URL}/ticker`);
  if (!res.ok) throw new Error("Failed to fetch BTC price");

  const { data } = (await res.json()) as { data: number };

  return data;
};
