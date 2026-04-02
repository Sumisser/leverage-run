"use client";

import { Check, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StrategyDefinition } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-2 min-w-[140px]">
      {strategies.map((strat) => (
        <button
          type="button"
          key={strat.id}
          onClick={() => onToggle(strat.id)}
          className={cn(
            "group relative flex items-center justify-between px-3 py-2 rounded-xl border transition-all duration-300",
            selectedIds.includes(strat.id)
              ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-200"
              : "bg-white border-slate-100 text-slate-500 hover:border-violet-200 hover:bg-violet-50/20",
          )}
        >
          <span className="text-[11px] font-black tracking-tight truncate mr-1">
            {strat.name}
          </span>
          {selectedIds.includes(strat.id) ? (
            <Check className="h-3 w-3 shrink-0 opacity-80" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-violet-300 shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}
