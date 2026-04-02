"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineSeries,
  CandlestickSeries,
} from "lightweight-charts";
import { Candle, StrategyResult } from "@/lib/types";
import { STRATEGY_COLORS } from "@/strategies";

interface PriceChartProps {
  data: Candle[];
  smaData?: Record<number, { time: string; value: number }[]>;
  results: StrategyResult[];
  height?: number;
}

const SMA_COLORS: Record<number, string> = {
  20: "#0ea5e9", // Sky Blue
  50: "#10b981", // Emerald
  120: "#8b5cf6", // Violet
  200: "#64748b", // Slate
};

export function PriceChart({ data, smaData, results, height = 500 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line" | "Candlestick"> | null>(null);
  const smaSeriesMapRef = useRef<Map<number, ISeriesApi<"Line">>>(new Map());
  const currentPriceSeriesTypeRef = useRef<"Line" | "Candlestick" | null>(null);
  const equitySeriesMapRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  const colorAssignmentRef = useRef<Map<string, string>>(new Map());

  // 1. Chart Instance Lifecycle
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(0, 0, 0, 0.03)" },
        horzLines: { color: "rgba(0, 0, 0, 0.03)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: "#f1f5f9",
        timeVisible: true,
        minBarSpacing: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: "#f1f5f9",
        visible: true,
        autoScale: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
        chartRef.current.timeScale().fitContent();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      smaSeriesMapRef.current.clear();
      currentPriceSeriesTypeRef.current = null;
      equitySeriesMapRef.current.clear();
      colorAssignmentRef.current.clear();
    };
  }, [height]);

  // 2. Data & Scale Synchronization
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const hasData = data.length > 0;
    if (!hasData) return;

    // A. DETERMINE BEST CHART TYPE BASED ON DENSITY
    const useCandles = data.length < 260;
    const requestedType = useCandles ? "Candlestick" : "Line";

    if (currentPriceSeriesTypeRef.current !== requestedType) {
      if (priceSeriesRef.current) {
        chart.removeSeries(priceSeriesRef.current);
      }

      if (useCandles) {
        priceSeriesRef.current = chart.addSeries(CandlestickSeries, {
          upColor: "#10b981", 
          downColor: "#ef4444", 
          borderVisible: false,
          wickUpColor: "#10b981",
          wickDownColor: "#ef4444",
          lastValueVisible: true,
          priceLineVisible: false,
          title: "标底基准 (Candle)",
        });
      } else {
        priceSeriesRef.current = chart.addSeries(LineSeries, {
          color: "#cbd5e1",
          lineWidth: 2,
          lineStyle: 1, 
          lastValueVisible: true,
          priceLineVisible: false,
          title: "标底基准 (Line)",
        });
      }
      currentPriceSeriesTypeRef.current = requestedType;
    }

    const priceSeries = priceSeriesRef.current;
    if (!priceSeries) return;

    const firstPrice = data[0].close;
    
    // B. UPDATE PRICE SERIES
    if (useCandles) {
      const candlePoints = data.map((c) => ({
        time: c.time,
        open: (c.open / firstPrice - 1) * 100,
        high: (c.high / firstPrice - 1) * 100,
        low: (c.low / firstPrice - 1) * 100,
        close: (c.close / firstPrice - 1) * 100,
      }));
      (priceSeries as ISeriesApi<"Candlestick">).setData(candlePoints);
    } else {
      const pricePoints = data.map((c) => ({
        time: c.time,
        value: (c.close / firstPrice - 1) * 100,
      }));
      (priceSeries as ISeriesApi<"Line">).setData(pricePoints);
    }

    // C. UPDATE MULTI-SMA SERIES
    const requestedSmaKeys = smaData ? Object.keys(smaData).map(Number) : [];
    
    // Cleanup removed SMAs
    for (const [period, series] of smaSeriesMapRef.current.entries()) {
       if (!requestedSmaKeys.includes(period)) {
         chart.removeSeries(series);
         smaSeriesMapRef.current.delete(period);
       }
    }

    // Update / Create SMAs
    requestedSmaKeys.forEach(period => {
      let series = smaSeriesMapRef.current.get(period);
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: SMA_COLORS[period] || "rgba(100, 116, 139, 0.4)",
          lineWidth: 1,
          title: `MA${period}`,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        smaSeriesMapRef.current.set(period, series);
      }

      const points = (smaData![period] || []).map(p => ({
        time: p.time,
        value: (p.value / firstPrice - 1) * 100,
      }));
      series.setData(points);
    });

    // D. RE-SYNC STRATEGY SERIES
    const currentIds = new Set(results.map((r) => r.strategyId));

    for (const [id, series] of equitySeriesMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        chart.removeSeries(series);
        equitySeriesMapRef.current.delete(id);
        colorAssignmentRef.current.delete(id);
      }
    }

    results.forEach((res) => {
      let series = equitySeriesMapRef.current.get(res.strategyId);
      const assignedColor = res.color;

      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: assignedColor,
          lineWidth: 3,
          title: res.strategyName,
          lastValueVisible: true,
          priceLineVisible: false,
        });
        equitySeriesMapRef.current.set(res.strategyId, series);
      } else {
        series.applyOptions({ color: assignedColor });
      }

      const equityPoints = res.equityCurve.map((e) => ({
        time: e.time,
        value: e.value,
      }));
      series.setData(equityPoints);
    });

    requestAnimationFrame(() => {
      chart.timeScale().fitContent();
      const totalPoints = data.length;
      if (totalPoints > 0) {
        chart.timeScale().setVisibleLogicalRange({
          from: -0.5,
          to: totalPoints + 0.5,
        });
      }
    });

  }, [data, results, smaData]);

  return (
    <div className="w-full h-full relative">
      <div
        ref={chartContainerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
