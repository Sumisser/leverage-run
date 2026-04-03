import { BaseStrategy, Candle, Signal } from "@/lib/types";

export const benchmarkStrategy: BaseStrategy = {
  id: "benchmark",
  generateSignals: (data: Candle[]): Signal[] => {
    if (data.length === 0) return [];
    const signals: Signal[] = Array(data.length).fill(null);
    signals[0] = "BUY"; // On the first day, buy and hold
    return signals;
  },
};
