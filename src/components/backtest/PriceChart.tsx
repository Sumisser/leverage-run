'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, IChartApi, LineSeries } from 'lightweight-charts';
import { Candle, StrategyResult } from '@/lib/types';

interface PriceChartProps {
  data: Candle[];
  results: StrategyResult[];
  height?: number;
}

const STRATEGY_COLORS = [
  '#4F46E5', // Wealthfront Indigo
  '#7C3AED', // Violet
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#A855F7', // Purple
];

export function PriceChart({ data, results, height = 500 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<any>(null);
  const equitySeriesMapRef = useRef<Map<string, any>>(new Map());

  const updateDataAndSeries = useCallback(() => {
    if (!chartRef.current || !priceSeriesRef.current || !chartContainerRef.current) return;

    chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });

    // A. Update Base Price
    if (data.length > 0) {
      const firstPrice = data[0].close;
      priceSeriesRef.current.setData(data.map(c => ({
        time: c.time,
        value: ((c.close / firstPrice) - 1) * 100,
      })));
    }

    // B. Update Equity Curves
    const currentIds = new Set(results.map(r => r.strategyId));
    
    for (const [id, series] of equitySeriesMapRef.current.entries()) {
      if (!currentIds.has(id)) {
        chartRef.current.removeSeries(series);
        equitySeriesMapRef.current.delete(id);
      }
    }

    results.forEach((res, index) => {
      let series = equitySeriesMapRef.current.get(res.strategyId);
      if (!series) {
        series = chartRef.current!.addSeries(LineSeries, {
          color: STRATEGY_COLORS[index % STRATEGY_COLORS.length],
          lineWidth: 4, 
          title: res.strategyName,
          priceFormat: {
            type: 'custom',
            formatter: (price: number) => `${price >= 0 ? '+' : ''}${price.toFixed(2)}%`,
          },
          lastValueVisible: true,
          priceLineVisible: false,
        });
        equitySeriesMapRef.current.set(res.strategyId, series);
      }
      
      series.setData(res.equityCurve.map(e => ({
        time: e.time,
        value: e.value,
      })));
    });

    chartRef.current.timeScale().fitContent();
  }, [data, results]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(0, 0, 0, 0.03)' },
        horzLines: { color: 'rgba(0, 0, 0, 0.03)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: '#f1f5f9',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#f1f5f9',
        visible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    const priceSeries = chart.addSeries(LineSeries, {
      color: '#cbd5e1', // Light slate for benchmark
      lineWidth: 2,
      lineStyle: 1, // Dashed
      title: '标的基准',
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${price >= 0 ? '+' : ''}${price.toFixed(2)}%`,
      },
      lastValueVisible: true,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    priceSeriesRef.current = priceSeries;

    updateDataAndSeries();

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      priceSeriesRef.current = null;
      equitySeriesMapRef.current.clear();
    };
  }, [height, updateDataAndSeries]);

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
