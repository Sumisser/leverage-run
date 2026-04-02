import { BacktestDashboard } from "@/components/backtest/BacktestDashboard";

export const metadata = {
  title: "Leverage Run!",
  description: "专业的量化交易策略多空回测与绩效评估系统。",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <BacktestDashboard />
    </div>
  );
}
