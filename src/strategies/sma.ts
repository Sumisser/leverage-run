import { Candle, Signal, BaseStrategy } from "@/lib/types";

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

export const smaStrategy: BaseStrategy = {
  id: "sma",
  generateSignals: (data: Candle[], params: Record<string, any>): Signal[] => {
    const prices = data.map(c => c.close);
    const shortLength = params.short || 20;
    const longLength = params.long || 50;

    const shortSma = calculateSMA(prices, shortLength);
    const longSma = calculateSMA(prices, longLength);
    const signals: Signal[] = new Array(data.length).fill(null);

    for (let i = 1; i < data.length; i++) {
      if (isNaN(shortSma[i]) || isNaN(longSma[i]) || isNaN(shortSma[i-1]) || isNaN(longSma[i-1])) {
        continue;
      }

      // Golden Cross: Short cross above Long
      if (shortSma[i-1] <= longSma[i-1] && shortSma[i] > longSma[i]) {
        signals[i] = "BUY";
      } 
      // Death Cross: Short cross below Long
      else if (shortSma[i-1] >= longSma[i-1] && shortSma[i] < longSma[i]) {
        signals[i] = "SELL";
      }
    }
    return signals;
  }
};
