// src/app/qcore/components/CandlesCore.tsx
// QuantumCore dedicated chart component (isolated from Manual Trading)

import { useEffect, useRef } from 'react';
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

  // 1) Crear chart UNA sola vez (sin hooks condicionales)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || chartRef.current) return;
    
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
    } catch (error) {
      console.error('[CandlesCore] Error creating chart:', error);
    }
    
    return () => { 
      if (chartRef.current) {
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

    const data = (candles ?? [])
      .filter(c => 
        Number.isFinite(c.open) && 
        Number.isFinite(c.high) && 
        Number.isFinite(c.low) && 
        Number.isFinite(c.close) && 
        Number.isFinite(c.time)
      )
      .map(c => ({ ...c, time: normalizeTime(c.time) as Time }));

    if (data.length >= 2) {
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

      const left = data[0].time;
      const right = data[data.length - 1].time;
      if (left != null && right != null && Number.isFinite(left as number) && Number.isFinite(right as number)) {
        chartRef.current.timeScale().setVisibleRange({ from: left, to: right });
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

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '400px' }} />;
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
