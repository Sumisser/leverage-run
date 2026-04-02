"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  LineSeries,
} from "lightweight-charts";
import { Candle, StrategyResult } from "@/lib/types";
import { STRATEGY_COLORS } from "@/strategies";

interface PriceChartProps {
  data: Candle[];
  results: StrategyResult[];
  height?: number;
}

export function PriceChart({ data, results, height = 500 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const equitySeriesMapRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  // Use persistent colors per strategy session to avoid flickering on every render
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
        // CRITICAL: Allow high-density data to be compressed into one screen
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

    const priceSeries = chart.addSeries(LineSeries, {
      color: "#cbd5e1",
      lineWidth: 2,
      lineStyle: 1, // Dashed
      title: "标底基准",
      lastValueVisible: true,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
        // Re-fit on resize
        chartRef.current.timeScale().fitContent();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      equitySeriesMapRef.current.clear();
      colorAssignmentRef.current.clear();
    };
  }, [height]);

  // 2. Data & Scale Synchronization
  useEffect(() => {
    const chart = chartRef.current;
    const priceSeries = priceSeriesRef.current;
    if (!chart || !priceSeries) return;

    const hasData = data.length > 0;

    // A. Update Asset Price Series (Normalizing to first point)
    if (hasData) {
      const firstPrice = data[0].close;
      const pricePoints = data.map((c) => ({
        time: c.time,
        value: (c.close / firstPrice - 1) * 100,
      }));
      priceSeries.setData(pricePoints);
    }

    // B. Re-sync Strategy Series
    const currentIds = new Set(results.map((r) => r.strategyId));

    // Cleanup removed strategies
    for (const [id, series] of equitySeriesMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        chart.removeSeries(series);
        equitySeriesMapRef.current.delete(id);
        colorAssignmentRef.current.delete(id);
      }
    }

    // Update / Create series with stable colors
    results.forEach((res, index) => {
      let series = equitySeriesMapRef.current.get(res.strategyId);

      // Assign stable, non-repeating color
      if (!colorAssignmentRef.current.has(res.strategyId)) {
        // Use the index from the STRATEGY_CONFIGS overall list or just pool
        const colorKey = index % STRATEGY_COLORS.length;
        colorAssignmentRef.current.set(
          res.strategyId,
          STRATEGY_COLORS[colorKey],
        );
      }
      const assignedColor = colorAssignmentRef.current.get(res.strategyId)!;

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
        // Correct the color if it was somehow different
        series.applyOptions({ color: assignedColor });
      }

      const equityPoints = res.equityCurve.map((e) => ({
        time: e.time,
        value: e.value,
      }));
      series.setData(equityPoints);
    });

    // 3. FORCE FULL SCREEN VIEW (No Scroll)
    if (hasData) {
      // Small timeout to ensure internal engine ready for high-density fit
      requestAnimationFrame(() => {
        chart.timeScale().fitContent();

        // Double check: if still scrolling, force logical range
        const totalPoints = data.length;
        if (totalPoints > 0) {
          chart.timeScale().setVisibleLogicalRange({
            from: -0.5,
            to: totalPoints + 0.5,
          });
        }
      });
    }
  }, [data, results]);

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
