import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { usePriceFeed } from "../hooks/usePriceFeed";
import { useMarketStore } from "../stores/market";
import { maxQtyByRisk } from "../lib/risk";
import InfoDock from "./InfoDock";

export type PricePaneApi = { chart: IChartApi | null; series: ISeriesApi<"Candlestick"> | null };

export default function PricePane({ apiRef }: { apiRef?: React.MutableRefObject<PricePaneApi | null> }) {
  const symbol = useMarketStore(s => s.symbol);
  const interval = useMarketStore(s => s.interval);
  const { candles, loading, error, mode } = usePriceFeed(symbol, interval);

  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi|null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick">|null>(null);
  const lastPxRef = useRef<number | null>(null);
  const [armed, setArmed] = useState(false);
  
  // Estado para zoom y pan personalizados
  const userZoomStateRef = useRef<{
    visibleRange: { from: number; to: number } | null;
    isUserZoomed: boolean;
  }>({ visibleRange: null, isUserZoomed: false });
  
  const panStateRef = useRef<{
    isPanning: boolean;
    startX: number;
    startTime: number;
    startVisibleRange: { from: number; to: number } | null;
  }>({
    isPanning: false,
    startX: 0,
    startTime: 0,
    startVisibleRange: null
  });

  useEffect(() => {
    const el = wrapRef.current!;
    const chart = createChart(el, {
      layout: { background: { color: "transparent" }, textColor: "#cbd5e1" },
      grid: { vertLines: { color:"rgba(255,255,255,0.06)" }, horzLines: { color:"rgba(255,255,255,0.06)" } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.05, bottom: 0.28 } }, // deja espacio para volumen (cuando esté visible)
      timeScale: { 
        borderVisible: false, 
        timeVisible: true, 
        minBarSpacing: 3,
        shiftVisibleRangeOnNewBar: true,
        lockVisibleTimeRangeOnResize: false,
        rightOffset: 0,
        barSpacing: 3,
        fixLeftEdge: false,
        fixRightEdge: false
      },
      handleScroll: false,
      handleScale: false,
      autoSize: true,
    });
    const ks = chart.addCandlestickSeries({
      upColor:"#22c55e", downColor:"#ef4444", wickUpColor:"#22c55e", wickDownColor:"#ef4444", borderVisible:false,
    });
    const ro = new ResizeObserver(()=> chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }));
    ro.observe(el);

    const unsubMove = chart.subscribeCrosshairMove((p) => {
      const d = p.seriesData.get(ks) as any;
      if (d && typeof d.close === "number") lastPxRef.current = d.close;
    });
    const unsubClick = chart.subscribeClick(() => {
      if (!armed) return;
      const px = lastPxRef.current; if (!px) return;
      openTradeMini(px);
      setArmed(false);
    });

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
      
      if (newFrom && newTo && newFrom < newTo && isFinite(newFrom) && isFinite(newTo)) {
        timeScale.setVisibleRange({ from: newFrom as Time, to: newTo as Time });
        userZoomStateRef.current = { visibleRange: { from: newFrom, to: newTo }, isUserZoomed: true };
      }
    };

    // Control de pan con clic izquierdo y arrastrar
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Solo responder al clic izquierdo
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange) return;
      panStateRef.current = {
        isPanning: true,
        startX: event.clientX,
        startTime: Date.now(),
        startVisibleRange: { from: Number(visibleRange.from), to: Number(visibleRange.to) }
      };
      el.style.cursor = 'grabbing';
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!panStateRef.current.isPanning) return;
      const deltaX = event.clientX - panStateRef.current.startX;
      const timeScale = chart.timeScale();
      const startRange = panStateRef.current.startVisibleRange;
      if (!startRange) return;
      const range = startRange.to - startRange.from;
      const pixelsPerTime = el.clientWidth / range;
      const timeDelta = deltaX / pixelsPerTime;
      const newFrom = startRange.from - timeDelta;
      const newTo = startRange.to - timeDelta;
      if (newFrom && newTo && newFrom < newTo && isFinite(newFrom) && isFinite(newTo)) {
        timeScale.setVisibleRange({ from: newFrom as Time, to: newTo as Time });
        userZoomStateRef.current = { visibleRange: { from: newFrom, to: newTo }, isUserZoomed: true };
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      if (!panStateRef.current.isPanning) return;
      panStateRef.current.isPanning = false;
      el.style.cursor = 'crosshair';
    };

    // Agregar event listeners
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp); // Para mouseup fuera del elemento

    chartRef.current = chart; seriesRef.current = ks;
    apiRef && (apiRef.current = { chart, series: ks });

    return () => {
      chart.unsubscribeCrosshairMove(unsubMove);
      chart.unsubscribeClick(unsubClick);
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseup', handleMouseUp);
      ro.disconnect();
      chart.remove();
      apiRef && (apiRef.current = { chart: null, series: null });
    };
  }, []);

  // Resetear zoom solo cuando cambie el símbolo o timeframe (no en cada actualización de datos)
  useEffect(() => {
    userZoomStateRef.current = { visibleRange: null, isUserZoomed: false };
  }, [symbol, interval]);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    const data = candles.map(c=>({ time: Math.floor(c.t/1000) as Time, open:c.o, high:c.h, low:c.l, close:c.c }));
    seriesRef.current.setData(data);
    
    // Solo auto-ajustar si el usuario no ha hecho zoom manual
    if (!userZoomStateRef.current.isUserZoomed) {
      chartRef.current?.timeScale().fitContent();
    } else if (userZoomStateRef.current.visibleRange) {
      // Preservar el zoom del usuario, pero ajustar a los datos más recientes
      const timeScale = chartRef.current?.timeScale();
      if (timeScale) {
        const currentRange = timeScale.getVisibleRange();
        if (currentRange) {
          const rangeSize = Number(currentRange.to) - Number(currentRange.from);
          const latestTime = Math.floor(candles[candles.length - 1].t / 1000);
          
                      // Solo ajustar si el rango actual no incluye los datos más recientes
                      if (Number(currentRange.to) < latestTime) {
                        const newFrom = latestTime - rangeSize;
                        const newTo = latestTime;
                        if (newFrom && newTo && newFrom < newTo && isFinite(newFrom) && isFinite(newTo)) {
                          timeScale.setVisibleRange({ from: newFrom as Time, to: newTo as Time });
                          userZoomStateRef.current.visibleRange = { from: newFrom, to: newTo };
                        }
                      }
        }
      }
    }
  }, [candles, symbol, interval]);

  function openTradeMini(price:number) {
    const root = wrapRef.current!;
    const el = document.createElement("div");
    el.className = "absolute right-4 top-4 z-20 bg-neutral-900/95 border border-white/10 rounded-xl p-3 flex gap-2 items-center shadow-lg";
    el.innerHTML = `
      <span class="text-xs text-gray-200 mr-2">Entry <b>${price.toFixed(2)}</b></span>
      <input id="qtQty" type="number" min="0" step="0.000001" class="w-24 bg-neutral-800 text-gray-100 px-2 py-1 rounded-md outline-none border border-white/10" placeholder="qty">
      <button id="qtBuy"  class="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs">BUY</button>
      <button id="qtSell" class="px-3 py-1 rounded-md bg-rose-600 text-white text-xs">SELL</button>
      <button id="qtX"    class="px-2 py-1 rounded-md bg-neutral-800 text-gray-300 border border-white/10">×</button>
    `;
    root.appendChild(el);
    try {
      const equity = (window as any).__QT_EQUITY__ ?? 10000;
      (el.querySelector("#qtQty") as HTMLInputElement).value = String(maxQtyByRisk(equity, price, 0.05));
    } catch {}

    const close = () => root.contains(el) && root.removeChild(el);
    (el.querySelector("#qtX") as HTMLButtonElement).onclick = close;
    (el.querySelector("#qtBuy") as HTMLButtonElement).onclick  = () => confirm("buy");
    (el.querySelector("#qtSell") as HTMLButtonElement).onclick = () => confirm("sell");

    const confirm = (side:"buy"|"sell") => {
      const qty = +(el.querySelector("#qtQty") as HTMLInputElement).value || 0;
      if (!price || !isFinite(price)) {
        console.error('Invalid price for order:', price);
        return;
      }
      window.dispatchEvent(new CustomEvent("qt:order", { detail: { side, symbol, price, qty } }));
      close();
    };
  }

  const fmt = (n?:number,d=2)=> n==null? "—" : (+n).toFixed(d);

  // Calcular estadísticas básicas
  const stats = {
    changePct: candles.length > 1 && candles[0]?.c && candles[candles.length-1]?.c ? 
      ((candles[candles.length-1].c - candles[0].c) / candles[0].c) * 100 : 0,
    rsi: 50, // Placeholder - podrías calcular RSI real aquí
    vol: candles.length > 0 && candles[candles.length-1]?.v ? candles[candles.length-1].v : 0
  };

  return (
    <div ref={wrapRef} className="relative w-full h-[420px] rounded-2xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
          <div className="text-white">Cargando datos del chart...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-2xl">
          <div className="text-red-400">Error: {error}</div>
        </div>
      )}

      {/* HUD */}
      <div className="absolute left-3 top-3 z-10 bg-neutral-900/90 border border-white/10 rounded-md px-2 py-1 text-[11px] text-gray-200">
        <div className="font-semibold">{symbol} • {interval}</div>
        <div>Δ {fmt(stats.changePct,2)}% | RSI14 {fmt(stats.rsi,1)} | Vol {fmt(stats.vol,0)}</div>
      </div>
      
      {/* Trade-from-Chart */}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button onClick={()=> setArmed(v=>!v)}
          className={`px-3 py-1 rounded-md border text-xs ${armed? "bg-amber-600 text-white" : "bg-neutral-800 text-gray-200 border-white/10"}`}>
          {armed? "Click price…" : "Trade from Chart"}
        </button>
      </div>
      
      {/* Indicadores de zoom y pan */}
      <div className="absolute top-2 right-2 z-10 bg-gray-800/80 text-white text-xs px-2 py-1 rounded-md border border-gray-600 space-y-1">
        <div><span className="text-gray-300">Zoom: </span><span className="text-yellow-400 font-mono">Ctrl + Scroll</span></div>
        <div><span className="text-gray-300">Pan: </span><span className="text-blue-400 font-mono">Click + Drag</span></div>
      </div>
      
      {/* InfoDock compacto siempre visible */}
      <InfoDock />
    </div>
  );
}
