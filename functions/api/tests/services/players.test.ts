import { describe, it, expect, beforeEach } from "vitest";
import {
  getPlayer,
  createPlayer,
  makeGuess,
  resolveGuess,
} from "@/services/players";
import type { Player, PendingGuess, ResolvedGuess } from "@/db/types";
import type { Deps } from "@/services/utils";

describe("Players Service", () => {
  let mockDB: any;
  let mockBinance: any;
  let deps: Deps;
  let playersStorage: Map<string, Player>;

  beforeEach(() => {
    playersStorage = new Map();

    mockDB = {
      async getPlayer(playerId: string): Promise<Player | null> {
        return playersStorage.get(playerId) || null;
      },

      async createPlayer(): Promise<string> {
        const playerId = crypto.randomUUID();
        const player: Player = {
          playerId,
          guesses: [],
          createdAt: new Date().toISOString(),
        };
        playersStorage.set(playerId, player);
        return playerId;
      },

      async updatePlayer(player: Player): Promise<void> {
        playersStorage.set(player.playerId, player);
      },

      // Test helper methods
      setPlayer(player: Player): void {
        playersStorage.set(player.playerId, player);
      },
    };

    mockBinance = {
      btcPrice: 50000,

      async getBTCPrice(): Promise<number> {
        return this.btcPrice;
      },

      setBTCPrice(price: number): void {
        this.btcPrice = price;
      },
    };

    deps = {
      db: mockDB,
      binance: mockBinance,
    };
  });

  describe("getPlayer", () => {
    it("should return error when playerId is missing", async () => {
      const result = await getPlayer(deps, "");

      expect(result.error).toBe("Missing playerId parameter");
      expect(result.data).toBeNull();
    });

    it("should return null when player doesn't exist", async () => {
      const result = await getPlayer(deps, "non-existent-id");

      expect(result.error).toBeNull();
      expect(result.data).toBeNull();
    });

    it("should return player when player exists", async () => {
      const playerId = crypto.randomUUID();
      const player: Player = {
        playerId,
        guesses: [],
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      mockDB.setPlayer(player);

      const result = await getPlayer(deps, playerId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual(player);
    });
  });

  describe("createPlayer", () => {
    it("should create and return a new player", async () => {
      const result = await createPlayer(deps);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.playerId).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      );
      expect(result.data?.guesses).toEqual([]);
      expect(result.data?.createdAt).toBeDefined();
    });

    it("should create players with unique IDs", async () => {
      const result1 = await createPlayer(deps);
      const result2 = await createPlayer(deps);

      expect(result1.data?.playerId).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      );
      expect(result2.data?.playerId).toMatch(
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
      );
      expect(result1.data?.playerId).not.toBe(result2.data?.playerId);
    });
  });

  describe("makeGuess", () => {
    let testPlayer: Player;

    beforeEach(() => {
      testPlayer = {
        playerId: crypto.randomUUID(),
        guesses: [],
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      mockDB.setPlayer(testPlayer);
      mockBinance.setBTCPrice(50000);
    });

    it("should return error when playerId is missing", async () => {
      const result = await makeGuess(deps, "", "up");

      expect(result.error).toBe("Missing playerId parameter");
      expect(result.data).toBeNull();
    });

    it("should return error when direction is missing", async () => {
      const result = await makeGuess(deps, "test-player-id", "" as any);

      expect(result.error).toBe("Missing direction parameter");
      expect(result.data).toBeNull();
    });

    it("should return error when player doesn't exist", async () => {
      const result = await makeGuess(deps, crypto.randomUUID(), "up");

      expect(result.error).toBe("Player doesn't exist");
      expect(result.data).toBeNull();
    });

    it("should create a new pending guess with 'up' direction", async () => {
      const result = await makeGuess(deps, testPlayer.playerId, "up");

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.direction).toBe("up");
      expect(result.data?.status).toBe("pending");
      expect(result.data?.referencePrice).toBe(50000);
      expect(result.data?.guessId).toBeDefined();
      expect(result.data?.createdAt).toBeDefined();
    });

    it("should create a new pending guess with 'down' direction", async () => {
      const result = await makeGuess(deps, testPlayer.playerId, "down");

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.direction).toBe("down");
      expect(result.data?.status).toBe("pending");
      expect(result.data?.referencePrice).toBe(50000);
    });

    it("should return error when player already has a pending guess", async () => {
      // First guess
      await makeGuess(deps, testPlayer.playerId, "up");

      // Second guess should fail
      const result = await makeGuess(deps, testPlayer.playerId, "down");

      expect(result.error).toBe("Player already has a pending guess");
      expect(result.data).toBeNull();
    });

    it("should use current BTC price as reference price", async () => {
      mockBinance.setBTCPrice(45000);

      const result = await makeGuess(deps, testPlayer.playerId, "up");

      expect(result.error).toBeNull();
      expect(result.data?.referencePrice).toBe(45000);
    });
  });

  describe("resolveGuess", () => {
    let testPlayer: Player;
    let pendingGuess: PendingGuess;

    beforeEach(() => {
      pendingGuess = {
        guessId: crypto.randomUUID(),
        createdAt: new Date(Date.now() - 120 * 1000).toISOString(), // 2 minutes ago
        referencePrice: 50000,
        direction: "up",
        status: "pending",
      };

      testPlayer = {
        playerId: crypto.randomUUID(),
        guesses: [pendingGuess],
        createdAt: "2023-01-01T00:00:00.000Z",
      };

      mockDB.setPlayer(testPlayer);
      mockBinance.setBTCPrice(52000);
    });

    it("should return error when playerId is missing", async () => {
      const result = await resolveGuess(deps, "");

      expect(result.error).toBe("Missing playerId parameter");
      expect(result.data).toBeNull();
    });

    it("should return error when player doesn't exist", async () => {
      const result = await resolveGuess(deps, crypto.randomUUID());

      expect(result.error).toBe("Player doesn't exist");
      expect(result.data).toBeNull();
    });

    it("should return error when no pending guess exists", async () => {
      const playerWithoutPending: Player = {
        ...testPlayer,
        guesses: [],
      };
      mockDB.setPlayer(playerWithoutPending);

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBe("No pending guess to resolve");
      expect(result.data).toBeNull();
    });

    it("should return error when pending guess cooldown not passed", async () => {
      const recentPendingGuess: PendingGuess = {
        ...pendingGuess,
        createdAt: new Date(Date.now() - 30 * 1000).toISOString(), // 30 seconds ago
      };

      const playerWithRecentGuess: Player = {
        ...testPlayer,
        guesses: [recentPendingGuess],
      };
      mockDB.setPlayer(playerWithRecentGuess);

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBe("Pending guess cooldown not passed yet");
      expect(result.data).toBeNull();
    });

    it("should resolve 'up' guess as win when price increased", async () => {
      mockBinance.setBTCPrice(52000); // Higher than reference price (50000)

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe("resolved");
      expect(result.data?.outcome).toBe("win");
      expect(result.data?.resolvedPrice).toBe(52000);
      expect(result.data?.resolvedAt).toBeDefined();
    });

    it("should resolve 'up' guess as lose when price decreased", async () => {
      mockBinance.setBTCPrice(48000); // Lower than reference price (50000)

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe("resolved");
      expect(result.data?.outcome).toBe("lose");
      expect(result.data?.resolvedPrice).toBe(48000);
    });

    it("should resolve 'down' guess as win when price decreased", async () => {
      const downPendingGuess: PendingGuess = {
        ...pendingGuess,
        direction: "down",
      };

      const playerWithDownGuess: Player = {
        ...testPlayer,
        guesses: [downPendingGuess],
      };
      mockDB.setPlayer(playerWithDownGuess);
      mockBinance.setBTCPrice(48000); // Lower than reference price (50000)

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data?.outcome).toBe("win");
      expect(result.data?.resolvedPrice).toBe(48000);
    });

    it("should resolve 'down' guess as lose when price increased", async () => {
      const downPendingGuess: PendingGuess = {
        ...pendingGuess,
        direction: "down",
      };

      const playerWithDownGuess: Player = {
        ...testPlayer,
        guesses: [downPendingGuess],
      };
      mockDB.setPlayer(playerWithDownGuess);
      mockBinance.setBTCPrice(52000); // Higher than reference price (50000)

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data?.outcome).toBe("lose");
      expect(result.data?.resolvedPrice).toBe(52000);
    });

    it("should preserve original guess properties in resolved guess", async () => {
      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data?.guessId).toBe(pendingGuess.guessId);
      expect(result.data?.createdAt).toBe(pendingGuess.createdAt);
      expect(result.data?.referencePrice).toBe(pendingGuess.referencePrice);
      expect(result.data?.direction).toBe(pendingGuess.direction);
    });

    it("should handle edge case when price equals reference price for 'up' guess", async () => {
      mockBinance.setBTCPrice(50000); // Equal to reference price

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data?.outcome).toBe("lose"); // Not greater than, so lose
    });

    it("should handle edge case when price equals reference price for 'down' guess", async () => {
      const downPendingGuess: PendingGuess = {
        ...pendingGuess,
        direction: "down",
      };

      const playerWithDownGuess: Player = {
        ...testPlayer,
        guesses: [downPendingGuess],
      };
      mockDB.setPlayer(playerWithDownGuess);
      mockBinance.setBTCPrice(50000); // Equal to reference price

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data?.outcome).toBe("lose"); // Not less than, so lose
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete workflow: create player, make guess, resolve guess", async () => {
      mockBinance.setBTCPrice(50000);

      // Create player
      const createResult = await createPlayer(deps);
      expect(createResult.error).toBeNull();
      const playerId = createResult.data?.playerId!;

      // Make guess
      const guessResult = await makeGuess(deps, playerId, "up");
      expect(guessResult.error).toBeNull();
      expect(guessResult.data?.status).toBe("pending");

      // Wait for cooldown and change price
      const updatedPlayer = await mockDB.getPlayer(playerId);
      updatedPlayer!.guesses[0].createdAt = new Date(
        Date.now() - 120 * 1000,
      ).toISOString();
      mockDB.setPlayer(updatedPlayer!);
      mockBinance.setBTCPrice(55000);

      // Resolve guess
      const resolveResult = await resolveGuess(deps, playerId);
      expect(resolveResult.error).toBeNull();
      expect(resolveResult.data?.status).toBe("resolved");
      expect(resolveResult.data?.outcome).toBe("win");
    });

    it("should allow new guess after previous one is resolved", async () => {
      mockBinance.setBTCPrice(50000);

      const createResult = await createPlayer(deps);
      const playerId = createResult.data?.playerId!;

      // First guess
      await makeGuess(deps, playerId, "up");

      // Update guess to be resolved
      const player = await mockDB.getPlayer(playerId);
      const resolvedGuess: ResolvedGuess = {
        ...(player!.guesses[0] as PendingGuess),
        status: "resolved",
        resolvedAt: new Date().toISOString(),
        resolvedPrice: 52000,
        outcome: "win",
      };
      player!.guesses[0] = resolvedGuess;
      mockDB.setPlayer(player!);

      // Second guess should succeed
      const secondGuessResult = await makeGuess(deps, playerId, "down");
      expect(secondGuessResult.error).toBeNull();
      expect(secondGuessResult.data?.status).toBe("pending");
    });
  });

  describe("Additional edge cases", () => {
    it("should handle empty string playerId", async () => {
      const result = await makeGuess(deps, "", "up");

      expect(result.error).toBe("Missing playerId parameter");
      expect(result.data).toBeNull();
    });

    it("should handle null playerId", async () => {
      const result = await makeGuess(deps, null as any, "up");

      expect(result.error).toBe("Missing playerId parameter");
      expect(result.data).toBeNull();
    });

    it("should handle undefined direction", async () => {
      const testPlayer = {
        playerId: crypto.randomUUID(),
        guesses: [],
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      mockDB.setPlayer(testPlayer);

      const result = await makeGuess(
        deps,
        testPlayer.playerId,
        undefined as any,
      );

      expect(result.error).toBe("Missing direction parameter");
      expect(result.data).toBeNull();
    });

    it("should handle invalid direction", async () => {
      const testPlayer = {
        playerId: crypto.randomUUID(),
        guesses: [],
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      mockDB.setPlayer(testPlayer);

      try {
        await makeGuess(deps, testPlayer.playerId, "invalid" as any);
      } catch (error) {
        // Should throw a validation error from Zod
        expect(error).toBeDefined();
      }
    });

    it("should handle multiple resolved guesses", async () => {
      const resolvedGuess1: ResolvedGuess = {
        guessId: crypto.randomUUID(),
        createdAt: new Date(Date.now() - 300 * 1000).toISOString(),
        referencePrice: 45000,
        direction: "up",
        status: "resolved",
        resolvedAt: new Date(Date.now() - 240 * 1000).toISOString(),
        resolvedPrice: 46000,
        outcome: "win",
      };

      const resolvedGuess2: ResolvedGuess = {
        guessId: crypto.randomUUID(),
        createdAt: new Date(Date.now() - 200 * 1000).toISOString(),
        referencePrice: 46000,
        direction: "down",
        status: "resolved",
        resolvedAt: new Date(Date.now() - 140 * 1000).toISOString(),
        resolvedPrice: 44000,
        outcome: "win",
      };

      const testPlayer = {
        playerId: crypto.randomUUID(),
        guesses: [resolvedGuess1, resolvedGuess2],
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      mockDB.setPlayer(testPlayer);
      mockBinance.setBTCPrice(50000);

      const result = await makeGuess(deps, testPlayer.playerId, "up");

      expect(result.error).toBeNull();
      expect(result.data?.status).toBe("pending");
      expect(result.data?.direction).toBe("up");
    });

    it("should handle exact cooldown time boundary", async () => {
      const exactCooldownTime = new Date(Date.now() - 60 * 1000).toISOString();

      const pendingGuess: PendingGuess = {
        guessId: crypto.randomUUID(),
        createdAt: exactCooldownTime,
        referencePrice: 50000,
        direction: "up",
        status: "pending",
      };

      const testPlayer = {
        playerId: crypto.randomUUID(),
        guesses: [pendingGuess],
        createdAt: "2023-01-01T00:00:00.000Z",
      };
      mockDB.setPlayer(testPlayer);
      mockBinance.setBTCPrice(52000);

      const result = await resolveGuess(deps, testPlayer.playerId);

      expect(result.error).toBeNull();
      expect(result.data?.status).toBe("resolved");
    });
  });
});
