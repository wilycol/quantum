// src/app/qcore/components/ChartPanel.tsx
// Chart panel with overlays and markers for QuantumCore v2

import React, { useState, useEffect } from 'react';
import { 
  useBroker,
  useStrategy,
  useAssets,
  useVolumeOn,
  useGrid,
  useBinary,
  useKPIs
} from '../hooks/useQcoreState';
import { useEventBus } from '../../../hooks/useEventBus';
import { CandlesCore } from './CandlesCore';
import { formatPrice } from '../lib/formatters';

interface ChartPanelProps {
  className?: string;
}

export default function ChartPanel({ className = '' }: ChartPanelProps) {
  // ALL HOOKS AT THE TOP - NO CONDITIONAL HOOKS
  const [ready, setReady] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [markers, setMarkers] = useState<any[]>([]);
  const [candlesSafe, setCandlesSafe] = useState<any[]>([]);
  const [volumeSafe, setVolumeSafe] = useState<any[]>([]);

  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const assets = useAssets();
  const volumeOn = useVolumeOn();
  const grid = useGrid();
  const binary = useBinary();
  const kpis = useKPIs();

  // WebSocket integration
  const { connected: wsConnected, onPreview, onExecuted } = useEventBus({
    autoConnect: true,
    debug: false
  });

  // Set up event listeners
  useEffect(() => {
    const unsubscribePreview = onPreview((event) => {
      handleWebSocketEvent(event as any);
    });
    
    const unsubscribeExecuted = onExecuted((event) => {
      handleWebSocketEvent(event as any);
    });
    
    return () => {
      unsubscribePreview();
      unsubscribeExecuted();
    };
  }, [onPreview, onExecuted]);

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

  // Normalize/filter data ALWAYS, even if empty (hook cannot be conditional)
  useEffect(() => {
    const candles = generateMockCandles();
    const volume = generateMockVolume();
    
    const norm = (candles ?? [])
      .filter(c => Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close) && Number.isFinite(c.time))
      .map(c => ({ ...c, time: c.time > 2e10 ? Math.floor(c.time/1000) : c.time }));
    setCandlesSafe(norm);
    
    const vol = (volume ?? [])
      .filter(v => Number.isFinite(v.value) && Number.isFinite(v.time))
      .map(v => ({ ...v, time: v.time > 2e10 ? Math.floor(v.time/1000) : v.time }));
    setVolumeSafe(vol);
  }, []); // Empty dependency array - only run once

  // Mock data generators
  function generateMockCandles() {
    const now = Date.now();
    const candles = [];
    
    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60000) / 1000; // 1 minute intervals
      const basePrice = 50000 + Math.sin(i * 0.1) * 1000;
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 200;
      const high = Math.max(open, close) + Math.random() * 50;
      const low = Math.min(open, close) - Math.random() * 50;

      candles.push({
        time,
        open,
        high,
        low,
        close
      });
    }

    return candles;
  }

  function generateMockVolume() {
    const now = Date.now();
    const volume = [];
    
    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60000) / 1000;
      const vol = Math.random() * 1000;

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
    price: currentPrice + (Math.random() - 0.5) * 100,
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
              {formatPrice(currentPrice)}
            </div>
          </div>
          
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              WS: {wsConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="mb-4">
        {!ready || candlesSafe.length < 2 ? (
          <div className="flex items-center justify-center h-[420px] bg-gray-800 rounded-lg">
            <div className="text-gray-400">Cargando velas...</div>
          </div>
        ) : (
          <CandlesCore
            candles={candlesSafe}
            volume={volumeSafe}
            showVolume={volumeOn}
            mode={strategy === 'grid' ? 'grid' : 'binary'}
            gridCfg={strategy === 'grid' ? grid : null}
            binaryCfg={strategy === 'binary' ? { 
              strike: currentPrice, 
              expiry: binary.expiry 
            } : null}
            onReady={() => setReady(true)}
          />
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
              <span className="text-white ml-2">{(grid.stepPct * 100).toFixed(1)}%</span>
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
                {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
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
            <span className="text-white ml-2">{kpis.winRate.toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-gray-400">P&L:</span>
            <span className={`ml-2 ${kpis.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {kpis.totalPnL >= 0 ? '+' : ''}{kpis.totalPnL.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Volume:</span>
            <span className="text-white ml-2">{kpis.totalVolume.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}