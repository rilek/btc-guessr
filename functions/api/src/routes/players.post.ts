import type { LambdaFunctionURLHandler } from "aws-lambda";
import * as db from "@/db";
import { createPlayer } from "@/services/players";
import { response } from "./utils";

export const handler: LambdaFunctionURLHandler = async () => {
  const playerResult = await createPlayer(db);

  if (playerResult.error) return response(400, { error: playerResult.error });

  return response(200, {
    data: playerResult.data,
  });
};
