import type { LambdaFunctionURLHandler } from "aws-lambda";
import * as db from "@/db";
import { getPlayer } from "@/services/players";
import { response } from "./utils";

export const handler: LambdaFunctionURLHandler = async (event) => {
  const { playerId } = event.pathParameters || {};
  const guessesResult = await getPlayer(db, playerId as string);

  if (guessesResult.error) return response(400, { error: guessesResult.error });

  return response(200, {
    data: guessesResult.data,
  });
};
