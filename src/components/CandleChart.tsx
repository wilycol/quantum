import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi } from "lightweight-charts";
import { usePriceFeed } from "../hooks/usePriceFeed";

// Debug: Log the imported functions
console.log('[CandleChart] Imported functions:', {
  createChart: typeof createChart,
  CrosshairMode,
  IChartApi: typeof IChartApi,
  ISeriesApi: typeof ISeriesApi
});

export default function CandleChart() {
  const { candles, loading, error, mode } = usePriceFeed("BTCUSDT", "1m");
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [chartReady, setChartReady] = useState(false);

  // 1) Mount chart when element is available
  useEffect(() => {
    console.log('[CandleChart] useEffect triggered, elRef.current:', elRef.current);
    
    const createChartInstance = () => {
      const el = elRef.current;
      if (!el) {
        console.log('[CandleChart] Element not ready, retrying...');
        return false;
      }
      
      console.log('[CandleChart] Creating chart on element:', el, 'dimensions:', el.clientWidth, 'x', el.clientHeight);
      
      // Check if element has proper dimensions
      if (el.clientWidth === 0 || el.clientHeight === 0) {
        console.log('[CandleChart] Element has zero dimensions, retrying...');
        return false;
      }
      
      try {
        console.log('[CandleChart] About to create chart with createChart function:', typeof createChart);
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
        
        console.log('[CandleChart] Chart created:', chart);
        console.log('[CandleChart] Chart methods:', Object.getOwnPropertyNames(chart));
        console.log('[CandleChart] addCandlestickSeries method:', typeof chart.addCandlestickSeries);
        
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
        setChartReady(true);
        
        console.log('[CandleChart] Chart created successfully, chartReady set to true');
        return true;
      } catch (error) {
        console.error('[CandleChart] Error creating chart:', error);
        return false;
      }
    };

    // Try to create chart immediately
    if (!createChartInstance()) {
      // If failed, try again after a longer delay to allow element to get proper dimensions
      console.log('[CandleChart] First attempt failed, scheduling retry...');
      const timer = setTimeout(() => {
        console.log('[CandleChart] Retry attempt...');
        if (!createChartInstance()) {
          // If still failing, try one more time with even longer delay
          console.log('[CandleChart] Second attempt failed, final retry...');
          setTimeout(() => {
            createChartInstance();
          }, 500);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }

    return () => {
      console.log('[CandleChart] Cleanup function called');
      if (roRef.current) roRef.current.disconnect();
      if (chartRef.current) chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setChartReady(false);
    };
  }, []);

  // 2) Push data whenever candles change
  useEffect(() => {
    if (!seriesRef.current || !candles?.length || !chartReady) return;
    const data = candles.map(c => ({
      time: Math.floor(c.t / 1000),
      open: c.o, high: c.h, low: c.l, close: c.c,
    }));
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles, chartReady]);

  // Debug info
  console.log('[CandleChart]', { 
    candlesCount: candles?.length, 
    loading, 
    error, 
    mode,
    chartReady,
    firstCandle: candles?.[0],
    lastCandle: candles?.[candles?.length - 1]
  });

  // Always render the chart container so useEffect can run
  return (
    <div
      ref={elRef}
      className="w-full h-[420px] rounded-2xl"
      style={{ 
        cursor: "crosshair",
        minHeight: "420px",
        minWidth: "100%",
        position: "relative"
      }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
          <div className="text-white">Cargando datos del chart...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 rounded-2xl">
          <div className="text-white">Error: {error}</div>
        </div>
      )}
      
      {!candles?.length && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-yellow-900 rounded-2xl">
          <div className="text-white">Sin datos disponibles (modo: {mode})</div>
        </div>
      )}
      
      {!chartReady && !loading && !error && candles?.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-900 rounded-2xl">
          <div className="text-white">Inicializando chart... (chartReady: {chartReady.toString()})</div>
        </div>
      )}
    </div>
  );
}
