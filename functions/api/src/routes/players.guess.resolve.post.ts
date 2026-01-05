import type { LambdaFunctionURLHandler } from "aws-lambda";
import { resolveGuess } from "@/services/players";
import { deps, response } from "./utils";

export const handler: LambdaFunctionURLHandler = async (event) => {
  const { playerId } = event.pathParameters || {};

  const result = await resolveGuess(deps, playerId as string);

  if (result.error) return response(400, { error: result.error });

  return response(200, { data: result.data });
};
