import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, Time, CrosshairMode } from "lightweight-charts";
import { usePriceFeed } from "../hooks/usePriceFeed";
import { useMarketStore } from "../stores/market";

export type VolumePaneApi = { chart: IChartApi | null; series: ISeriesApi<"Histogram"> | null };

export default function VolumePane({ apiRef }: { apiRef?: React.MutableRefObject<VolumePaneApi | null> }) {
  const symbol = useMarketStore(s => s.symbol);
  const interval = useMarketStore(s => s.interval);
  const { candles, loading, error } = usePriceFeed(symbol, interval);

  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi|null>(null);
  const seriesRef = useRef<ISeriesApi<"Histogram">|null>(null);

  useEffect(() => {
    const el = wrapRef.current!;
    const chart = createChart(el, {
      layout: { background: { color:"transparent" }, textColor:"#94a3b8" },
      grid: { vertLines:{ color:"rgba(255,255,255,0.06)" }, horzLines:{ color:"rgba(255,255,255,0.06)"} },
      crosshair: { mode: CrosshairMode.Hidden },
      rightPriceScale: { borderVisible:false },
      timeScale: { 
        borderVisible:false, 
        timeVisible:true, 
        minBarSpacing: 3,
        shiftVisibleRangeOnNewBar: false,
        lockVisibleTimeRangeOnResize: false
      },
      handleScroll: false,
      handleScale: false,
      autoSize: true,
    });
    const vs = chart.addHistogramSeries({ priceFormat:{ type:"volume" }, baseLineVisible:false });
    const ro = new ResizeObserver(()=> chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);

    // Control de zoom personalizado con Ctrl + scroll
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange) return;
      
      const delta = event.deltaY > 0 ? 1.1 : 0.9;
      const range = Number(visibleRange.to) - Number(visibleRange.from);
      const center = Number(visibleRange.from) + range / 2;
      const newRange = range * delta;
      const newFrom = center - newRange / 2;
      const newTo = center + newRange / 2;
      
      timeScale.setVisibleRange({ from: newFrom as Time, to: newTo as Time });
    };

    // Control de pan con clic izquierdo y arrastrar
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange) return;
      el.style.cursor = 'grabbing';
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      el.style.cursor = 'crosshair';
    };

    // Agregar event listeners
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp);

    chartRef.current = chart; seriesRef.current = vs;
    apiRef && (apiRef.current = { chart, series: vs });

    return () => { 
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleMouseUp);
      ro.disconnect(); 
      chart.remove(); 
      apiRef && (apiRef.current = { chart: null, series: null }); 
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    const data = candles.map((c,i)=>({
      time: Math.floor(c.t/1000) as Time,
      value: c.v,
      color: i===0 ? "rgba(100,116,139,0.8)" : (c.c >= candles[i-1].c ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)")
    }));
    seriesRef.current.setData(data);
  }, [candles, symbol, interval]);

  return (
    <div ref={wrapRef} className="w-full h-[160px] rounded-2xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
          <div className="text-white text-sm">Cargando volumen...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
          <div className="text-red-400 text-sm">Error: {error}</div>
        </div>
      )}
    </div>
  );
}
