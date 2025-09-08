// src/app/qcore/components/QcoreCandleChart.tsx
// QuantumCore CandleChart with WebSocket integration and overlays

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useEventBus } from '../../../hooks/useEventBus';
import { useBroker, useStrategy, useVolumeOn, useGrid, useBinary } from '../hooks/useQcoreState';

interface QcoreCandleChartProps {
  className?: string;
}

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Volume {
  time: Time;
  value: number;
  color: string;
}

interface Marker {
  time: Time;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
  text: string;
}

export default function QcoreCandleChart({ className = '' }: QcoreCandleChartProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const volumeOn = useVolumeOn();
  const grid = useGrid();
  const binary = useBinary();

  // Chart refs
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // State
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [overlays, setOverlays] = useState<any[]>([]);
  const [countdown, setCountdown] = useState<string>('');

  // WebSocket integration
  const { connected, lastEvent, onEvent } = useEventBus();

  // Mock data generator
  const generateMockData = () => {
    const now = Date.now();
    const candles: Candle[] = [];
    const volume: Volume[] = [];
    
    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60000) / 1000; // 1 minute intervals
      const basePrice = 50000 + Math.sin(i * 0.1) * 1000;
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 200;
      const high = Math.max(open, close) + Math.random() * 50;
      const low = Math.min(open, close) - Math.random() * 50;
      const vol = Math.random() * 1000;

      candles.push({
        time: time as Time,
        open,
        high,
        low,
        close
      });

      volume.push({
        time: time as Time,
        value: vol,
        color: close >= open ? '#22c55e' : '#ef4444'
      });
    }

    return { candles, volume };
  };

  // Initialize chart
  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    // Montaje seguro del chart
    if (!chartApiRef.current) {
      chartApiRef.current = createChart(el, {
        layout: {
          background: { color: 'transparent' },
          textColor: '#cbd5e1'
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
          scaleMargins: { top: 0.05, bottom: volumeOn ? 0.28 : 0.05 }
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false
        }
      });

      candlestickSeriesRef.current = chartApiRef.current.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444'
      });

      if (volumeOn) {
        volumeSeriesRef.current = chartApiRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume'
          },
          priceScaleId: 'volume'
        });
      }
    }

    // Mock data for development
    const mockData = generateMockData();
    
    // Sanitizar datos: saltar velas con NaN/null
    const validCandles = mockData.candles.filter(c => 
      Number.isFinite(c.open) && 
      Number.isFinite(c.high) && 
      Number.isFinite(c.low) && 
      Number.isFinite(c.close) && 
      Number.isFinite(c.time as number) &&
      (c.time as number) > 0
    );
    
    if (validCandles.length >= 2) {
      candlestickSeriesRef.current?.setData(validCandles);
      
      if (volumeSeriesRef.current && mockData.volume) {
        const validVolume = mockData.volume.filter(v => 
          Number.isFinite(v.value) && 
          Number.isFinite(v.time as number) &&
          (v.time as number) > 0
        );
        volumeSeriesRef.current.setData(validVolume);
      }

      // Set current price
      if (validCandles.length > 0) {
        setCurrentPrice(validCandles[validCandles.length - 1].close);
      }

      // Set visible range safely
      const left = validCandles[0]?.time;
      const right = validCandles[validCandles.length - 1]?.time;
      if (left != null && right != null && Number.isFinite(left as number) && Number.isFinite(right as number)) {
        chartApiRef.current?.timeScale().setVisibleRange({ from: left, to: right });
      }
    }

    return () => {
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
    };
  }, [volumeOn]);

  // Update overlays when strategy changes
  useEffect(() => {
    if (!chartApiRef.current) return;

    // Clear existing overlays
    overlays.forEach(overlay => {
      if (overlay.type === 'grid') {
        chartApiRef.current?.removePriceLine(overlay.id);
      }
    });

    const newOverlays: any[] = [];

    if (strategy === 'grid') {
      // Add grid overlays
      const stepSize = (grid.upper - grid.lower) / grid.size;
      for (let i = 0; i <= grid.size; i++) {
        const price = grid.lower + (stepSize * i);
        newOverlays.push({
          id: `grid_${i}`,
          type: 'grid',
          data: { price, level: i },
          visible: true
        });

        // Add price line
        chartApiRef.current?.addPriceLine({
          price: price,
          color: i === 0 || i === grid.size ? '#ef4444' : '#64748b',
          lineWidth: i === 0 || i === grid.size ? 2 : 1,
          lineStyle: i === 0 || i === grid.size ? 0 : 2,
          axisLabelVisible: true,
          title: `Level ${i}`
        });
      }
    } else if (strategy === 'binary') {
      // Add binary strike line
      const strikePrice = currentPrice; // Use current price as strike
      newOverlays.push({
        id: 'strike',
        type: 'strike',
        data: { price: strikePrice },
        visible: true
      });

      chartApiRef.current?.addPriceLine({
        price: strikePrice,
        color: '#f59e0b',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'Strike'
      });
    }

    setOverlays(newOverlays);
  }, [strategy, grid, currentPrice]);

  // Update markers when WebSocket events arrive
  useEffect(() => {
    if (lastEvent && candlestickSeriesRef.current) {
      const newMarker = createMarkerFromEvent(lastEvent);
      if (newMarker) {
        setMarkers(prev => [...prev, newMarker]);
        candlestickSeriesRef.current.setMarkers([...markers, newMarker]);
      }
    }
  }, [lastEvent, markers]);

  // Binary countdown effect
  useEffect(() => {
    if (strategy === 'binary' && binary.expiry) {
      const interval = setInterval(() => {
        const expiryTime = Date.now() + (binary.expiry * 1000);
        setCountdown(formatCountdown(expiryTime));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [strategy, binary.expiry]);

  // Helper functions
  const createMarkerFromEvent = (event: any): Marker | null => {
    if (!event || !event.t) return null;

    const time = (Date.now() / 1000) as Time;
    const basePrice = currentPrice;

    switch (event.t) {
      case 'preview':
        return {
          time,
          position: 'aboveBar',
          color: '#3b82f6',
          shape: 'circle',
          text: '◇ Preview'
        };
      case 'executed':
        return {
          time,
          position: 'belowBar',
          color: '#22c55e',
          shape: 'square',
          text: '◆ Executed'
        };
      case 'binary_preview':
        return {
          time,
          position: 'aboveBar',
          color: '#f59e0b',
          shape: 'circle',
          text: '◇ Binary Preview'
        };
      case 'binary_executed':
        return {
          time,
          position: 'belowBar',
          color: '#ef4444',
          shape: 'square',
          text: '◆ Binary Executed'
        };
      default:
        return null;
    }
  };

  const formatCountdown = (expiryTime: number): string => {
    const now = Date.now();
    const diff = expiryTime - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Chart Container */}
      <div
        ref={chartRef}
        className="w-full h-96 bg-gray-900 rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Binary Countdown */}
      {strategy === 'binary' && countdown && (
        <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-mono">
          {countdown}
        </div>
      )}

      {/* WebSocket Status */}
      <div className="absolute top-4 left-4 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-400">
          WS: {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Strategy Info */}
      <div className="absolute bottom-4 left-4 bg-gray-800 text-white px-2 py-1 rounded text-xs">
        {broker.toUpperCase()} - {strategy.toUpperCase()}
      </div>
    </div>
  );
}
