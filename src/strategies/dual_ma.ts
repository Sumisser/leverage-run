import { Candle, Signal, BaseStrategy } from "@/lib/types";

/**
 * Dual EMA Crossover Strategy
 * 
 * Logic:
 * - Buy when Fast EMA crosses above Slow EMA
 * - Sell when Fast EMA crosses below Slow EMA
 */
export const dualEmaStrategy: BaseStrategy = {
  id: "dual-ema-cross",
  generateSignals: (data: Candle[], params: Record<string, any>): Signal[] => {
    const signals: Signal[] = new Array(data.length).fill(null);
    const fastPeriod = params.fastPeriod || 50;
    const slowPeriod = params.slowPeriod || 200;

    if (data.length < slowPeriod) return signals;

    const prices = data.map(c => c.close);
    const fastEma = calculateEMA(prices, fastPeriod);
    const slowEma = calculateEMA(prices, slowPeriod);
    
    let inPosition = false;

    for (let i = 1; i < data.length; i++) {
      if (isNaN(fastEma[i]) || isNaN(slowEma[i])) continue;

      const crossedAbove = fastEma[i] > slowEma[i] && fastEma[i - 1] <= slowEma[i - 1];
      const crossedBelow = fastEma[i] < slowEma[i] && fastEma[i - 1] >= slowEma[i - 1];

      if (crossedAbove && !inPosition) {
        signals[i] = "BUY";
        inPosition = true;
      } else if (crossedBelow && inPosition) {
        signals[i] = "SELL";
        inPosition = false;
      }
    }

    return signals;
  }
};

function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = new Array(data.length).fill(NaN);
  const multiplier = 2 / (period + 1);

  // Initial SMA for the first period
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}
