const TICKER_API_URL =
  "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT";

export async function getBTCPrice(): Promise<number> {
  const response = await fetch(TICKER_API_URL);
  if (!response.ok) throw new Error("Failed to fetch BTC price from Binance");

  const data = (await response.json()) as { price: string };

  return parseFloat(data.price);
}
