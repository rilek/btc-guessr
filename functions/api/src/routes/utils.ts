import type { Deps } from "@/services/utils";
import * as db from "../db";
import * as binance from "../third-party/binance";

export const deps: Deps = { db, binance };

export function response(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  };
}
