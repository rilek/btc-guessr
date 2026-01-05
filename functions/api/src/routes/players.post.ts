import type { LambdaFunctionURLHandler } from "aws-lambda";
import { createPlayer } from "@/services/players";
import { deps, response } from "./utils";

export const handler: LambdaFunctionURLHandler = async () => {
  const playerResult = await createPlayer(deps);

  if (playerResult.error) return response(400, { error: playerResult.error });

  return response(200, {
    data: playerResult.data,
  });
};
