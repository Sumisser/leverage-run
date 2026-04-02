import { Candle, Signal, BaseStrategy } from "@/lib/types";

/**
 * Trend Following Strategy using a Macro Signal Asset (e.g. QQQ)
 * 
 * Logic:
 * - If Signal Asset (e.g. QQQ) is ABOVE its SMA(200), BUY and HOLD target asset.
 * - If Signal Asset (e.g. QQQ) is BELOW its SMA(200), SELL target asset.
 */
export const marketGuardStrategy: BaseStrategy = {
  id: "market-guard",
  generateSignals: (data: Candle[], params: Record<string, any>, marketContext?: Record<string, Candle[]>): Signal[] => {
    const signals: Signal[] = new Array(data.length).fill(null);
    const signalSymbol = params.signalSymbol || "QQQ";
    const period = params.period || 200;

    if (!marketContext || !marketContext[signalSymbol]) {
      return signals;
    }

    const signalData = marketContext[signalSymbol];
    const signalPrices = signalData.map(c => c.close);
    const smas = calculateSMA(signalPrices, period);
    
    // Create status map: Date -> Position Mode (Bull/Bear)
    const bullModeMap = new Map<string, boolean>();
    for (let i = 0; i < signalData.length; i++) {
       if (!isNaN(smas[i])) {
         bullModeMap.set(signalData[i].time, signalData[i].close > smas[i]);
       }
    }

    let isCurrentlyLong = false;

    for (let i = 0; i < data.length; i++) {
      // CRITICAL FIX: Use the signal from the PREVIOUS trading day to decide today's position
      // This ensures we are already out of the market on the day a major drop happens
      // (assuming the signal crossed on the prior day's close)
      if (i === 0) continue; 
      
      const prevTime = data[i-1].time;
      const wasBullish = bullModeMap.get(prevTime);

      // If we don't have signal data for the previous day, we play it safe and exit
      if (wasBullish === undefined) {
        if (isCurrentlyLong) {
          signals[i] = "SELL";
          isCurrentlyLong = false;
        }
        continue;
      }

      if (wasBullish && !isCurrentlyLong) {
        signals[i] = "BUY";
        isCurrentlyLong = true;
      } else if (!wasBullish && isCurrentlyLong) {
        signals[i] = "SELL";
        isCurrentlyLong = false;
      }
    }

    return signals;
  }
};

function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      sma.push(sum / period);
    }
  }
  return sma;
}
