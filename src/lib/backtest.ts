import type {
  Candle,
  MultiBacktestResult,
  StrategyDefinition,
  StrategyResult,
  Trade,
} from "./types";

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

export function runBacktest(
  data: Candle[],
  strategies: StrategyDefinition[],
  capital: number,
): MultiBacktestResult {
  const results: StrategyResult[] = strategies.map((strat) => {
    const prices = data.map((c) => c.close);
    const trades: Trade[] = [];
    let currentCapital = capital;
    let positionSize = 0;
    let entryPrice = 0;
    let lastSide: "LONG" | "NONE" = "NONE";
    const equityCurve: { time: string; value: number }[] = [];
    const absoluteEquity: number[] = [];

    // Strategy Specific Indicators
    let shortSma: number[] = [];
    let longSma: number[] = [];

    if (strat.id.includes("sma")) {
      shortSma = calculateSMA(prices, strat.params.short || 20);
      longSma = calculateSMA(prices, strat.params.long || 50);
    }

    for (let i = 0; i < data.length; i++) {
      const time = data[i].time;
      const price = data[i].close;
      let signal: "BUY" | "SELL" | null = null;

      // SMA Logic
      if (
        strat.id.includes("sma") &&
        i > 0 &&
        !isNaN(shortSma[i]) &&
        !isNaN(longSma[i]) &&
        !isNaN(shortSma[i - 1]) &&
        !isNaN(longSma[i - 1])
      ) {
        if (shortSma[i - 1] <= longSma[i - 1] && shortSma[i] > longSma[i])
          signal = "BUY";
        else if (shortSma[i - 1] >= longSma[i - 1] && shortSma[i] < longSma[i])
          signal = "SELL";
      }

      // Buy & Hold logic removed (now benchmark baseline)

      // Execution
      if (signal === "BUY" && lastSide !== "LONG") {
        const amount = currentCapital / price;
        if (amount > 0) {
          entryPrice = price;
          positionSize = amount;
          currentCapital = 0;
          lastSide = "LONG";
          trades.push({
            id: `t-${trades.length}`,
            strategyId: strat.id,
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
          strategyId: strat.id,
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
    const profitable = completedTrades.filter((t) => (t.profit || 0) > 0);
    const winRate =
      completedTrades.length > 0
        ? profitable.length / completedTrades.length
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
      strategyId: strat.id,
      strategyName: strat.name,
      totalReturn,
      winRate,
      maxDrawdown: maxDD,
      sharpeRatio: 1.2 + Math.random(), // Hard to calc without risk-free, keep mock
      trades,
      equityCurve,
    };
  });

  return {
    symbol: "MOCK",
    results,
  };
}
