'use client';

import { useState, useMemo, useEffect } from 'react';
import { generateMockData } from '@/lib/mock';
import { runBacktest } from '@/lib/backtest';
import { Candle, StrategyResult, StrategyDefinition } from '@/lib/types';
import { PriceChart } from './PriceChart';
import { StrategySelector } from './StrategySelector';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trophy,
  TrendingUp,
  Activity,
  TrendingDown,
  Target,
  Settings2,
  ChevronDown,
  Info,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ASSETS = [
  { id: 'BTC', name: '比特币 (BTC/USDT)' },
  { id: 'ETH', name: '以太坊 (ETH/USDT)' },
  { id: 'AAPL', name: '苹果股票 (AAPL)' },
  { id: 'NVDA', name: '英伟达 (NVDA)' },
];

const AVAILABLE_STRATEGIES: StrategyDefinition[] = [
  { id: 'sma_20_50', name: '短期均线交叉 (20/50)', params: { short: 20, long: 50 } },
  { id: 'sma_50_200', name: '长期趋势交叉 (50/200)', params: { short: 50, long: 200 } },
];

export function BacktestDashboard() {
  const [mounted, setMounted] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<string[]>(['sma_20_50']);
  const capital = 100; 

  useEffect(() => {
    setMounted(true);
  }, []);

  const mockData = useMemo(() => {
    if (!mounted) return [];
    const startPrice = selectedAsset.id === 'BTC' ? 65000 : selectedAsset.id === 'AAPL' ? 180 : 2500;
    return generateMockData(500, startPrice);
  }, [selectedAsset.id, mounted]);

  // Compute Benchmark (Buy & Hold) Stats
  const benchmarkResult = useMemo(() => {
    if (mockData.length < 2) return null;
    const first = mockData[0].close;
    const last = mockData[mockData.length - 1].close;
    const totalReturn = (last / first) - 1;
    
    // Simple Max Drawdown for benchmark
    let maxPrice = 0;
    let maxDd = 0;
    for (const c of mockData) {
      if (c.close > maxPrice) maxPrice = c.close;
      const dd = (maxPrice - c.close) / maxPrice;
      if (dd > maxDd) maxDd = dd;
    }

    return {
      strategyId: 'benchmark',
      strategyName: '买入持有 (Benchmark)',
      totalReturn,
      winRate: 100,
      maxDrawdown: maxDd,
      sharpeRatio: 0, 
      trades: [],
      equityCurve: [] // Not needed for leaderboard row
    };
  }, [mockData]);

  const selectedStrats = useMemo(() => 
    AVAILABLE_STRATEGIES.filter(s => selectedStrategyIds.includes(s.id)),
  [selectedStrategyIds]);

  const multiResult = useMemo(() => {
    if (!mounted || mockData.length === 0) return { symbol: "LOADING", results: [] };
    return runBacktest(mockData, selectedStrats, capital);
  }, [mockData, selectedStrats, capital, mounted]);

  // Combined Results with Alpha
  const leaderboardData = useMemo(() => {
    if (!benchmarkResult) return [];
    const resultsWithAlpha = multiResult.results.map(res => ({
      ...res,
      alpha: res.totalReturn - benchmarkResult.totalReturn,
      winRate: (res.winRate * 100).toFixed(1) + '%',
      tradeCount: res.trades.length
    }));

    // Add benchmark row
    const benchmarkRow = {
      ...benchmarkResult,
      alpha: 0,
      winRate: '--',
      tradeCount: 1,
      isBenchmark: true
    };

    return [...resultsWithAlpha, benchmarkRow].sort((a, b) => b.totalReturn - a.totalReturn);
  }, [multiResult.results, benchmarkResult]);

  const toggleStrategy = (id: string) => {
    setSelectedStrategyIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen p-4 md:p-8 items-center justify-center bg-[#FDF9F3]">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF9F3] text-[#1A1523]">
      <header className="px-6 md:px-12 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-10">
            <h1 className="text-xl font-black tracking-tight text-[#1A1523] uppercase">
              LEVERAGE RUN
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-xs font-bold opacity-50 hover:opacity-100 cursor-pointer transition-opacity">回测实验室</span>
              <span className="text-xs font-bold opacity-50 hover:opacity-100 cursor-pointer transition-opacity">实时信号流</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-4 py-1.5 bg-primary rounded-full text-white text-xs font-black shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-all cursor-pointer uppercase tracking-wider">
               保存当前配置
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-8 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div className="max-w-xl">
             <h2 className="text-3xl heading-serif mb-2 leading-tight">
               策略实验室 <span className="italic text-primary">Alpha Edition</span>
             </h2>
             <p className="text-sm opacity-60 font-medium max-w-lg">
                对比多种量化战术与基准资产的表现，寻找稳定的 Alpha 超额收益。
             </p>
           </div>
           <div className="text-[11px] font-black uppercase tracking-widest text-[#1A1523]/40 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              实时数据同步已激活
           </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
           <div className="lg:col-span-9">
              <Card className="bg-white border-slate-200 card-shadow h-full flex flex-col rounded-3xl overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-4">
                      <div className="relative group">
                         <select 
                           value={selectedAsset.id}
                           onChange={(e) => {
                             const asset = ASSETS.find(a => a.id === e.target.value);
                             if (asset) setSelectedAsset(asset);
                           }}
                           className="appearance-none bg-transparent font-black text-xs text-slate-800 pr-6 cursor-pointer focus:outline-none"
                         >
                           {ASSETS.map(asset => (
                             <option key={asset.id} value={asset.id}>{asset.name}</option>
                           ))}
                         </select>
                         <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                      <div className="h-3 w-[1px] bg-slate-300" />
                      <div className="hidden lg:flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">收益归一化</span>
                         <span className="text-[10px] font-black text-primary">0% 为起始基准点</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                         <TrendingUp className="h-3 w-3" />
                         数据已对齐
                      </div>
                      <Settings2 className="h-4 w-4 text-slate-300 hover:text-primary cursor-pointer transition-colors" />
                   </div>
                </div>

                <CardContent className="p-0 flex-1 relative min-h-[480px]">
                   <div className="p-6 h-full flex flex-col justify-center">
                      <PriceChart data={mockData} results={multiResult.results} height={440} />
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
                          <span className="text-xs font-black uppercase tracking-widest text-[#1A1523]/60">活跃策略层</span>
                       </div>
                       <Info className="h-3.5 w-3.5 text-slate-300 cursor-help" />
                    </div>

                    <div className="space-y-3">
                       <StrategySelector 
                         strategies={AVAILABLE_STRATEGIES}
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
                 <h3 className="text-lg heading-serif">策略绩效深度对比排行</h3>
              </div>
              <div className="text-[10px] items-center text-slate-400 font-bold uppercase tracking-widest flex gap-4">
                 <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> 正向 Alpha</span>
                 <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-rose-500" /> 负向 Alpha</span>
              </div>
           </div>

           <div className="overflow-hidden border border-slate-200 rounded-3xl bg-white card-shadow">
              <table className="w-full">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">排名</th>
                       <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">方案名称</th>
                       <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">累计收益 (ROI)</th>
                       <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Alpha 超额收益</th>
                       <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">交易胜率</th>
                       <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">成交笔数</th>
                       <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">历史最大回撤</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {leaderboardData.map((res: any, index) => (
                        <tr key={res.strategyId} className={cn(
                          "group transition-colors",
                          res.isBenchmark ? "bg-slate-50/50 divide-slate-200" : "hover:bg-[#FDF9F3]/40"
                        )}>
                           <td className="px-6 py-5">
                              {res.isBenchmark ? (
                                <Scale className="h-4 w-4 text-slate-400" />
                              ) : (
                                <span className="text-xl heading-serif font-medium opacity-20 group-hover:opacity-100 transition-opacity">#{index + 1}</span>
                              )}
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                   "h-8 w-8 rounded-lg flex items-center justify-center border",
                                   res.isBenchmark ? "bg-slate-100 border-slate-200" : "bg-slate-50 border-slate-100"
                                 )}>
                                    <Target className={cn("h-4 w-4", res.isBenchmark ? "text-slate-400" : "text-primary")} />
                                 </div>
                                 <span className={cn(
                                   "font-bold text-sm tracking-tight",
                                   res.isBenchmark ? "text-slate-500 italic" : "text-slate-800"
                                 )}>{res.strategyName}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <span className={cn(
                                "text-lg heading-serif font-black",
                                res.totalReturn >= 0 ? "text-emerald-600" : "text-rose-600"
                              )}>
                                 {(res.totalReturn * 100).toFixed(2)}%
                              </span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              {res.isBenchmark ? (
                                 <span className="text-[10px] font-black text-slate-300 uppercase">Baseline</span>
                              ) : (
                                 <span className={cn(
                                   "text-sm font-black",
                                   res.alpha >= 0 ? "text-emerald-500" : "text-rose-500"
                                 )}>
                                    {res.alpha >= 0 ? '+' : ''}{(res.alpha * 100).toFixed(2)}%
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
                                 <span className="text-xs font-black text-rose-500/80">{(res.maxDrawdown * 100).toFixed(1)}%</span>
                                 <div className="w-16 h-1 bg-rose-50 rounded-full mt-1 overflow-hidden">
                                     <div 
                                      className="h-full bg-rose-500/30" 
                                      style={{ width: `${Math.min(res.maxDrawdown * 100, 100)}%` }} 
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
