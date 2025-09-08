import { useEffect, useRef, useState } from "react";
import { createChart, CrosshairMode, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { usePriceFeed } from "../hooks/usePriceFeed";
import { maxQtyByRisk } from "../lib/risk";

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
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const entryLineRef = useRef<LineRef | null>(null);
  const tpLineRef = useRef<LineRef | null>(null);
  const slLineRef = useRef<LineRef | null>(null);
  
  // Trade from Chart states
  const [armed, setArmed] = useState(false);
  const lastPxRef = useRef<number | null>(null);
  
  // Estado para mantener el zoom del usuario
  const userZoomStateRef = useRef<{
    visibleRange: { from: number; to: number } | null;
    isUserZoomed: boolean;
  }>({ visibleRange: null, isUserZoomed: false });

  // Referencias para los event handlers
  const handleWheelRef = useRef<((event: WheelEvent) => void) | null>(null);
  const handleMouseDownRef = useRef<((event: MouseEvent) => void) | null>(null);
  const handleMouseMoveRef = useRef<((event: MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<((event: MouseEvent) => void) | null>(null);
  
  // Estado para el pan
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

        // Agregar serie de volumen
        const vol = chart.addHistogramSeries({
          priceScaleId: "", // escala separada
          priceFormat: { type: "volume" },
          baseLineVisible: false
        });
        chart.priceScale("").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

        // responsive
        const ro = new ResizeObserver(() => {
          chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
        });
        ro.observe(el);

        // Control de zoom personalizado con Ctrl + rueda del mouse
        const handleWheel = (event: WheelEvent) => {
          console.log('[ZOOM DEBUG] Wheel event:', { ctrlKey: event.ctrlKey, deltaY: event.deltaY });
          
          // Solo permitir zoom si se presiona Ctrl
          if (!event.ctrlKey) {
            return; // Permitir scroll normal de la página
          }
          
          // Prevenir completamente el comportamiento por defecto
          event.preventDefault();
          event.stopPropagation();
          
          const timeScale = chart.timeScale();
          const visibleRange = timeScale.getVisibleRange();
          if (!visibleRange) {
            console.log('[ZOOM DEBUG] No visible range available');
            return;
          }
          
          const delta = event.deltaY;
          const zoomFactor = delta > 0 ? 1.1 : 0.9; // Zoom out si delta > 0, zoom in si delta < 0
          
          const range = Number(visibleRange.to) - Number(visibleRange.from);
          const newRange = range * zoomFactor;
          const center = (Number(visibleRange.from) + Number(visibleRange.to)) / 2;
          
          const newFrom = center - newRange / 2;
          const newTo = center + newRange / 2;
          
          console.log('[ZOOM DEBUG] Applying zoom:', { 
            originalRange: range, 
            newRange, 
            zoomFactor, 
            from: newFrom, 
            to: newTo 
          });
          
          // Validar que los valores no sean null/NaN antes de setVisibleRange
          if (newFrom != null && newTo != null && Number.isFinite(newFrom) && Number.isFinite(newTo)) {
            timeScale.setVisibleRange({
              from: newFrom as Time,
              to: newTo as Time
            });
          }
          
          // Guardar el estado del zoom del usuario
          userZoomStateRef.current = {
            visibleRange: { from: newFrom, to: newTo },
            isUserZoomed: true
          };
        };
        
        // Control de pan con clic izquierdo y arrastrar
        const handleMouseDown = (event: MouseEvent) => {
          // Solo responder al clic izquierdo
          if (event.button !== 0) return;
          
          const timeScale = chart.timeScale();
          const visibleRange = timeScale.getVisibleRange();
          if (!visibleRange) return;
          
          panStateRef.current = {
            isPanning: true,
            startX: event.clientX,
            startTime: Date.now(),
            startVisibleRange: {
              from: Number(visibleRange.from),
              to: Number(visibleRange.to)
            }
          };
          
          // Cambiar cursor para indicar que se puede arrastrar
          el.style.cursor = 'grabbing';
          
          console.log('[PAN DEBUG] Mouse down:', { 
            startX: event.clientX, 
            visibleRange: { from: visibleRange.from, to: visibleRange.to } 
          });
        };
        
        const handleMouseMove = (event: MouseEvent) => {
          if (!panStateRef.current.isPanning) return;
          
          const deltaX = event.clientX - panStateRef.current.startX;
          const timeScale = chart.timeScale();
          const startRange = panStateRef.current.startVisibleRange;
          
          if (!startRange) return;
          
          // Calcular el desplazamiento en tiempo basado en el movimiento del mouse
          const range = startRange.to - startRange.from;
          const pixelsPerTime = el.clientWidth / range;
          const timeDelta = deltaX / pixelsPerTime;
          
          const newFrom = startRange.from - timeDelta;
          const newTo = startRange.to - timeDelta;
          
          // Validar que los valores no sean null/NaN antes de setVisibleRange
          if (newFrom != null && newTo != null && Number.isFinite(newFrom) && Number.isFinite(newTo)) {
            timeScale.setVisibleRange({
              from: newFrom as Time,
              to: newTo as Time
            });
          }
          
          // Actualizar el estado del zoom del usuario
          userZoomStateRef.current = {
            visibleRange: { from: newFrom, to: newTo },
            isUserZoomed: true
          };
        };
        
        const handleMouseUp = (event: MouseEvent) => {
          if (!panStateRef.current.isPanning) return;
          
          panStateRef.current.isPanning = false;
          el.style.cursor = 'crosshair';
          
          console.log('[PAN DEBUG] Mouse up');
        };
        
        // Guardar referencias para la limpieza
        handleWheelRef.current = handleWheel;
        handleMouseDownRef.current = handleMouseDown;
        handleMouseMoveRef.current = handleMouseMove;
        handleMouseUpRef.current = handleMouseUp;
        
        // Agregar listeners
        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('mousedown', handleMouseDown);
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseup', handleMouseUp);
        // También escuchar mouseup en el documento para cuando se suelta fuera del elemento
        document.addEventListener('mouseup', handleMouseUp);
        
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

        // Crosshair: guardar último precio bajo cursor
        const unsubCrosshair = chart.subscribeCrosshairMove((p) => {
          const sd = p.seriesData.get(series) as any;
          if (sd && typeof sd.close === "number") {
            lastPxRef.current = sd.close;
          }
        });

        chartRef.current = chart;
        seriesRef.current = series;
        volRef.current = vol;
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
        if (el) {
          if (handleWheelRef.current) {
            el.removeEventListener('wheel', handleWheelRef.current);
          }
          if (handleMouseDownRef.current) {
            el.removeEventListener('mousedown', handleMouseDownRef.current);
          }
          if (handleMouseMoveRef.current) {
            el.removeEventListener('mousemove', handleMouseMoveRef.current);
          }
          if (handleMouseUpRef.current) {
            el.removeEventListener('mouseup', handleMouseUpRef.current);
            document.removeEventListener('mouseup', handleMouseUpRef.current);
          }
        }
        chartRef.current.remove();
      }
      chartRef.current = null;
      seriesRef.current = null;
      volRef.current = null;
      setChartReady(false);
    };
  }, []);

  // ------- set data when candles change
  useEffect(() => {
    if (!seriesRef.current || !volRef.current || !candles?.length || !chartReady) return;
    
    // Sanitizar datos: saltar velas con NaN/null
    const validCandles = candles.filter(c => 
      Number.isFinite(c.o) && 
      Number.isFinite(c.h) && 
      Number.isFinite(c.l) && 
      Number.isFinite(c.c) && 
      Number.isFinite(c.t) &&
      c.t > 0
    );
    
    if (validCandles.length < 2) {
      console.warn('[CandleChart] Not enough valid candles to display chart');
      return;
    }
    
    const data = validCandles.map(c => ({ 
      time: Math.floor(c.t/1000) as Time, 
      open: c.o, 
      high: c.h, 
      low: c.l, 
      close: c.c 
    }));

    // Datos de volumen
    const volData = validCandles.map((c, i) => ({
      time: Math.floor(c.t / 1000) as Time,
      value: c.v,
      color: (i === 0 ? "#64748b" : (c.c >= validCandles[i-1].c ? "#22c55e" : "#ef4444"))
    }));
    
    // Guardar el estado actual del zoom antes de actualizar datos
    const currentZoomState = userZoomStateRef.current;
    
    seriesRef.current.setData(data);
    volRef.current.setData(volData);
    
    // Si el usuario tenía un zoom personalizado, restaurarlo
    if (currentZoomState.isUserZoomed && currentZoomState.visibleRange) {
      // Pequeño delay para asegurar que los datos se hayan procesado
      setTimeout(() => {
        if (chartRef.current && currentZoomState.visibleRange) {
          const { from, to } = currentZoomState.visibleRange;
          // Validar que los valores no sean null/NaN antes de setVisibleRange
          if (from != null && to != null && Number.isFinite(from) && Number.isFinite(to)) {
            chartRef.current.timeScale().setVisibleRange({ from, to });
          }
        }
      }, 50);
    } else {
      // Solo hacer fitContent si el usuario no tenía zoom personalizado
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles, chartReady]);

  // ------- click en chart cuando está "armed"
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const onClick = () => {
      if (!armed) return;
      const px = lastPxRef.current;
      if (!px) return;

      // dibujar línea de entrada (reemplaza si existía)
      if (entryLineRef.current) { 
        series.removePriceLine(entryLineRef.current); 
      }
      entryLineRef.current = series.createPriceLine({ 
        price: px, 
        color: "#93c5fd", 
        lineStyle: 2, 
        title: `Entry ${px.toFixed(2)}` 
      });

      // abrir confirm mini (DOM simple)
      openMiniConfirm(px);
      setArmed(false);
    };

    const sub = chart.subscribeClick(onClick);
    return () => chart.unsubscribeClick(sub);
  }, [armed, candles]);

  // ------- mini confirm
  function openMiniConfirm(price: number) {
    const root = elRef.current!;
    const el = document.createElement("div");
    el.className = "absolute right-4 top-16 z-20 bg-neutral-900/95 border border-white/10 rounded-xl p-3 flex gap-2 items-center";
    el.innerHTML = `
      <span class="text-sm text-gray-200 mr-2">Entry: <b>${price.toFixed(2)}</b></span>
      <input id="qtQty" type="number" min="0" step="0.000001" class="w-24 bg-neutral-800 text-gray-100 px-2 py-1 rounded-md outline-none border border-white/10" placeholder="qty">
      <button id="qtBuy"  class="px-3 py-1 rounded-md bg-emerald-600 text-white">BUY</button>
      <button id="qtSell" class="px-3 py-1 rounded-md bg-rose-600 text-white">SELL</button>
      <button id="qtX"    class="px-2 py-1 rounded-md bg-neutral-800 text-gray-300 border border-white/10">×</button>
    `;
    root.appendChild(el);

    // pre-rellenar qty por riesgo (5%)
    try {
      const equity = (window as any).__QT_EQUITY__ ?? 10000; // reemplaza por tu estado real
      const maxQty = maxQtyByRisk(equity, price, 0.05);
      (el.querySelector("#qtQty") as HTMLInputElement).value = String(maxQty);
    } catch {}

    const close = () => { 
      if (root.contains(el)) {
        root.removeChild(el); 
      }
    };

    (el.querySelector("#qtX") as HTMLButtonElement).onclick = close;
    (el.querySelector("#qtBuy") as HTMLButtonElement).onclick = () => confirmTrade("buy");
    (el.querySelector("#qtSell") as HTMLButtonElement).onclick = () => confirmTrade("sell");

    const confirmTrade = (side: "buy" | "sell") => {
      const qty = +(el.querySelector("#qtQty") as HTMLInputElement).value || 0;
      // marcador visual
      const time = (candles?.length ? Math.floor(candles[candles.length-1].t/1000) : Math.floor(Date.now()/1000)) as Time;
      const m: Marker = side === "buy"
        ? { time, position: "belowBar", color: "#22c55e", shape: "arrowUp", text: `BUY ${qty}` }
        : { time, position: "aboveBar", color: "#ef4444", shape: "arrowDown", text: `SELL ${qty}` };
      setMarkers(prev => {
        const next = [...prev, m];
        seriesRef.current?.setMarkers(next);
        return next;
      });

      // evento para tu executor/paper-engine
      window.dispatchEvent(new CustomEvent("qt:order", { detail: { side, symbol, price, qty } }));
      close();
    };
  }

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
      {/* Indicadores de controles */}
      <div className="absolute top-2 right-2 z-10 bg-gray-800/80 text-white text-xs px-2 py-1 rounded-md border border-gray-600 space-y-1">
        <div>
          <span className="text-gray-300">Zoom: </span>
          <span className="text-yellow-400 font-mono">Ctrl + Scroll</span>
        </div>
        <div>
          <span className="text-gray-300">Pan: </span>
          <span className="text-blue-400 font-mono">Click + Drag</span>
        </div>
      </div>

      {/* Botón Trade from Chart */}
      <button
        onClick={() => setArmed(v => !v)}
        className={`absolute top-2 left-2 z-10 px-3 py-1 rounded-md border text-sm font-medium transition-colors ${
          armed 
            ? "bg-amber-600 text-white border-amber-500" 
            : "bg-neutral-800 text-gray-200 border-white/10 hover:bg-neutral-700"
        }`}
        title="Trade from Chart"
      >
        {armed ? "Click price…" : "Trade from Chart"}
      </button>
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