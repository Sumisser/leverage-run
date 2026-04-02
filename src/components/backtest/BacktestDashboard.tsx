'use client';

import { useState, useMemo, useEffect } from "react";
import { runBacktest } from "@/lib/backtest";
import { Candle, StrategyResult, StrategyConfig } from "@/lib/types";
import { PriceChart } from "./PriceChart";
import { StrategySelector } from "./StrategySelector";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/Logo";
import { STRATEGY_CONFIGS } from "@/strategies";
import {
  Trophy,
  TrendingUp,
  Activity,
  TrendingDown,
  Target,
  Settings2,
  ChevronDown,
  Info,
  Scale,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format, parseISO, subMonths, subYears, startOfYear } from "date-fns";
import { zhCN } from "date-fns/locale";

interface AssetInfo {
  name: string;
  code: string;
  fileName: string;
}

export function BacktestDashboard() {
  const [mounted, setMounted] = useState(false);
  const [assetsList, setAssetsList] = useState<AssetInfo[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo | null>(null);
  const [stockData, setStockData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>([
    STRATEGY_CONFIGS[0].id,
  ]);
  
  // Date Range Filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const capital = 10000;

  useEffect(() => {
    setMounted(true);
    fetch('/data/index.json')
      .then(res => res.json())
      .then(data => {
        setAssetsList(data);
        if (data.length > 0) {
          setSelectedAsset(data[0]);
        }
      })
      .catch(err => console.error("Failed to load assets index:", err));
  }, []);

  useEffect(() => {
    if (!selectedAsset) return;
    setLoading(true);
    fetch(`/data/${selectedAsset.fileName}`)
      .then(res => res.json())
      .then(result => {
        setStockData(result.data);
        if (result.data.length > 0) {
          setStartDate(result.data[0].time);
          setEndDate(result.data[result.data.length - 1].time);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load asset data:", err);
        setLoading(false);
      });
  }, [selectedAsset]);

  // Apply Date Filtering
  const filteredData = useMemo(() => {
    if (!startDate || !endDate) return stockData;
    return stockData.filter(c => c.time >= startDate && c.time <= endDate);
  }, [stockData, startDate, endDate]);

  // Compute Benchmark (Buy & Hold) Stats based on filtered range
  const benchmarkResult = useMemo(() => {
    if (filteredData.length < 2) return null;
    const first = filteredData[0].close;
    const last = filteredData[filteredData.length - 1].close;
    const totalReturn = last / first - 1;

    let peak = -Infinity;
    let maxDd = 0;
    for (const c of filteredData) {
      if (c.close > peak) peak = c.close;
      const dd = (peak - c.close) / peak;
      if (dd > maxDd) maxDd = dd;
    }

    return {
      strategyId: "benchmark",
      strategyName: "买入持有 (Benchmark)",
      totalReturn,
      winRate: 1, 
      maxDrawdown: maxDd,
      sharpeRatio: 0,
      trades: [],
      equityCurve: [], 
    };
  }, [filteredData]);

  const selectedStrats = useMemo(
    () =>
      STRATEGY_CONFIGS.filter((s) => selectedStrategyIds.includes(s.id)),
    [selectedStrategyIds],
  );

  const multiResult = useMemo(() => {
    if (!mounted || filteredData.length === 0)
      return { symbol: selectedAsset?.code || "LOADING", results: [] };
    return runBacktest(filteredData, selectedStrats, capital);
  }, [filteredData, selectedStrats, capital, mounted, selectedAsset]);

  // Combined Results with Alpha
  const leaderboardData = useMemo(() => {
    if (!benchmarkResult) return [];
    const resultsWithAlpha = multiResult.results.map((res: StrategyResult) => ({
      ...res,
      alpha: res.totalReturn - benchmarkResult.totalReturn,
      winRate: (res.winRate * 100).toFixed(1) + "%",
      tradeCount: res.trades.length,
    }));

    // Add benchmark row
    const benchmarkRow = {
      ...benchmarkResult,
      alpha: 0,
      winRate: "--",
      tradeCount: 1,
      isBenchmark: true,
    };

    return [...resultsWithAlpha, benchmarkRow].sort(
      (a, b) => b.totalReturn - a.totalReturn,
    );
  }, [multiResult.results, benchmarkResult]);

  const toggleStrategy = (id: string) => {
    setSelectedStrategyIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((sid: string) => sid !== id) : [...prev, id],
    );
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF9F3] text-[#1A1523]">
      <header className="px-6 md:px-12 py-3 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo className="hover:opacity-80 transition-opacity cursor-pointer" />
            <nav className="hidden md:flex items-center gap-8">
              <span className="text-xs font-bold opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
                回测实验室
              </span>
              <span className="text-xs font-bold opacity-50 hover:opacity-100 cursor-pointer transition-opacity">
                实时信号流
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 bg-primary rounded-full text-white text-[11px] font-black shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-all cursor-pointer uppercase tracking-widest">
              保存当前配置
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-8 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-3xl heading-serif mb-2 leading-tight">
              策略实验室{" "}
              <span className="italic text-primary">Alpha Edition</span>
            </h2>
            <p className="text-sm opacity-60 font-medium max-w-lg">
              对比多种量化战术与基准资产的表现，寻找稳定的 Alpha 超额收益。
            </p>
          </div>
          <div className="text-[11px] font-black uppercase tracking-widest text-[#1A1523]/40 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            真实市场数据已加载
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-9">
            <Card className="bg-white border-slate-200 card-shadow h-full flex flex-col rounded-3xl overflow-hidden relative">
              {loading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">同步云端数据...</span>
                  </div>
                </div>
              )}
              
              <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <select
                      value={selectedAsset?.code || ""}
                      onChange={(e) => {
                        const asset = assetsList.find(
                          (a) => a.code === e.target.value,
                        );
                        if (asset) setSelectedAsset(asset);
                      }}
                      className="appearance-none bg-transparent font-black text-xs text-slate-800 pr-6 cursor-pointer focus:outline-none"
                    >
                      {assetsList.map((asset) => (
                        <option key={asset.code} value={asset.code}>
                          {asset.name} ({asset.code})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  </div>
                  <div className="h-3 w-[1px] bg-slate-300" />
                  
                  {/* Quick Range Presets */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
                    {[
                      { label: "1M", getValue: () => ({ from: subMonths(new Date(), 1), to: new Date() }) },
                      { label: "1Y", getValue: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
                      { label: "5Y", getValue: () => ({ from: subYears(new Date(), 5), to: new Date() }) },
                      { label: "YTD", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
                      { label: "ALL", getValue: () => ({ from: stockData.length > 0 ? parseISO(stockData[0].time) : new Date(), to: stockData.length > 0 ? parseISO(stockData[stockData.length - 1].time) : new Date() }) },
                    ].map((p) => {
                      const isActive = p.label === "ALL" && startDate === stockData[0]?.time && endDate === stockData[stockData.length - 1]?.time;
                      return (
                        <button
                          key={p.label}
                          onClick={() => {
                            const range = p.getValue();
                            setStartDate(format(range.from, "yyyy-MM-dd"));
                            setEndDate(format(range.to, "yyyy-MM-dd"));
                          }}
                          className={cn(
                            "px-2 py-1 text-[9px] font-black rounded-lg transition-all uppercase tracking-tight",
                            isActive 
                              ? "bg-white text-primary shadow-sm border border-slate-200" 
                              : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-3 w-[1px] bg-slate-300" />
                  
                  {/* Official Shadcn Date Picker */}
                  <div className="flex items-center gap-2 scale-[0.85] origin-left">
                    <DatePickerWithRange
                      date={{
                        from: startDate ? parseISO(startDate) : undefined,
                        to: endDate ? parseISO(endDate) : undefined,
                      }}
                      minDate={stockData.length > 0 ? parseISO(stockData[0].time) : undefined}
                      maxDate={stockData.length > 0 ? parseISO(stockData[stockData.length - 1].time) : undefined}
                      setDate={(range) => {
                        if (range?.from) setStartDate(format(range.from, "yyyy-MM-dd"));
                        if (range?.to) setEndDate(format(range.to, "yyyy-MM-dd"));
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                    <TrendingUp className="h-3 w-3" />
                    数据源: EFinance
                  </div>
                  <Settings2 className="h-4 w-4 text-slate-300 hover:text-primary cursor-pointer transition-colors" />
                </div>
              </div>

              <CardContent className="p-0 flex-1 relative min-h-[480px]">
                <div className="p-6 h-full flex flex-col justify-center">
                  <PriceChart
                    data={filteredData}
                    results={multiResult.results}
                    height={440}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 card-shadow h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-widest text-[#1A1523]/60">
                      活跃策略层
                    </span>
                  </div>
                  <Info className="h-3.5 w-3.5 text-slate-300 cursor-help" />
                </div>

                <div className="space-y-3">
                  <StrategySelector
                    strategies={STRATEGY_CONFIGS}
                    selectedIds={selectedStrategyIds}
                    onToggle={toggleStrategy}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] leading-tight text-slate-400 font-bold uppercase tracking-widest text-center">
                  量化算法提取引擎
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="text-lg heading-serif">真实市场回测绩效排行</h3>
            </div>
            <div className="text-[10px] items-center text-slate-400 font-bold uppercase tracking-widest flex gap-4">
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 正向
                Alpha
              </span>
              <span className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 负向
                Alpha
              </span>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-200 rounded-3xl bg-white card-shadow">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    排名
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    方案名称
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    累计收益 (ROI)
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Alpha 超额收益
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    交易胜率
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    成交笔数
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    历史最大回撤
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboardData.map((res: any, index: number) => (
                  <tr
                    key={res.strategyId}
                    className={cn(
                      "group transition-colors",
                      res.isBenchmark
                        ? "bg-slate-50/50 divide-slate-200"
                        : "hover:bg-[#FDF9F3]/40",
                    )}
                  >
                    <td className="px-6 py-5">
                      {res.isBenchmark ? (
                        <Scale className="h-4 w-4 text-slate-400" />
                      ) : (
                        <span className="text-xl heading-serif font-medium opacity-20 group-hover:opacity-100 transition-opacity">
                          #{index + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center border",
                            res.isBenchmark
                              ? "bg-slate-100 border-slate-200"
                              : "bg-slate-50 border-slate-100",
                          )}
                        >
                          <Target
                            className={cn(
                              "h-4 w-4",
                              res.isBenchmark
                                ? "text-slate-400"
                                : "text-primary",
                            )}
                          />
                        </div>
                        <span
                          className={cn(
                            "font-bold text-sm tracking-tight",
                            res.isBenchmark
                              ? "text-slate-500 italic"
                              : "text-slate-800",
                          )}
                        >
                          {res.strategyName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span
                        className={cn(
                          "text-lg heading-serif font-black",
                          res.totalReturn >= 0
                            ? "text-emerald-600"
                            : "text-rose-600",
                        )}
                      >
                        {(res.totalReturn * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {res.isBenchmark ? (
                        <span className="text-[10px] font-black text-slate-300 uppercase">
                          Baseline
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "text-sm font-black",
                            res.alpha >= 0
                              ? "text-emerald-500"
                              : "text-rose-500",
                          )}
                        >
                          {res.alpha >= 0 ? "+" : ""}
                          {(res.alpha * 100).toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-xs text-slate-600">
                      {res.winRate}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-xs text-slate-600">
                      {res.tradeCount} 笔
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-rose-500/80">
                          {(res.maxDrawdown * 100).toFixed(1)}%
                        </span>
                        <div className="w-16 h-1 bg-rose-50 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full bg-rose-500/30"
                            style={{
                              width: `${Math.min(res.maxDrawdown * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
