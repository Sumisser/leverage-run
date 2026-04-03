"use client";

import { useState, useEffect } from "react";
import { STRATEGY_CONFIGS } from "@/strategies";
import { StrategyConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, X, Target, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatch: (strategies: StrategyConfig[]) => void;
  activeStrategyIds: string[];
}

export function StrategyModal({ isOpen, onClose, onAddBatch, activeStrategyIds }: StrategyModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelectedIds([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const toAdd = STRATEGY_CONFIGS.filter(s => selectedIds.includes(s.id));
    onAddBatch(toAdd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#FDF9F3]/80 backdrop-blur-md" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h3 className="text-2xl heading-serif">批量添加量化策略</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">支持多选并一键加载至回测实验室</p>
          </div>
          <button 
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[60vh] grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
          {STRATEGY_CONFIGS.map((strat) => {
            const isAlreadyActive = activeStrategyIds.includes(strat.id);
            const isSelected = selectedIds.includes(strat.id);
            
            return (
              <div 
                key={strat.id}
                onClick={() => !isAlreadyActive && handleToggle(strat.id)}
                className={cn(
                  "p-5 rounded-[2rem] border-2 transition-all group relative cursor-pointer",
                  isAlreadyActive 
                    ? "border-slate-50 bg-slate-50/30 opacity-60 grayscale cursor-not-allowed" 
                    : isSelected
                      ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5"
                      : "border-slate-50 bg-slate-50/50 hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/5"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl border flex items-center justify-center transition-all",
                    isSelected ? "bg-primary border-primary" : "bg-white border-slate-100"
                  )}>
                    {isSelected ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Target className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  
                  {isAlreadyActive && (
                    <div className="text-[8px] font-black text-slate-300 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                      已加载
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className={cn(
                    "font-bold text-sm transition-colors",
                    isSelected ? "text-primary" : "text-slate-900"
                  )}>
                    {strat.name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(strat.params).map(([k, v]) => (
                      <span key={k} className="text-[9px] font-black uppercase text-slate-400">
                        {k}: <span className="text-slate-600 italic">{v}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-8 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2">
             <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 uppercase">
               已选择 {selectedIds.length} 项
             </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white"
            >
              取消
            </Button>
            <Button 
              disabled={selectedIds.length === 0}
              onClick={handleConfirm}
              className="rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest px-8 h-12 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
            >
              一键添加至回测
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
