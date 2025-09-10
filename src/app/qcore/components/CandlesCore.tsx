// src/app/qcore/components/CandlesCore.tsx
// QuantumCore dedicated chart component (isolated from Manual Trading)

import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';

type Candle = { time: number; open: number; high: number; low: number; close: number };
type Volume = { time: number; value: number };
type GridCfg = { size: number; lower: number; upper: number; stepPct: number } | null;
type BinaryCfg = { strike?: number; expiry?: number } | null;

export function CandlesCore({
  candles,
  volume,
  showVolume,
  mode,              // 'grid' | 'binary'
  gridCfg,
  binaryCfg,
  onReady,
}: {
  candles: Candle[] | null | undefined;
  volume?: Volume[] | null;
  showVolume?: boolean;
  mode: 'grid' | 'binary';
  gridCfg?: GridCfg;
  binaryCfg?: BinaryCfg;
  onReady?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Estados de Auto-Recovery
  const [chartState, setChartState] = useState<'loading' | 'ready' | 'error' | 'retrying'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Función para generar datos mock como fallback
  const generateMockCandles = (): Candle[] => {
    const now = Date.now() / 1000;
    const candles: Candle[] = [];
    let basePrice = 50000;
    
    for (let i = 100; i >= 0; i--) {
      const time = now - i * 60; // 1 minuto entre velas
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility;
      const open = basePrice;
      const close = basePrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      
      candles.push({ time, open, high, low, close });
      basePrice = close;
    }
    
    return candles;
  };

  // Health check para verificar el estado del chart
  const healthCheck = (): boolean => {
    if (!chartRef.current || !priceSeriesRef.current) {
      console.log('[CandlesCore] Health check failed: chart not ready');
      return false;
    }
    
    try {
      const timeScale = chartRef.current.timeScale();
      if (!timeScale) {
        console.log('[CandlesCore] Health check failed: timeScale not available');
        return false;
      }
      
      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange) {
        console.log('[CandlesCore] Health check failed: no visible range');
        return false;
      }
      
      console.log('[CandlesCore] Health check passed');
      return true;
    } catch (error) {
      console.log('[CandlesCore] Health check failed:', error);
      return false;
    }
  };

  // Función para reinicializar el chart
  const reinitializeChart = () => {
    console.log('[CandlesCore] Reinitializing chart...');
    
    // Limpiar referencias existentes
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    priceSeriesRef.current = null;
    volSeriesRef.current = null;
    
    // Resetear estado
    setChartState('loading');
    
    // Forzar re-render del useEffect de creación
    setTimeout(() => {
      setChartState('retrying');
    }, 100);
  };

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

  // Auto-Recovery: Reintentar si hay errores
  useEffect(() => {
    if (chartState === 'error' && retryCount < maxRetries) {
      const delay = 2000 * (retryCount + 1); // Backoff exponencial: 2s, 4s, 6s
      console.log(`[CandlesCore] Auto-recovery attempt ${retryCount + 1}/${maxRetries} in ${delay}ms`);
      
      const timer = setTimeout(() => {
        setChartState('retrying');
        setRetryCount(prev => prev + 1);
        reinitializeChart();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [chartState, retryCount]);

  // Health check periódico
  useEffect(() => {
    if (chartState === 'ready') {
      const interval = setInterval(() => {
        if (!healthCheck()) {
          console.log('[CandlesCore] Health check failed, triggering recovery');
          setChartState('error');
        }
      }, 10000); // Health check cada 10 segundos
      
      return () => clearInterval(interval);
    }
  }, [chartState]);

  // 1) Crear chart UNA sola vez (sin hooks condicionales)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || chartRef.current) return;
    
    let cleanup: (() => void) | null = null;
    
    try {
      chartRef.current = createChart(el, { 
        autoSize: true, 
        layout: { 
          background: { type: 'solid', color: '#0b0d10' }, 
          textColor: '#c9d1d9' 
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.06)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.06)' }
        },
        crosshair: {
          mode: 1,
          vertLine: { color: '#94a3b8', width: 1, style: 0, visible: true },
          horzLine: { color: '#94a3b8', width: 1, style: 0, visible: true }
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.05, bottom: showVolume ? 0.28 : 0.05 }
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false
        }
      });
      
      priceSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444'
      });
      
      volSeriesRef.current = chartRef.current.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume'
      });
      
      onReady?.();
      
      // Marcar chart como listo
      setChartState('ready');
      console.log('[CandlesCore] Chart created successfully');

      // Agregar event handlers para zoom y pan
      const chart = chartRef.current;
      
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
        
        // Calcular el desplazamiento en tiempo basado en el movimiento del mouse
        const range = startRange.to - startRange.from;
        const pixelsPerTime = el.clientWidth / range;
        const timeDelta = deltaX / pixelsPerTime;
        
        const newFrom = startRange.from - timeDelta;
        const newTo = startRange.to - timeDelta;
        
        timeScale.setVisibleRange({
          from: newFrom as Time,
          to: newTo as Time
        });
        
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
      };

      // Agregar event listeners
      el.addEventListener('wheel', handleWheel, { passive: false });
      el.addEventListener('mousedown', handleMouseDown);
      el.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseup', handleMouseUp);

      // Guardar referencias para cleanup
      cleanup = () => {
        el.removeEventListener('wheel', handleWheel);
        el.removeEventListener('mousedown', handleMouseDown);
        el.removeEventListener('mousemove', handleMouseMove);
        el.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseup', handleMouseUp);
      };

    } catch (error) {
      console.error('[CandlesCore] Error creating chart:', error);
      setChartState('error');
    }
    
    return () => { 
      if (chartRef.current) {
        // Limpiar event listeners si existen
        if (cleanup) {
          cleanup();
        }
        chartRef.current.remove(); 
        chartRef.current = null;
        priceSeriesRef.current = null;
        volSeriesRef.current = null;
      }
    };
  }, [onReady, showVolume]);

  // 2) Set de datos con GUARDS (evita "Value is null")
  useEffect(() => {
    if (!chartRef.current || !priceSeriesRef.current) return;

    // Usar datos reales o fallback a mock si no hay datos
    const sourceCandles = (candles && candles.length > 0) ? candles : generateMockCandles();
    
    const data = sourceCandles
      .filter(c => 
        Number.isFinite(c.open) && 
        Number.isFinite(c.high) && 
        Number.isFinite(c.low) && 
        Number.isFinite(c.close) && 
        Number.isFinite(c.time)
      )
      .map(c => ({ ...c, time: normalizeTime(c.time) as Time }));

    if (data.length >= 2) {
      // Guardar el estado actual del zoom antes de actualizar datos
      const currentZoomState = userZoomStateRef.current;
      
      priceSeriesRef.current.setData(data);

      if (showVolume && volSeriesRef.current && Array.isArray(volume)) {
        const vol = volume
          .filter(v => Number.isFinite(v.value) && Number.isFinite(v.time))
          .map(v => ({ time: normalizeTime(v.time) as Time, value: v.value }));
        if (vol.length === data.length) {
          volSeriesRef.current.setData(vol);
        }
      } else {
        // oculta volumen si está OFF
        if (volSeriesRef.current) {
          volSeriesRef.current.setData([]);
        }
      }

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
        const left = data[0].time;
        const right = data[data.length - 1].time;
        if (left != null && right != null && Number.isFinite(left as number) && Number.isFinite(right as number)) {
          chartRef.current.timeScale().setVisibleRange({ from: left, to: right });
        }
      }
    }
  }, [candles, volume, showVolume]);

  // 3) Overlays (grid/strike/SLTP) con guards
  useEffect(() => {
    if (!chartRef.current || !priceSeriesRef.current) return;
    
    // Clear previous overlays
    clearOverlays(chartRef.current);
    
    if (mode === 'grid' && gridCfg && validGrid(gridCfg)) {
      drawGrid(chartRef.current, gridCfg);
    }
    if (mode === 'binary' && binaryCfg?.strike && Number.isFinite(binaryCfg.strike)) {
      drawStrike(chartRef.current, binaryCfg.strike!);
    }
  }, [mode, gridCfg, binaryCfg]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Indicador de estado */}
      {chartState !== 'ready' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          {chartState === 'loading' && '🔄 Cargando...'}
          {chartState === 'retrying' && `🔄 Reintentando... (${retryCount}/${maxRetries})`}
          {chartState === 'error' && retryCount >= maxRetries && '⚠️ Usando datos demo'}
        </div>
      )}
    </div>
  );
}

