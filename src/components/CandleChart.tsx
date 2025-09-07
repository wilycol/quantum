import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { usePriceFeed } from "../hooks/usePriceFeed";

type Marker = { time: Time; position: "aboveBar" | "belowBar"; color: string; shape: "arrowUp" | "arrowDown"; text: string };
type LineRef = ReturnType<ISeriesApi<"Candlestick">["createPriceLine"]>;

interface CandleChartProps {
  symbol?: string;
  timeframe?: string;
}

export default function CandleChart({ symbol = "BTCUSDT", timeframe = "1m" }: CandleChartProps) {
  const { candles, loading, error, mode } = usePriceFeed(symbol, timeframe);
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const entryLineRef = useRef<LineRef | null>(null);
  const tpLineRef = useRef<LineRef | null>(null);
  const slLineRef = useRef<LineRef | null>(null);
  
  // Estado para mantener el zoom del usuario
  const userZoomStateRef = useRef<{
    visibleRange: { from: number; to: number } | null;
    isUserZoomed: boolean;
  }>({ visibleRange: null, isUserZoomed: false });

  // Referencias para los event handlers
  const handleWheelRef = useRef<((event: WheelEvent) => void) | null>(null);
  const handleDocumentWheelRef = useRef<((event: WheelEvent) => void) | null>(null);

  // ------- create chart once
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const createChartInstance = () => {
      // Check if element has proper dimensions
      if (el.clientWidth === 0 || el.clientHeight === 0) {
        return false;
      }
      
      try {
        const chart = createChart(el, {
          layout: { background: { color: "transparent" }, textColor: "#cbd5e1" },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.06)" },
            horzLines: { color: "rgba(255,255,255,0.06)" },
          },
          crosshair: { mode: CrosshairMode.Normal },
          rightPriceScale: { borderVisible: false },
          timeScale: { 
            borderVisible: false, 
            timeVisible: true, 
            secondsVisible: false,
            rightOffset: 0,
            barSpacing: 6,
            minBarSpacing: 0.5,
            // Deshabilitar completamente el zoom automático
            shiftVisibleRangeOnNewBar: false,
            lockVisibleTimeRangeOnResize: false,
          },
          autoSize: true,
          // Deshabilitar todas las interacciones automáticas de zoom
          handleScroll: false,
          handleScale: false,
        });
        
        const series = chart.addCandlestickSeries({
          upColor: "#22c55e", downColor: "#ef4444",
          wickUpColor: "#22c55e", wickDownColor: "#ef4444",
          borderVisible: false,
        });

        // responsive
        const ro = new ResizeObserver(() => {
          chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
        });
        ro.observe(el);

        // Control de zoom personalizado con Ctrl + rueda del mouse
        const handleWheel = (event: WheelEvent) => {
          // Solo permitir zoom si se presiona Ctrl
          if (!event.ctrlKey) {
            return; // Permitir scroll normal de la página
          }
          
          // Prevenir completamente el comportamiento por defecto
          event.preventDefault();
          event.stopPropagation();
          
          const timeScale = chart.timeScale();
          const visibleRange = timeScale.getVisibleRange();
          if (!visibleRange) return;
          
          const delta = event.deltaY;
          const zoomFactor = delta > 0 ? 1.1 : 0.9; // Zoom out si delta > 0, zoom in si delta < 0
          
          const range = Number(visibleRange.to) - Number(visibleRange.from);
          const newRange = range * zoomFactor;
          const center = (Number(visibleRange.from) + Number(visibleRange.to)) / 2;
          
          const newFrom = center - newRange / 2;
          const newTo = center + newRange / 2;
          
          timeScale.setVisibleRange({
            from: newFrom as Time,
            to: newTo as Time
          });
          
          // Guardar el estado del zoom del usuario
          userZoomStateRef.current = {
            visibleRange: { from: newFrom, to: newTo },
            isUserZoomed: true
          };
        };
        
        // Listener adicional en el documento para interceptar eventos cuando el mouse está sobre el chart
        const handleDocumentWheel = (event: WheelEvent) => {
          // Verificar si el mouse está sobre el elemento del chart
          if (el.contains(event.target as Node)) {
            if (!event.ctrlKey) {
              return; // Permitir scroll normal si no hay Ctrl
            }
            // Prevenir el zoom automático de la librería
            event.preventDefault();
            event.stopPropagation();
          }
        };
        
        // Guardar referencias para la limpieza
        handleWheelRef.current = handleWheel;
        handleDocumentWheelRef.current = handleDocumentWheel;
        
        // Agregar listeners
        el.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        document.addEventListener('wheel', handleDocumentWheel, { passive: false, capture: true });
        
        // Listener para detectar cuando el usuario cambia el zoom manualmente
        const handleVisibleRangeChange = (timeRange: any) => {
          if (timeRange) {
            userZoomStateRef.current = {
              visibleRange: { from: timeRange.from, to: timeRange.to },
              isUserZoomed: true
            };
          }
        };
        
        chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

        chartRef.current = chart;
        seriesRef.current = series;
        roRef.current = ro;
        setChartReady(true);
        
        return true;
      } catch (error) {
        console.error('[CandleChart] Error creating chart:', error);
        return false;
      }
    };

    // Try to create chart immediately
    if (!createChartInstance()) {
      // If failed, try again after a delay
      const timer = setTimeout(() => {
        if (!createChartInstance()) {
          // Final retry
          setTimeout(() => {
            createChartInstance();
          }, 500);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }

    return () => {
      if (roRef.current) roRef.current.disconnect();
      if (chartRef.current) {
        // Remover listeners personalizados
        const el = elRef.current;
        if (el && handleWheelRef.current) {
          el.removeEventListener('wheel', handleWheelRef.current, { capture: true });
        }
        if (handleDocumentWheelRef.current) {
          document.removeEventListener('wheel', handleDocumentWheelRef.current, { capture: true });
        }
        chartRef.current.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
      setChartReady(false);
    };
  }, []);

  // ------- set data when candles change
  useEffect(() => {
    if (!seriesRef.current || !candles?.length || !chartReady) return;
    
    const data = candles.map(c => ({ 
      time: Math.floor(c.t/1000) as Time, 
      open: c.o, 
      high: c.h, 
      low: c.l, 
      close: c.c 
    }));
    
    // Guardar el estado actual del zoom antes de actualizar datos
    const currentZoomState = userZoomStateRef.current;
    
    seriesRef.current.setData(data);
    
    // Si el usuario tenía un zoom personalizado, restaurarlo
    if (currentZoomState.isUserZoomed && currentZoomState.visibleRange) {
      // Pequeño delay para asegurar que los datos se hayan procesado
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.timeScale().setVisibleRange(currentZoomState.visibleRange);
        }
      }, 50);
    } else {
      // Solo hacer fitContent si el usuario no tenía zoom personalizado
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles, chartReady]);

  // ------- OHLC tooltip (floating)
  useEffect(() => {
    const el = elRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!el || !chart || !series || !chartReady) return;

    // tooltip element
    const tip = document.createElement("div");
    tip.style.position = "absolute";
    tip.style.pointerEvents = "none";
    tip.style.zIndex = "10";
    tip.style.top = "8px";
    tip.style.left = "8px";
    tip.style.padding = "6px 8px";
    tip.style.background = "rgba(17,24,39,0.9)";
    tip.style.border = "1px solid rgba(148,163,184,0.3)";
    tip.style.borderRadius = "8px";
    tip.style.fontSize = "12px";
    tip.style.color = "#e5e7eb";
    tip.style.fontFamily = "monospace";
    tip.textContent = "—";
    el.appendChild(tip);

    const fmt = (n: number) => (Math.abs(n) >= 1000 ? n.toFixed(2) : n.toString());

    const sub = chart.subscribeCrosshairMove(param => {
      const p = param.seriesData.get(series);
      if (!p) {
        tip.textContent = "—";
        return;
      }
      const d = p as { open:number; high:number; low:number; close:number };
      const t = (param.time as number) ?? 0;
      tip.innerHTML = `<b>${new Date(t*1000).toLocaleTimeString()}</b><br/>
        O: ${fmt(d.open)} H: ${fmt(d.high)} L: ${fmt(d.low)} C: <b>${fmt(d.close)}</b>`;
    });

    return () => {
      chart.unsubscribeCrosshairMove(sub);
      if (el.contains(tip)) {
        el.removeChild(tip);
      }
    };
  }, [chartReady]);

  // ------- consume eventos globales para crear marcadores y líneas
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !chartReady) return;

    const onOrder = (e: Event) => {
      const { side, price, time, tp, sl } = (e as CustomEvent).detail as { 
        side: "buy"|"sell"; 
        price:number; 
        time?: number; 
        tp?: number; 
        sl?: number 
      };
      const lastTime = time ?? (candles?.length ? Math.floor(candles[candles.length-1].t/1000) : Math.floor(Date.now()/1000));

      // marker
      const m: Marker = side === "buy"
        ? { time: lastTime as Time, position: "belowBar", color: "#22c55e", shape: "arrowUp", text: `BUY ${price}` }
        : { time: lastTime as Time, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: `SELL ${price}` };
      
      setMarkers(prev => {
        const next = [...prev, m];
        series.setMarkers(next);
        return next;
      });

      // entry line
      if (entryLineRef.current) { 
        series.removePriceLine(entryLineRef.current); 
        entryLineRef.current = null; 
      }
      entryLineRef.current = series.createPriceLine({
        price,
        color: "#93c5fd",
        lineStyle: 2, // dashed
        title: `Entry ${price}`,
      });

      // TP/SL opcionales
      if (tpLineRef.current) { 
        series.removePriceLine(tpLineRef.current); 
        tpLineRef.current = null; 
      }
      if (slLineRef.current) { 
        series.removePriceLine(slLineRef.current); 
        slLineRef.current = null; 
      }
      
      if (typeof tp === "number") {
        tpLineRef.current = series.createPriceLine({ 
          price: tp, 
          color: "#22c55e", 
          lineStyle: 0, 
          title: `TP ${tp}` 
        });
      }
      if (typeof sl === "number") {
        slLineRef.current = series.createPriceLine({ 
          price: sl, 
          color: "#ef4444", 
          lineStyle: 0, 
          title: `SL ${sl}` 
        });
      }
    };

    window.addEventListener("qt:order", onOrder as EventListener);
    return () => window.removeEventListener("qt:order", onOrder as EventListener);
  }, [candles, chartReady]);

  return (
    <div
      ref={elRef}
      className="w-full h-[420px] rounded-2xl relative"
      style={{ 
        cursor: "crosshair",
        minHeight: "420px",
        minWidth: "100%",
        position: "relative"
      }}
    >
      {/* Indicador de zoom */}
      <div className="absolute top-2 right-2 z-10 bg-gray-800/80 text-white text-xs px-2 py-1 rounded-md border border-gray-600">
        <span className="text-gray-300">Zoom: </span>
        <span className="text-yellow-400 font-mono">Ctrl + Scroll</span>
      </div>
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
          <div className="text-white">Inicializando chart...</div>
        </div>
      )}
    </div>
  );
}