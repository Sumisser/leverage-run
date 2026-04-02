"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  Settings2,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { runBacktest } from "@/lib/backtest";
import { generateMockData } from "@/lib/mock";
import {
  Candle,
  MultiBacktestResult,
  type StrategyDefinition,
  StrategyResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { PriceChart } from "./PriceChart";
import { StrategySelector } from "./StrategySelector";

const ASSETS = [
  { id: "BTC", name: "BTC/USDT" },
  { id: "ETH", name: "ETH/USDT" },
  { id: "AAPL", name: "Apple Inc." },
  { id: "NVDA", name: "NVIDIA" },
];

const AVAILABLE_STRATEGIES: StrategyDefinition[] = [
  {
    id: "sma_20_50",
    name: "均线交叉 (20/50)",
    params: { short: 20, long: 50 },
  },
  {
    id: "sma_50_200",
    name: "长线交叉 (50/200)",
    params: { short: 50, long: 200 },
  },
];

export function BacktestDashboard() {
  const [mounted, setMounted] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([
    "sma_20_50",
  ]);
  const capital = 100;

  useEffect(() => {
    setMounted(true);
  }, []);

  const mockData = useMemo(() => {
    if (!mounted) return [];
    const startPrice =
      selectedAsset.id === "BTC"
        ? 65000
        : selectedAsset.id === "AAPL"
          ? 180
          : 2500;
    return generateMockData(500, startPrice);
  }, [selectedAsset.id, mounted]);

  const selectedStrats = useMemo(
    () =>
      AVAILABLE_STRATEGIES.filter((s) => selectedStrategyIds.includes(s.id)),
    [selectedStrategyIds],
  );

  const multiResult = useMemo(() => {
    if (!mounted || mockData.length === 0)
      return { symbol: "LOADING", results: [] };
    return runBacktest(mockData, selectedStrats, capital);
  }, [mockData, selectedStrats, capital, mounted]);

  const toggleStrategy = (id: string) => {
    setSelectedStrategyIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id],
    );
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8 font-sans items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4" />
        <div className="text-slate-400 font-bold animate-pulse">
          系统引擎启动中...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8 font-sans bg-slate-50/50">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1a1523] italic underline decoration-violet-500 decoration-4 underline-offset-8 uppercase tracking-tighter">
            LEVERAGE RUN
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3 flex items-center gap-2">
            <Activity className="h-3 w-3 text-violet-500" />
            Precision Alpha Backtesting Platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              System Status
            </span>
            <span className="text-xs font-bold text-emerald-500 mt-1 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Engine Active
            </span>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        {/* Main Chart Card */}
        <Card className="overflow-hidden border-white/60 shadow-2xl shadow-violet-500/5 bg-white">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <select
                  value={selectedAsset.id}
                  onChange={(e) => {
                    const asset = ASSETS.find((a) => a.id === e.target.value);
                    if (asset) setSelectedAsset(asset);
                  }}
                  className="appearance-none bg-white border border-slate-200 pl-4 pr-10 py-2 rounded-xl text-sm font-black text-slate-700 cursor-pointer hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all shadow-sm"
                >
                  {ASSETS.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-violet-500" />
              </div>
              <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
              <div className="hidden lg:flex items-center gap-2">
                <div className="px-3 py-1 bg-violet-100 rounded-full text-[10px] font-black text-violet-600 uppercase tracking-widest">
                  Relative Yield (0% Base)
                </div>
              </div>
            </div>

            <Settings2 className="h-4 w-4 text-slate-400 hover:text-violet-500 cursor-pointer transition-colors" />
          </div>

          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
              <div className="lg:col-span-10 p-6 relative">
                <div className="absolute top-8 left-8 z-10 pointer-events-none">
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {selectedAsset.name}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                    Cumulative Return (%)
                  </p>
                </div>
                <PriceChart
                  data={mockData}
                  results={multiResult.results}
                  height={500}
                />
              </div>

              <div className="lg:col-span-2 border-l border-slate-100 bg-slate-50/30 p-4">
                <div className="flex items-center gap-2 mb-4 px-1">
                  <LayoutDashboard className="h-3.5 w-3.5 text-violet-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Strategies
                  </span>
                </div>
                <StrategySelector
                  strategies={AVAILABLE_STRATEGIES}
                  selectedIds={selectedStrategyIds}
                  onToggle={toggleStrategy}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking Leaderboard */}
        <Card className="border-white/60 shadow-xl shadow-violet-500/5 bg-white overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1a1523]">
                策略绩效排行
              </h3>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Performance Leaderboard
            </div>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      排名
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      策略名称
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      总收益 (ROI)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      胜率
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      最大回撤
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      夏普比率
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...multiResult.results]
                    .sort((a, b) => b.totalReturn - a.totalReturn)
                    .map((res, index) => (
                      <tr
                        key={res.strategyId}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-6 font-black text-slate-300">
                          {index === 0 ? (
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                              <Trophy className="h-3 w-3 text-amber-600" />
                            </div>
                          ) : (
                            <span className="ml-1 text-slate-400">
                              #{index + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: [
                                  "#7c3aed",
                                  "#ec4899",
                                  "#8b5cf6",
                                  "#f59e0b",
                                  "#10b981",
                                ][index % 5],
                              }}
                            />
                            <span className="font-bold text-slate-700">
                              {res.strategyName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-right">
                          <span
                            className={cn(
                              "text-base font-black flex items-center justify-end gap-1",
                              res.totalReturn >= 0
                                ? "text-emerald-500"
                                : "text-rose-500",
                            )}
                          >
                            {res.totalReturn >= 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {(res.totalReturn * 100).toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-6 text-right font-bold text-slate-600">
                          {(res.winRate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-6 text-right font-bold text-rose-400">
                          {(res.maxDrawdown * 100).toFixed(2)}%
                        </td>
                        <td className="px-6 py-6 text-right">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-xs uppercase">
                            <Activity className="h-3 w-3 text-violet-500" />
                            {res.sharpeRatio.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