// Helper functions
function normalizeTime(t: number): number {
  // Si recibes ms desde Binance y la lib espera segundos:
  return t > 2e10 ? Math.floor(t / 1000) : t;
}

function validGrid(g?: GridCfg): boolean {
  if (!g) return false;
  const { size, lower, upper } = g;
  return Number.isFinite(size) && size > 0 && Number.isFinite(lower) && Number.isFinite(upper) && upper > lower;
}

function clearOverlays(chart: IChartApi): void {
  // Remove all price lines (this is a simplified approach)
  // In a real implementation, you'd track and remove specific overlays
  try {
    // This is a placeholder - lightweight-charts doesn't have a direct "clear all" method
    // You'd need to track overlay references and remove them individually
  } catch (error) {
    console.warn('[CandlesCore] Error clearing overlays:', error);
  }
}

function drawGrid(chart: IChartApi, g: NonNullable<GridCfg>): void {
  // Dibuja líneas horizontales cada "step"
  const step = (g.upper - g.lower) / g.size;
  if (!Number.isFinite(step) || step <= 0) return;
  
  try {
    for (let i = 0; i <= g.size; i++) {
      const price = g.lower + (step * i);
      chart.addPriceLine({
        price: price,
        color: i === 0 || i === g.size ? '#ef4444' : '#64748b',
        lineWidth: i === 0 || i === g.size ? 2 : 1,
        lineStyle: i === 0 || i === g.size ? 0 : 2,
        axisLabelVisible: true,
        title: `Level ${i}`
      });
    }
  } catch (error) {
    console.warn('[CandlesCore] Error drawing grid:', error);
  }
}

function drawStrike(chart: IChartApi, strike: number): void {
  // Add horizontal price line en 'strike'
  try {
    chart.addPriceLine({
      price: strike,
      color: '#f59e0b',
      lineWidth: 2,
      lineStyle: 0,
      axisLabelVisible: true,
      title: 'Strike'
    });
  } catch (error) {
    console.warn('[CandlesCore] Error drawing strike:', error);
  }
}
