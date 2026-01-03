import { getBTCPrice } from "@/third-party/binance";
import { response } from "./utils";

export const handler = async () => {
  return response(200, { data: await getBTCPrice() });
};
