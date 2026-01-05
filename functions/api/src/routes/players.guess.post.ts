import type { LambdaFunctionURLHandler } from "aws-lambda";
import { makeGuess } from "@/services/players";
import { deps, response } from "./utils";

export const handler: LambdaFunctionURLHandler = async (event) => {
  const playerId = event.pathParameters?.playerId as string;
  const { direction } = event.body ? JSON.parse(event.body) : {};
  const guesses = await makeGuess(deps, playerId, direction);

  if (guesses.error) return response(400, { error: guesses.error });

  return response(200, { data: guesses.data });
};
