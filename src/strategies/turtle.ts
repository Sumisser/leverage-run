import { Candle, Signal, BaseStrategy } from "@/lib/types";

/**
 * Turtle Trading Style Breakout Strategy
 * 
 * Logic:
 * - Buy when price breaks HIGHER than the max of last N days
 * - Sell when price breaks LOWER than the min of last M days
 */
export const turtleStrategy: BaseStrategy = {
  id: "turtle-breakout",
  generateSignals: (data: Candle[], params: Record<string, any>): Signal[] => {
    const signals: Signal[] = new Array(data.length).fill(null);
    const entryPeriod = params.entryPeriod || 20;
    const exitPeriod = params.exitPeriod || 10;

    if (data.length < entryPeriod) return signals;

    let inPosition = false;

    for (let i = entryPeriod; i < data.length; i++) {
      const sliceEntry = data.slice(i - entryPeriod, i);
      const high = Math.max(...sliceEntry.map(c => c.close));
      
      const sliceExit = data.slice(i - exitPeriod, i);
      const low = Math.min(...sliceExit.map(c => c.close));

      const currentPrice = data[i].close;

      if (currentPrice > high && !inPosition) {
        signals[i] = "BUY";
        inPosition = true;
      } else if (currentPrice < low && inPosition) {
        signals[i] = "SELL";
        inPosition = false;
      }
    }

    return signals;
  }
};
