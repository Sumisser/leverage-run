"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STRATEGY_CONFIGS } from "@/strategies";
import { Logo } from "@/components/ui/Logo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Target, BarChart3, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function StrategyManagementPage() {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchAdd = () => {
    if (selectedIds.length === 0) return;
    router.push(`/?add=${selectedIds.join(',')}`);
  };

  return (
    <div className="min-h-screen bg-[#FDF9F3] text-[#1A1523] pb-32">
      <header className="px-6 md:px-12 py-4 border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/">
              <Logo className="hover:opacity-80 transition-opacity cursor-pointer" />
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-xs font-bold opacity-50 hover:opacity-100 transition-opacity">
                回测实验室
              </Link>
              <span className="text-xs font-bold text-primary">
                策略管理中心
              </span>
            </nav>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full font-bold text-xs uppercase tracking-widest text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              返回控制台
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full px-6 md:px-12 py-12 space-y-12">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl heading-serif mb-3 leading-tight">
              策略矩阵 <span className="italic text-primary">Library</span>
            </h1>
            <p className="text-base opacity-60 font-medium leading-relaxed">
              探索、配置并管理您的量化战术武器库。每个策略都经过严格的参数化设计，旨在捕捉特定市场状态下的超额收益。
            </p>
          </div>
          <Button className="rounded-full h-12 px-8 bg-primary text-white font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            <Plus className="h-5 w-5 mr-3" />
            创建新策略
          </Button>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {STRATEGY_CONFIGS.map((strat) => {
            const isSelected = selectedIds.includes(strat.id);
            return (
              <Card 
                key={strat.id} 
                className={cn(
                  "group border-none shadow-[0_4px_20px_rgba(0,0,0,0.04)] bg-white/70 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 relative cursor-pointer ring-2 ring-transparent",
                  isSelected && "ring-primary shadow-xl shadow-primary/10"
                )}
                onClick={() => toggleSelection(strat.id)}
              >
                <CardContent className="p-8 pt-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500",
                      isSelected ? "bg-primary border-primary" : "bg-slate-50 border-slate-100 group-hover:scale-110"
                    )}>
                      {isSelected ? (
                        <Check className="h-7 w-7 text-white" />
                      ) : (
                        <Target className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    {isSelected && (
                       <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase">
                          已选择
                       </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-8">
                    <h3 className={cn(
                      "text-xl font-bold transition-colors leading-tight",
                      isSelected ? "text-primary" : "text-slate-900"
                    )}>
                      {strat.name}
                    </h3>
                    <p className="text-sm text-slate-500/80 font-medium font-bold">
                      {strat.id === 'market-guard-qqq' ? '多周期择时动态仓位管理' : '高胜率趋势追踪算法'}
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">运行参数</span>
                      <BarChart3 className="h-3.5 w-3.5 text-slate-300" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(strat.params).map(([key, val]) => (
                        <div key={key} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                          <div className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-1">{key}</div>
                          <div className="text-xs font-bold text-slate-700">{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Strategy Placeholder */}
          <button className="group border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/[0.02] transition-all min-h-[400px]">
             <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                <Plus className="h-8 w-8 text-slate-300 group-hover:text-primary" />
             </div>
             <div className="text-center">
                <div className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-primary/70">添加新战术</div>
                <div className="text-[11px] font-medium text-slate-300 mt-1 max-w-[150px]">集成第三方信号或自定义逻辑</div>
             </div>
          </button>
        </div>
      </main>

      {/* Sticky Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 duration-500 w-full max-w-xl px-4">
          <div className="bg-[#1A1523] text-white px-6 md:px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/10 backdrop-blur-xl">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-black text-sm text-white">
                   {selectedIds.length}
                </div>
                <div className="hidden sm:block">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">已选中策略</div>
                   <div className="text-xs font-bold">待加载至实验室</div>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <Button 
                  onClick={handleBatchAdd}
                  className="rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest px-8 h-12 shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all"
                >
                  立即批量加载
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
