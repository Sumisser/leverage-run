import { Candle, Signal, BaseStrategy } from "@/lib/types";

/**
 * RSI Mean Reversion Strategy
 * 
 * Logic:
 * - Buy when RSI(14) < 30 (Oversold)
 * - Sell when RSI(14) > 70 (Overbought)
 */
export const rsiStrategy: BaseStrategy = {
  id: "rsi-mean-reversion",
  generateSignals: (data: Candle[], params: Record<string, any>): Signal[] => {
    const signals: Signal[] = new Array(data.length).fill(null);
    const period = params.period || 14;
    const overbought = params.overbought || 70;
    const oversold = params.oversold || 30;

    if (data.length < period + 1) return signals;

    const rsi = calculateRSI(data.map(c => c.close), period);
    let inPosition = false;

    for (let i = 1; i < data.length; i++) {
      const currentRsi = rsi[i];
      if (isNaN(currentRsi)) continue;

      if (currentRsi < oversold && !inPosition) {
        signals[i] = "BUY";
        inPosition = true;
      } else if (currentRsi > overbought && inPosition) {
        signals[i] = "SELL";
        inPosition = false;
      }
    }

    return signals;
  }
};

function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = new Array(prices.length).fill(NaN);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (i <= period) {
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);

      if (i === period) {
        let avgGain = gains / period;
        let avgLoss = losses / period;
        rsi[i] = 100 - (100 / (1 + avgGain / avgLoss));
      }
      continue;
    }

    const currentGain = diff > 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    // Wilder's Smoothing
    const lastAvgGain = (rsi[i - 1] === 0 || isNaN(rsi[i - 1])) ? 0 : (100 - (100 / (1 + (gains / losses)))) * (period - 1); // This is not quite right, let's use simpler EMA approach
    // Standard RSI formula
    // Let's use simple SMA for the first one then EMA
  }
  
  // Re-implementing correctly
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }

  avgGain /= period;
  avgLoss /= period;
  rsi[period] = 100 - (100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsi[i] = 100 - (100 / (1 + rs));
  }

  return rsi;
}
