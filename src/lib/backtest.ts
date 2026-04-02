import type {
  Candle,
  MultiBacktestResult,
  StrategyConfig,
  StrategyResult,
  Trade,
  Signal,
} from "./types";

export function runBacktest(
  data: Candle[],
  strategies: StrategyConfig[],
  capital: number,
): MultiBacktestResult {
  const results: StrategyResult[] = strategies.map((stratConfig) => {
    const prices = data.map((c) => c.close);
    const trades: Trade[] = [];
    let currentCapital = capital;
    let positionSize = 0;
    let entryPrice = 0;
    let lastSide: "LONG" | "NONE" = "NONE";
    const equityCurve: { time: string; value: number }[] = [];
    const absoluteEquity: number[] = [];

    // Get signals from the implementation provided in the config
    const signals: Signal[] = stratConfig.implementation.generateSignals(data, stratConfig.params);

    // Execution Engine
    for (let i = 0; i < data.length; i++) {
      const time = data[i].time;
      const price = data[i].close;
      const signal = signals[i];

      // Execution Logic
      if (signal === "BUY" && lastSide !== "LONG") {
        const amount = currentCapital / price;
        if (amount > 0) {
          entryPrice = price;
          positionSize = amount;
          currentCapital = 0;
          lastSide = "LONG";
          trades.push({
            id: `t-${trades.length}`,
            strategyId: stratConfig.id,
            type: "BUY",
            price,
            time,
            amount,
          });
        }
      } else if (signal === "SELL" && lastSide === "LONG") {
        const profit = (price - entryPrice) * positionSize;
        const profitPercent = (price - entryPrice) / entryPrice;
        currentCapital += positionSize * price;
        trades.push({
          id: `t-${trades.length}`,
          strategyId: stratConfig.id,
          type: "SELL",
          price,
          time,
          amount: positionSize,
          profit,
          profitPercent,
        });
        positionSize = 0;
        lastSide = "NONE";
      }

      const totalEquity = currentCapital + positionSize * price;
      absoluteEquity.push(totalEquity);

      // Store relative yield percentage (starts at 0) for chart
      const yieldPercent = ((totalEquity - capital) / capital) * 100;
      equityCurve.push({ time, value: yieldPercent });
    }

    const finalVal = absoluteEquity[absoluteEquity.length - 1];
    const totalReturn = (finalVal - capital) / capital;

    const completedTrades = trades.filter((t) => t.type === "SELL");
    const profitableCount = completedTrades.filter((t) => (t.profit || 0) > 0).length;
    const winRate =
      completedTrades.length > 0
        ? profitableCount / completedTrades.length
        : 0;

    // Max Drawdown based on absolute equity
    let peak = -Infinity;
    let maxDD = 0;
    for (const val of absoluteEquity) {
      if (val > peak) peak = val;
      const dd = (peak - val) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    return {
      strategyId: stratConfig.id,
      strategyName: stratConfig.name,
      totalReturn,
      winRate,
      maxDrawdown: maxDD,
      sharpeRatio: 1.2 + Math.random(), // Keep mock for now
      trades,
      equityCurve,
    };
  });

  return {
    symbol: "BACKTEST",
    results,
  };
}
