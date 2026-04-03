"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { runBacktest } from "@/lib/backtest";
import { Candle, StrategyResult, StrategyConfig } from "@/lib/types";
import { PriceChart } from "./PriceChart";
import { StrategySelector } from "./StrategySelector";
import { StrategyModal } from "./StrategyModal";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/Logo";
import { STRATEGY_CONFIGS, BENCHMARK_CONFIG } from "@/strategies";
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
  RefreshCw,
  Plus,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [assetsList, setAssetsList] = useState<AssetInfo[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo | null>(null);
  const [stockData, setStockData] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStrategies, setActiveStrategies] = useState<StrategyConfig[]>([
    BENCHMARK_CONFIG,
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Market context for multi-asset strategies (e.g. QQQ as signal)
  const [marketContext, setMarketContext] = useState<Record<string, Candle[]>>(
    {},
  );

  // SMA Periods Multi-selection
  const [activeSmas, setActiveSmas] = useState<number[]>([]);

  // Date Range Filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const capital = 10000;

  useEffect(() => {
    setMounted(true);
    fetch("/data/index.json")
      .then((res) => res.json())
      .then((data) => {
        setAssetsList(data);
        if (data.length > 0) {
          setSelectedAsset(data[0]);

          // Pre-load QQQ for strategies that need it
          const qqq = data.find((a: AssetInfo) => a.code === "QQQ");
          if (qqq) {
            fetch(`/data/${qqq.fileName}`)
              .then((res) => res.json())
              .then((result) => {
                setMarketContext((prev) => ({ ...prev, QQQ: result.data }));
              })
              .catch((err) =>
                console.error("Failed to load QQQ for market context:", err),
              );
          }
        }
      })
      .catch((err) => console.error("Failed to load assets index:", err));
  }, []);

  useEffect(() => {
    if (!selectedAsset) return;
    setLoading(true);
    fetch(`/data/${selectedAsset.fileName}`)
      .then((res) => res.json())
      .then((result) => {
        setStockData(result.data);
        if (result.data.length > 0) {
          // Initialize range to full history of the selected asset
          setStartDate(result.data[0].time);
          setEndDate(result.data[result.data.length - 1].time);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load asset data:", err);
        setLoading(false);
      });
  }, [selectedAsset]);

  // Handle addition from URL (coming from strategy management page)
  useEffect(() => {
    if (mounted) {
      const addIds = searchParams.get("add")?.split(",") || [];
      if (addIds.length > 0) {
        const toAdd = STRATEGY_CONFIGS.filter(
          (s) =>
            addIds.includes(s.id) &&
            !activeStrategies.find((ps) => ps.id === s.id),
        );

        if (toAdd.length > 0) {
          setActiveStrategies((prev) => [...prev, ...toAdd]);
          // Clear param
          router.replace("/");
        }
      }
    }
  }, [mounted, searchParams, activeStrategies, router]);

  // Apply Date Filtering
  const filteredData = useMemo(() => {
    if (!startDate || !endDate) return stockData;
    return stockData.filter((c) => c.time >= startDate && c.time <= endDate);
  }, [stockData, startDate, endDate]);

  // Calculate selected SMAs for the base asset
  const baseSmasMap = useMemo(() => {
    const results: Record<number, { time: string; value: number }[]> = {};
    if (stockData.length === 0) return results;

    activeSmas.forEach((period) => {
      if (stockData.length < period) return;

      const prices = stockData.map((c) => c.close);
      const sma: number[] = [];
      let sum = 0;
      for (let i = 0; i < prices.length; i++) {
        sum += prices[i];
        if (i >= period) sum -= prices[i - period];
        if (i < period - 1) sma.push(NaN);
        else sma.push(sum / period);
      }

      results[period] = stockData
        .map((c, i) => ({ time: c.time, value: sma[i] }))
        .filter(
          (item) =>
            item.time >= startDate &&
            item.time <= endDate &&
            !isNaN(item.value),
        );
    });

    return results;
  }, [stockData, startDate, endDate, activeSmas]);

  const multiResult = useMemo(() => {
    if (!mounted || filteredData.length === 0)
      return { symbol: selectedAsset?.code || "LOADING", results: [] };
    // Run for all active strategies (including benchmark if it's in the list)
    return runBacktest(filteredData, activeStrategies, capital, marketContext);
  }, [
    filteredData,
    activeStrategies,
    capital,
    mounted,
    selectedAsset,
    marketContext,
  ]);

  // Leaderboard Data
  const leaderboardData = useMemo(() => {
    // Find benchmark result for relative Alpha calculation
    const benchRes = multiResult.results.find(
      (r) => r.strategyId === "benchmark",
    );

    const resultsWithAlpha = multiResult.results.map((res: StrategyResult) => ({
      ...res,
      alpha: benchRes ? res.totalReturn - benchRes.totalReturn : 0,
      winRate: (res.winRate * 100).toFixed(1) + "%",
      tradeCount: res.trades.length,
      isBenchmark: res.strategyId === "benchmark",
    }));

    return resultsWithAlpha.sort((a, b) => b.totalReturn - a.totalReturn);
  }, [multiResult.results]);

  const removeStrategy = (id: string) => {
    if (id === "benchmark") return; // Cannot remove benchmark
    setActiveStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  const addStrategies = (strats: StrategyConfig[]) => {
    setActiveStrategies((prev) => {
      const newStrats = strats.filter(
        (s) => !prev.find((ps) => ps.id === s.id),
      );
      return [...prev, ...newStrats];
    });
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF9F3] text-[#1A1523]">
      <header className="px-6 md:px-12 py-3 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Logo
              className="hover:opacity-80 transition-opacity cursor-pointer"
              onClick={() => router.push("/")}
            />
            <nav className="hidden md:flex items-center gap-8">
              <span className="text-xs font-bold opacity-100 cursor-pointer transition-opacity">
                回测实验室
              </span>
              <span
                onClick={() => router.push("/strategies")}
                className="text-xs font-bold opacity-50 hover:opacity-100 cursor-pointer transition-opacity"
              >
                实时信号流
              </span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/strategies")}
              className="h-10 w-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all group shadow-sm"
              title="策略管理"
            >
              <LayoutGrid className="h-5 w-5 text-slate-500 group-hover:text-primary transition-colors" />
            </button>
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
              策略实验室 <span className="italic text-primary">Alpha Lab</span>
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
            <Card className="flex-1 flex flex-col shadow-none border border-slate-100 bg-white/70 backdrop-blur-3xl rounded-[2rem] relative overflow-hidden">
              {loading && (
                <div className="absolute inset-0 z-[70] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                      同步云端数据...
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-slate-100 gap-x-3 gap-y-2 relative z-[60] bg-white rounded-t-[2rem]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>

                  <div className="h-4 w-[1px] bg-slate-200 mx-0.5 flex-shrink-0" />

                  <div className="relative flex items-center flex-shrink-0 max-w-[140px]">
                    <select
                      value={selectedAsset?.code || ""}
                      onChange={(e) => {
                        const asset = assetsList.find(
                          (a) => a.code === e.target.value,
                        );
                        if (asset) setSelectedAsset(asset);
                      }}
                      className="appearance-none bg-transparent font-black text-[11px] text-slate-800 pr-5 cursor-pointer focus:outline-none w-full truncate"
                    >
                      {assetsList.map((asset) => (
                        <option key={asset.code} value={asset.code}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                  </div>

                  <div className="h-4 w-[1px] bg-slate-200 mx-0.5 flex-shrink-0" />

                  {/* Quick Range Presets */}
                  <div className="flex items-center gap-0.5 p-0.5 bg-slate-100/60 rounded-lg flex-shrink-0">
                    {[
                      {
                        label: "1M",
                        getValue: () => ({
                          from: subMonths(new Date(), 1),
                          to: new Date(),
                        }),
                      },
                      {
                        label: "3M",
                        getValue: () => ({
                          from: subMonths(new Date(), 3),
                          to: new Date(),
                        }),
                      },
                      {
                        label: "1Y",
                        getValue: () => ({
                          from: subYears(new Date(), 1),
                          to: new Date(),
                        }),
                      },
                      {
                        label: "5Y",
                        getValue: () => ({
                          from: subYears(new Date(), 5),
                          to: new Date(),
                        }),
                      },
                      {
                        label: "10Y",
                        getValue: () => ({
                          from: subYears(new Date(), 10),
                          to: new Date(),
                        }),
                      },
                      {
                        label: "YTD",
                        getValue: () => ({
                          from: startOfYear(new Date()),
                          to: new Date(),
                        }),
                      },
                      {
                        label: "ALL",
                        getValue: () => ({
                          from:
                            stockData.length > 0
                              ? parseISO(stockData[0].time)
                              : new Date(),
                          to:
                            stockData.length > 0
                              ? parseISO(stockData[stockData.length - 1].time)
                              : new Date(),
                        }),
                      },
                    ].map((p) => {
                      const range = p.getValue();
                      const rangeStartStr = format(range.from, "yyyy-MM-dd");
                      const rangeEndStr = format(range.to, "yyyy-MM-dd");
                      const isActive =
                        startDate === rangeStartStr && endDate === rangeEndStr;

                      return (
                        <button
                          key={p.label}
                          onClick={() => {
                            setStartDate(rangeStartStr);
                            setEndDate(rangeEndStr);
                          }}
                          className={cn(
                            "px-1.5 py-1 text-[8px] font-black rounded-md transition-all tracking-tighter",
                            isActive
                              ? "bg-white text-primary shadow-sm border border-slate-200"
                              : "text-slate-400 hover:text-slate-600 hover:bg-white/50",
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-4 w-[1px] bg-slate-200 mx-0.5 flex-shrink-0" />

                  {/* Date Picker */}
                  <div className="flex items-center scale-[0.82] origin-left flex-shrink-0 max-w-[180px]">
                    <DatePickerWithRange
                      date={{
                        from: startDate ? parseISO(startDate) : undefined,
                        to: endDate ? parseISO(endDate) : undefined,
                      }}
                      minDate={
                        stockData.length > 0
                          ? parseISO(stockData[0].time)
                          : undefined
                      }
                      maxDate={
                        stockData.length > 0
                          ? parseISO(stockData[stockData.length - 1].time)
                          : undefined
                      }
                      setDate={(range) => {
                        if (range?.from)
                          setStartDate(format(range.from, "yyyy-MM-dd"));
                        if (range?.to)
                          setEndDate(format(range.to, "yyyy-MM-dd"));
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                  <div className="h-4 w-[1px] bg-slate-200 mx-1 flex-shrink-0" />

                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "p-2 rounded-xl transition-all relative group",
                          activeSmas.length > 0
                            ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                            : "bg-slate-50/50 text-slate-400 hover:text-slate-600 border border-transparent",
                        )}
                      >
                        <Settings2 className="h-4 w-4" />
                        {activeSmas.length > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-primary border-2 border-white rounded-full animate-pulse" />
                        )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-4 rounded-3xl border-slate-100 shadow-2xl bg-white z-[100]">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1523]/40">
                            均线指标 (MA)
                          </span>
                          <span className="text-[9px] font-bold text-primary/60">
                            {activeSmas.length} 已选
                          </span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { p: 20, color: "#0ea5e9" },
                            { p: 50, color: "#10b981" },
                            { p: 120, color: "#8b5cf6" },
                            { p: 200, color: "#64748b" },
                          ].map(({ p, color }) => (
                            <button
                              key={p}
                              onClick={() => {
                                setActiveSmas((prev) =>
                                  prev.includes(p)
                                    ? prev.filter((x) => x !== p)
                                    : [...prev, p],
                                );
                              }}
                              className={cn(
                                "w-full flex items-center justify-between p-2 rounded-xl border transition-all text-left",
                                activeSmas.includes(p)
                                  ? "bg-slate-50 border-slate-200 shadow-sm"
                                  : "border-transparent text-slate-400 hover:bg-slate-50",
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <span
                                  className={cn(
                                    "text-[11px] font-bold",
                                    activeSmas.includes(p)
                                      ? "text-slate-800"
                                      : "text-slate-400",
                                  )}
                                >
                                  MA{p} 日均线
                                </span>
                              </div>
                              {activeSmas.includes(p) && (
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              )}
                            </button>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-50">
                          <button
                            onClick={() => setActiveSmas([])}
                            className="w-full text-center py-2 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase"
                          >
                            清空所有指标
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <CardContent className="p-0 flex-1 relative min-h-[480px]">
                <div className="p-6 h-full flex flex-col justify-center">
                  <PriceChart
                    data={filteredData}
                    smaData={baseSmasMap}
                    results={multiResult.results}
                    height={440}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="flex flex-col shadow-none border border-slate-100 bg-white/70 backdrop-blur-3xl rounded-[2rem] overflow-hidden h-full">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1523]/40">
                    活跃策略层
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="h-8 w-8 rounded-full bg-primary/5 hover:bg-primary/10 text-primary flex items-center justify-center transition-all group"
                  title="添加策略"
                >
                  <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white/50 space-y-4">
                <StrategySelector
                  strategies={activeStrategies}
                  onRemove={removeStrategy}
                />
              </div>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <p className="text-[9px] leading-relaxed text-slate-400 italic">
                  * 策略信号基于收盘价计算，回测结果不考虑滑点与手续费。
                </p>
              </div>
            </Card>
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

      <StrategyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeStrategyIds={activeStrategies.map((s) => s.id)}
        onAddBatch={addStrategies}
      />
    </div>
  );
}
