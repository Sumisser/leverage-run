import { StrategyConfig } from "@/lib/types";
import { smaStrategy } from "./sma";

/**
 * Centrally manages all strategy definitions and their implementations.
 * These are used by both the UI (StrategySelector) and the Backtest Engine.
 */
export const STRATEGY_CONFIGS: StrategyConfig[] = [
  {
    id: "sma_20_50",
    name: "短期均线交叉 (20/50)",
    params: { short: 20, long: 50 },
    implementation: smaStrategy,
  },
  {
    id: "sma_50_200",
    name: "长期趋势交叉 (50/200)",
    params: { short: 50, long: 200 },
    implementation: smaStrategy,
  },
];

export function getStrategyConfig(id: string): StrategyConfig | undefined {
  return STRATEGY_CONFIGS.find((config) => config.id === id);
}
