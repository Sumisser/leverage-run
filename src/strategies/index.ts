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

export const STRATEGY_COLORS = [
  '#7C3AED', // Violet (Primary)
  '#4F46E5', // Indigo
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
  '#84CC16', // Lime
  '#6366F1', // Indigo 500
];

export function getStrategyConfig(id: string): StrategyConfig | undefined {
  return STRATEGY_CONFIGS.find((config) => config.id === id);
}

export function getStrategyColor(index: number): string {
  return STRATEGY_COLORS[index % STRATEGY_COLORS.length];
}
