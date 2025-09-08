// src/app/qcore/components/ChartPanel.tsx
// Chart panel with overlays and markers for QuantumCore v2

import React, { useState } from 'react';
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
import QcoreCandleChart from './QcoreCandleChart';
import { formatPrice } from '../lib/formatters';

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

  // WebSocket integration
  const { connected: wsConnected, lastEvent } = useEventBus({
    onEvent: handleWebSocketEvent
  });

  // Local state
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [markers, setMarkers] = useState<any[]>([]);

  // Handle WebSocket events
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
        <QcoreCandleChart className="w-full" />
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