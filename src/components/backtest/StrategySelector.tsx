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
    <div className="flex flex-col gap-1.5">
      {strategies.map((strat) => {
        const isActive = selectedIds.includes(strat.id);
        return (
          <button
            type="button"
            key={strat.id}
            onClick={() => onToggle(strat.id)}
            className={cn(
              "group px-3 py-2.5 rounded-xl border transition-all duration-200 relative flex items-center gap-3",
              isActive 
                ? "bg-slate-50 border-primary shadow-sm" 
                : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
            )}
          >
            <div 
              className={cn(
                "h-1.5 w-1.5 rounded-full flex-shrink-0 transition-all duration-300",
                !isActive && "bg-slate-300 group-hover:bg-slate-400"
              )} 
              style={isActive ? { 
                backgroundColor: strat.color, 
                boxShadow: `0 0 8px ${strat.color}66`,
                transform: 'scale(1.25)' 
              } : {}}
            />

            <div className="flex-1 min-w-0 pr-6">
              <div className={cn(
                "text-[10.5px] font-bold truncate transition-colors",
                isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
              )}>
                {strat.name}
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 opacity-60">
                 {Object.entries(strat.params).map(([key, val]) => (
                   <span key={key} className="text-[8px] font-medium tracking-tight text-slate-400">
                     {key.charAt(0).toUpperCase() + key.slice(1)}: <span className="font-bold">{val}</span>
                   </span>
                 ))}
              </div>
            </div>

            <div className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border flex items-center justify-center transition-all",
              isActive ? "bg-primary border-primary" : "bg-transparent border-slate-200 group-hover:border-slate-300"
            )}>
              {isActive && <Check className="h-2.5 w-2.5 text-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
