import type { LambdaFunctionURLHandler } from "aws-lambda";
import * as db from "@/db";
import { resolveGuess } from "@/services/players";
import { response } from "./utils";

export const handler: LambdaFunctionURLHandler = async (event) => {
  const { playerId } = event.pathParameters || {};

  const result = await resolveGuess(db, playerId as string);

  if (result.error) return response(400, { error: result.error });

  return response(200, { data: result.data });
};
