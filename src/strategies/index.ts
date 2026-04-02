import { StrategyConfig } from "@/lib/types";
import { smaStrategy } from "./sma";
import { marketGuardStrategy } from "./trend";
import { rsiStrategy } from "./mean_reversion";
import { dualEmaStrategy } from "./dual_ma";
import { turtleStrategy } from "./turtle";

/**
 * Centrally manages all strategy definitions and their implementations.
 * These are used by both the UI (StrategySelector) and the Backtest Engine.
 */
export const STRATEGY_COLORS = [
  '#7C3AED', // Violet (Primary)
  '#0EA5E9', // Sky Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
  '#84CC16', // Lime
  '#6366F1', // Indigo 500
];

/**
 * Centrally manages all strategy definitions and their implementations.
 * These are used by both the UI (StrategySelector) and the Backtest Engine.
 */
export const STRATEGY_CONFIGS: StrategyConfig[] = [
  {
    id: "market-guard-qqq",
    name: "Market Guard (QQQ 择时)",
    params: { signalSymbol: "QQQ", period: 200 },
    implementation: marketGuardStrategy,
    color: STRATEGY_COLORS[0],
  },
  {
    id: "cta-trend-ema",
    name: "CTA 趋势追踪 (50/200 EMA)",
    params: { fastPeriod: 50, slowPeriod: 200 },
    implementation: dualEmaStrategy,
    color: STRATEGY_COLORS[1],
  },
  {
    id: "turtle-breakout",
    name: "Turtle 趋势突破 (20日通道)",
    params: { entryPeriod: 20, exitPeriod: 10 },
    implementation: turtleStrategy,
    color: STRATEGY_COLORS[2],
  },
  {
    id: "alpha-mean-reversion",
    name: "Alpha 均值回归 (RSI)",
    params: { period: 14, overbought: 70, oversold: 30 },
    implementation: rsiStrategy,
    color: STRATEGY_COLORS[3],
  },
  {
    id: "sma_20_50",
    name: "短期波段 (20/50 SMA)",
    params: { short: 20, long: 50 },
    implementation: smaStrategy,
    color: STRATEGY_COLORS[4],
  },
];

export function getStrategyConfig(id: string): StrategyConfig | undefined {
  return STRATEGY_CONFIGS.find((config) => config.id === id);
}
