"use client";

import { StrategyDefinition } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, Target } from "lucide-react";

interface StrategySelectorProps {
  strategies: StrategyDefinition[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function StrategySelector({
  strategies,
  selectedIds,
  onToggle,
}: StrategySelectorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {strategies.map((strat) => {
        const isActive = selectedIds.includes(strat.id);
        return (
          <button
            type="button"
            key={strat.id}
            onClick={() => onToggle(strat.id)}
            className={cn(
              "group p-3.5 rounded-xl border text-left transition-all duration-300 relative overflow-hidden",
              isActive 
                ? "bg-primary border-primary shadow-md shadow-primary/20" 
                : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                isActive ? "bg-white/20" : "bg-slate-50"
              )}>
                <Target className={cn("h-3.5 w-3.5", isActive ? "text-white" : "text-primary")} />
              </div>
              <div className={cn(
                "h-4 w-4 rounded-full border flex items-center justify-center transition-all",
                isActive ? "bg-white border-white" : "bg-transparent border-slate-200 group-hover:border-slate-300"
              )}>
                {isActive && <Check className="h-2.5 w-2.5 text-primary" />}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className={cn(
                "text-xs font-black tracking-tight block uppercase",
                isActive ? "text-white" : "text-slate-700"
              )}>
                {strat.name}
              </span>
              <div className="flex flex-wrap gap-1 pt-1.5 opacity-80">
                 {Object.entries(strat.params).map(([key, val]) => (
                   <span key={key} className={cn(
                     "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                     isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                   )}>
                     {key}: {val}
                   </span>
                 ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
