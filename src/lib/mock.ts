import { addDays, format, startOfYear } from "date-fns";
import type { Candle } from "./types";

export function generateMockData(
  count: number = 500,
  startPrice: number = 100,
): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = startPrice;
  let currentDate = startOfYear(new Date());

  for (let i = 0; i < count; i++) {
    const volatility = 0.02; // 2% daily volatility
    const trend = 0.0005; // bullish trend
    const change = currentPrice * (volatility * (Math.random() - 0.5) + trend);
    const open = currentPrice;
    const close = currentPrice + change;

    // Simulate high and low
    const maxVar = Math.abs(change) * 0.5;
    const high = Math.max(open, close) + Math.random() * maxVar;
    const low = Math.min(open, close) - Math.random() * maxVar;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    candles.push({
      time: format(currentDate, "yyyy-MM-dd"),
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
    currentDate = addDays(currentDate, 1);
  }

  return candles;
}
