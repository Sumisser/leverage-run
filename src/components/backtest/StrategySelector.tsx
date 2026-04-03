"use client";

import { StrategyDefinition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X, Target, Info } from "lucide-react";

interface StrategySelectorProps {
  strategies: StrategyDefinition[];
  onRemove: (id: string) => void;
}

export function StrategySelector({
  strategies,
  onRemove,
}: StrategySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {strategies.map((strat) => {
        const isBenchmark = strat.id === 'benchmark';
        return (
          <div
            key={strat.id}
            className="group px-3 py-2.5 rounded-[1.25rem] border border-slate-100 bg-white/80 hover:bg-white hover:border-slate-200 transition-all duration-300 relative flex items-center gap-2.5 overflow-hidden"
          >
            <div className="h-7 w-7 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-100/50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Target className="h-3.5 w-3.5" style={{ color: strat.color }} />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1">
                <div className="text-[10px] font-black text-slate-800 truncate tracking-tight uppercase">
                  {strat.name}
                </div>
                {isBenchmark && (
                  <span className="text-[7px] font-black bg-slate-100 text-slate-400 px-1 py-0.5 rounded-full uppercase tracking-tighter">
                    BASE
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-0.5 opacity-60">
                 {Object.entries(strat.params).length > 0 ? (
                   Object.entries(strat.params).map(([key, val]) => (
                     <span key={key} className="text-[8px] font-bold tracking-tight text-slate-500 whitespace-nowrap">
                       {key.charAt(0).toUpperCase()}: <span className="text-slate-800">{val}</span>
                     </span>
                   ))
                 ) : (
                   <span className="text-[8px] font-bold text-slate-400 italic">默认持仓方案</span>
                 )}
              </div>
            </div>

            {!isBenchmark && (
              <button 
                onClick={() => onRemove(strat.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all bg-transparent"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
