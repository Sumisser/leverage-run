import { BacktestDashboard } from "@/components/backtest/BacktestDashboard";

export const metadata = {
  title: "Leverage Run - 高级量化策略实验室",
  description: "全方位的量化回测与资产 Alpha 绩效分析平台。",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <BacktestDashboard />
    </div>
  );
}
