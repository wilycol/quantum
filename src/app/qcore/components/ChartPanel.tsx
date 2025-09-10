// src/app/qcore/components/ChartPanel.tsx
// Chart panel with overlays and markers for QuantumCore v2

import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, UTCTimestamp } from 'lightweight-charts';
import { 
  useBroker,
  useStrategy,
  useAssets,
  useVolumeOn,
  useGrid,
  useBinary,
  useKPIs
} from '../hooks/useQcoreState';
import { useWS } from '../../providers/WSProvider';
import { useMarket } from '../../../../lib/marketStore';
import { useChartInteractions } from '../../../lib/useChartInteractions';
import { useChartUI } from '../../../lib/chartUiStore';
import { formatPrice } from '../lib/formatters';

interface ChartPanelProps {
  className?: string;
}

export default function ChartPanel({ className = '' }: ChartPanelProps) {
  // ALL HOOKS AT THE TOP - NO CONDITIONAL HOOKS
  const [ready, setReady] = useState(false);
  const [markers, setMarkers] = useState<any[]>([]);
  const divRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi['addCandlestickSeries']> | null>(null);

  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const assets = useAssets();
  const volumeOn = useVolumeOn();
  const grid = useGrid();
  const binary = useBinary();
  const kpis = useKPIs();

  // WebSocket integration
  const { connected: wsConnected, latencyMs } = useWS();
  
  // Market data integration
  const { candles, lastPrice, binanceConnected, loading, init } = useMarket();
  
  // Chart interactions
  const symbol = 'BTCUSDT';
  const interval = '1m';
  const key = `${symbol}:${interval}`;
  const { reapplyRange, followRight, followRightNow } = useChartInteractions(chartRef.current, divRef.current, key);

  // Handle WebSocket events - MOVED AFTER HOOKS
  function handleWebSocketEvent(event: any) {
    console.log('[ChartPanel] WebSocket event received:', event);
    
    // Update markers based on event type
    if (event && event.t) {
      const newMarker = {
        id: Date.now(),
        type: event.t,
        timestamp: event.ts || Date.now(),
        data: event
      };
      
      setMarkers(prev => [...prev.slice(-9), newMarker]); // Keep last 10 markers
    }
  }

  // Initialize market data
  useEffect(() => {
    init();
  }, [init]);

  // Create chart
  useEffect(() => {
    if (!divRef.current) return;
    const chart = createChart(divRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#ccc' },
      grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, rightOffset: 8, barSpacing: 6 },
      handleScale: {
        mouseWheel: false,                 // ⬅️ desactivamos zoom con rueda nativo
        pinch: true,
        axisPressedMouseMove: { time: true, price: true },
      },
      handleScroll: { pressedMouseMove: true, mouseWheel: false, horzTouchDrag: true, vertTouchDrag: false },
    });

    const series = chart.addCandlestickSeries();
    chartRef.current = chart;
    seriesRef.current = series;
    setReady(true);

    const onResize = () => chart.applyOptions({ width: divRef.current!.clientWidth });
    onResize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.remove(); };
  }, []);

  // snapshot inicial
  useEffect(() => {
    if (!ready || !seriesRef.current) return;
    if (candles && candles.length > 0) {
      seriesRef.current.setData(
        candles.map(c => ({ time: (c[0]/1000) as UTCTimestamp, open: c[1], high: c[2], low: c[3], close: c[4] }))
      );
      // promover precio desde snapshot (mejora de UX)
      const last = candles.at(-1);
      if (last) useMarket.setState({ lastPrice: last[4] });
      if (!followRight) reapplyRange();
      else chartRef.current?.timeScale().scrollToRealTime();
    }
  }, [ready, candles, followRight, reapplyRange]);

  // tick en vivo
  useEffect(() => {
    if (!ready || !seriesRef.current || !candles || candles.length === 0) return;
    const last = candles[candles.length - 1];
    seriesRef.current.update({
      time: (last[0]/1000) as UTCTimestamp, open: last[1], high: last[2], low: last[3], close: last[4]
    });
    if (!followRight) reapplyRange();
  }, [candles, ready, followRight, reapplyRange]);

  // Mock data generators
  function generateMockCandles() {
    const now = Date.now();
    const candles = [];
    let basePrice = 50000; // Starting price
    
    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60000) / 1000; // 1 minute intervals
      
      // More realistic price movement
      const trend = Math.sin(i * 0.05) * 0.02; // Long-term trend
      const volatility = (Math.random() - 0.5) * 0.01; // Random volatility
      const priceChange = basePrice * (trend + volatility);
      
      const open = basePrice;
      const close = basePrice + priceChange;
      const high = Math.max(open, close) + Math.random() * Math.abs(priceChange) * 0.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(priceChange) * 0.5;
      
      // Update base price for next candle
      basePrice = close;

      candles.push({
        time,
        open,
        high,
        low,
        close
      });
    }

    // Set current price to the last candle's close
    if (candles.length > 0) {
      setCurrentPrice(candles[candles.length - 1].close);
    }

    return candles;
  }

  function generateMockVolume() {
    const now = Date.now();
    const volume = [];
    
    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60000) / 1000;
      // More realistic volume with some correlation to price movement
      const baseVolume = 500 + Math.random() * 1000;
      const volatility = Math.random() * 0.5 + 0.5; // 0.5 to 1.0 multiplier
      const vol = baseVolume * volatility;

      volume.push({
        time,
        value: vol
      });
    }

    return volume;
  }

  // Mini Market Watch - limited to active assets
  const marketWatchData = assets.slice(0, 5).map(asset => ({
    symbol: asset,
    price: (lastPrice || 0) + (Math.random() - 0.5) * 100,
    change: (Math.random() - 0.5) * 5,
    changePercent: (Math.random() - 0.5) * 2
  }));

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Chart Panel</h3>
        <div className="flex items-center space-x-4">
          {/* Current Price */}
          <div className="text-right">
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-lg font-bold text-white">
              {formatPrice(lastPrice || 0)}
            </div>
          </div>
          
          {/* Status Indicators */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-400">
                WS: {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
              {wsConnected && latencyMs != null && (
                <span className="text-xs text-gray-500">· {latencyMs}ms</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${binanceConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-gray-400">
                Market: {binanceConnected ? 'Live' : 'Backfill'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex items-center gap-3 text-xs mb-2">
        <span>Current Price: <b>{lastPrice?.toFixed(2) ?? '—'}</b></span>
        <span>· Market: <b className={binanceConnected ? 'text-green-400' : 'text-yellow-400'}>
          {binanceConnected ? 'Live' : 'Backfill'}
        </b></span>
        <span>· View: <b className={followRight ? 'text-green-400' : 'text-sky-400'}>
          {followRight ? 'Following' : 'Custom'}
        </b></span>
        {!followRight && (
          <button onClick={followRightNow} className="px-2 py-1 rounded bg-zinc-800">Follow Right</button>
        )}
        <span className="ml-auto text-zinc-400">Zoom: CTRL + rueda · Pan: arrastrar</span>
      </div>

      {/* Main Chart */}
      <div className="mb-4">
        {loading || !ready || !candles || candles.length < 2 ? (
          <div className="flex items-center justify-center h-[420px] bg-gray-800 rounded-lg">
            <div className="text-gray-400">Cargando velas...</div>
          </div>
        ) : (
          <div ref={divRef} className="h-[420px] w-full rounded border border-zinc-800" />
        )}
      </div>

      {/* Strategy-specific Info */}
      {strategy === 'grid' && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-white mb-2">Grid Configuration</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Size:</span>
              <span className="text-white ml-2">{grid.size}</span>
            </div>
            <div>
              <span className="text-gray-400">Range:</span>
              <span className="text-white ml-2">
                {formatPrice(grid.lower)} - {formatPrice(grid.upper)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Step:</span>
              <span className="text-white ml-2">{((grid.stepPct || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {strategy === 'binary' && (
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-white mb-2">Binary Configuration</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Amount:</span>
              <span className="text-white ml-2">${binary.amount}</span>
            </div>
            <div>
              <span className="text-gray-400">Expiry:</span>
              <span className="text-white ml-2">{binary.expiry}s</span>
            </div>
            <div>
              <span className="text-gray-400">Direction:</span>
              <span className="text-white ml-2">{binary.direction}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mini Market Watch */}
      <div className="bg-gray-800 rounded-lg p-3 mb-4">
        <h4 className="text-sm font-semibold text-white mb-2">Market Watch</h4>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {marketWatchData.map((item) => (
            <div key={item.symbol} className="text-center">
              <div className="text-gray-400">{item.symbol}</div>
              <div className="text-white font-semibold">
                {formatPrice(item.price)}
              </div>
              <div className={`${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.change >= 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Markers */}
      {markers.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-white mb-2">Recent Events</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {markers.slice(-5).map((marker) => (
              <div key={marker.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  {new Date(marker.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-white">
                  {marker.type === 'preview' && '◇ Preview'}
                  {marker.type === 'executed' && '◆ Executed'}
                  {marker.type === 'binary_preview' && '◇ Binary Preview'}
                  {marker.type === 'binary_executed' && '◆ Binary Executed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs Summary */}
      <div className="bg-gray-800 rounded-lg p-3 mt-4">
        <h4 className="text-sm font-semibold text-white mb-2">Performance</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Total Trades:</span>
            <span className="text-white ml-2">{kpis.totalTrades}</span>
          </div>
          <div>
            <span className="text-gray-400">Win Rate:</span>
            <span className="text-white ml-2">{(kpis.winRate || 0).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-400">P&L:</span>
            <span className={`ml-2 ${(kpis.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {(kpis.totalPnL || 0) >= 0 ? '+' : ''}{(kpis.totalPnL || 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Volume:</span>
            <span className="text-white ml-2">{(kpis.totalVolume || 0).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}