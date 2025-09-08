// src/app/qcore/components/ChartPanel.tsx
// Chart panel with overlays and markers for QuantumCore v2

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { 
  useBroker,
  useStrategy,
  useAssets,
  useVolumeOn,
  useGrid,
  useBinary,
  useKPIs
} from '../hooks/useQcoreState';
import { useWebsocket } from '../hooks/useWebsocket';
import { WsEvent, ChartMarker, ChartOverlay } from '../lib/types';
import { formatPrice, formatCountdown } from '../lib/formatters';

interface ChartPanelProps {
  className?: string;
}

export default function ChartPanel({ className = '' }: ChartPanelProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const assets = useAssets();
  const volumeOn = useVolumeOn();
  const grid = useGrid();
  const binary = useBinary();
  const kpis = useKPIs();

  // Local state
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [markers, setMarkers] = useState<ChartMarker[]>([]);
  const [overlays, setOverlays] = useState<ChartOverlay[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [countdown, setCountdown] = useState<string>('');

  // WebSocket connection
  const { connected: wsConnected, lastEvent } = useWebsocket({
    onEvent: handleWebSocketEvent
  });

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
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

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444'
    });

    // Add volume series if enabled
    let volumeSeries: ISeriesApi<'Histogram'> | null = null;
    if (volumeOn) {
      volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume'
        },
        priceScaleId: 'volume'
      });
    }

    chartApiRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Mock data for development
    const mockData = generateMockData();
    candlestickSeries.setData(mockData.candles);
    if (volumeSeries && mockData.volume) {
      volumeSeries.setData(mockData.volume);
    }

    // Set current price
    if (mockData.candles.length > 0) {
      setCurrentPrice(mockData.candles[mockData.candles.length - 1].close);
    }

    return () => {
      chart.remove();
    };
  }, [volumeOn]);

  // Update overlays when strategy changes
  useEffect(() => {
    if (!chartApiRef.current) return;

    // Clear existing overlays
    overlays.forEach(overlay => {
      if (overlay.type === 'grid') {
        // Remove grid lines
        chartApiRef.current?.removePriceLine(overlay.id);
      }
    });

    const newOverlays: ChartOverlay[] = [];

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

  // Handle WebSocket events
  function handleWebSocketEvent(event: WsEvent) {
    console.log('Chart received event:', event);
    // Markers are handled in useEffect above
  }

  // Create marker from WebSocket event
  function createMarkerFromEvent(event: WsEvent): ChartMarker | null {
    if (!event.ts || !currentPrice) return null;

    const time = Math.floor(event.ts / 1000) as Time;
    const price = event.price || event.strike || currentPrice;

    let type: 'preview' | 'executed' | 'cancel' = 'preview';
    let side: 'BUY' | 'SELL' | undefined;
    let direction: 'CALL' | 'PUT' | undefined;

    if (event.t === 'preview' || event.t === 'binary_preview') {
      type = 'preview';
      side = event.side;
      direction = event.dir;
    } else if (event.t === 'executed' || event.t === 'binary_executed') {
      type = 'executed';
      side = event.side;
      direction = event.dir;
    }

    return {
      id: `marker_${event.ts}`,
      type,
      time,
      price,
      side,
      direction,
      data: event
    };
  }

  // Generate mock data for development
  function generateMockData() {
    const now = Date.now();
    const candles = [];
    const volume = [];

    for (let i = 100; i >= 0; i--) {
      const time = (now - (i * 60000)) / 1000; // 1 minute intervals
      const basePrice = 50000 + Math.sin(i * 0.1) * 1000;
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 200;
      const high = Math.max(open, close) + Math.random() * 50;
      const low = Math.min(open, close) - Math.random() * 50;

      candles.push({
        time: time as Time,
        open,
        high,
        low,
        close
      });

      if (volumeOn) {
        volume.push({
          time: time as Time,
          value: Math.random() * 1000,
          color: close > open ? '#22c55e' : '#ef4444'
        });
      }
    }

    return { candles, volume };
  }

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg ${className}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">Chart</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Pair:</span>
            <span className="text-sm text-white">{assets[0] || 'BTCUSDT'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Price:</span>
            <span className="text-sm text-white">{formatPrice(currentPrice)}</span>
          </div>
        </div>

        {/* Binary Countdown */}
        {strategy === 'binary' && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Expiry:</span>
            <span className="text-sm text-orange-500 font-semibold">{countdown}</span>
          </div>
        )}

        {/* WebSocket Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <div ref={chartRef} className="w-full h-96" />
        
        {/* Mini HUD Overlay */}
        <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Pos:</span>
              <span className="text-white">0.00891</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">P&L:</span>
              <span className="text-red-500">-$2.89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SL:</span>
              <span className="text-red-400">11153</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">TP:</span>
              <span className="text-green-400">11315</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">R:R:</span>
              <span className="text-blue-400">4.3</span>
            </div>
          </div>
        </div>

        {/* Strategy-specific Controls */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3">
          {strategy === 'grid' ? (
            <div className="text-xs space-y-1">
              <div className="text-gray-400">Grid Controls</div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size:</span>
                <span className="text-white">{grid.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Range:</span>
                <span className="text-white">{formatPrice(grid.lower)} - {formatPrice(grid.upper)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Step:</span>
                <span className="text-white">{(grid.stepPct * 100).toFixed(1)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-xs space-y-1">
              <div className="text-gray-400">Binary Controls</div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">${binary.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Direction:</span>
                <span className={binary.direction === 'CALL' ? 'text-green-400' : 'text-red-400'}>
                  {binary.direction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expiry:</span>
                <span className="text-white">{binary.expiry}s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Market Watch */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Market Watch:</span>
          <div className="flex space-x-3">
            {assets.slice(0, 3).map((asset) => (
              <div key={asset} className="flex items-center space-x-1">
                <span className="text-xs text-white">{asset}</span>
                <span className="text-xs text-green-500">+3.4%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
