export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SignalType = "BUY" | "SELL";

export type Signal = "BUY" | "SELL" | null;

export interface BaseStrategy {
  id: string;
  generateSignals: (
    data: Candle[], 
    params: Record<string, any>,
    marketContext?: Record<string, Candle[]>
  ) => Signal[];
}

export interface Trade {
  id: string;
  strategyId: string;
  type: SignalType;
  price: number;
  time: string;
  amount: number;
  profit?: number;
  profitPercent?: number;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  params: Record<string, any>;
  color: string;
}

export interface StrategyConfig extends StrategyDefinition {
  implementation: BaseStrategy;
}

export interface StrategyResult {
  strategyId: string;
  strategyName: string;
  color: string;
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
  equityCurve: { time: string; value: number }[];
}

export interface MultiBacktestResult {
  symbol: string;
  results: StrategyResult[];
}
