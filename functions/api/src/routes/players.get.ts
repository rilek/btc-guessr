import type { LambdaFunctionURLHandler } from "aws-lambda";
import { getPlayer } from "@/services/players";
import { deps, response } from "./utils";

export const handler: LambdaFunctionURLHandler = async (event) => {
  const { playerId } = event.pathParameters || {};
  const guessesResult = await getPlayer(deps, playerId as string);

  if (guessesResult.error) return response(400, { error: guessesResult.error });

  return response(200, {
    data: guessesResult.data,
  });
};
