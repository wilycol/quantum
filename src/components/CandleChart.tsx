import { useEffect, useRef } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";
import { usePriceFeed } from "../hooks/usePriceFeed";

export default function CandleChart() {
  const { candles, loading, error, mode } = usePriceFeed("BTCUSDT", "1m");
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  // 1) Mount chart once
  useEffect(() => {
    const el = elRef.current!;
    const chart = createChart(el, {
      layout: { background: { color: "transparent" }, textColor: "#cbd5e1" },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      crosshair: { mode: CrosshairMode.Normal }, // ← cursor de cruz
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      autoSize: true,
    });
    const series = chart.addCandlestickSeries({
      upColor: "#22c55e", downColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
      borderVisible: false,
    });

    // autosize on container resize
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);

    chartRef.current = chart;
    seriesRef.current = series;
    roRef.current = ro;

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // 2) Push data whenever candles change
  useEffect(() => {
    if (!seriesRef.current || !candles?.length) return;
    const data = candles.map(c => ({
      time: Math.floor(c.t / 1000),
      open: c.o, high: c.h, low: c.l, close: c.c,
    }));
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // Debug info
  console.log('[CandleChart]', { 
    candlesCount: candles?.length, 
    loading, 
    error, 
    mode,
    firstCandle: candles?.[0],
    lastCandle: candles?.[candles?.length - 1]
  });

  if (loading) {
    return (
      <div className="w-full h-[420px] rounded-2xl flex items-center justify-center bg-gray-900">
        <div className="text-white">Cargando datos del chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[420px] rounded-2xl flex items-center justify-center bg-red-900">
        <div className="text-white">Error: {error}</div>
      </div>
    );
  }

  if (!candles?.length) {
    return (
      <div className="w-full h-[420px] rounded-2xl flex items-center justify-center bg-yellow-900">
        <div className="text-white">Sin datos disponibles (modo: {mode})</div>
      </div>
    );
  }

  return (
    <div
      ref={elRef}
      className="w-full h-[420px] rounded-2xl"
      style={{ cursor: "crosshair" }}
    />
  );
}
