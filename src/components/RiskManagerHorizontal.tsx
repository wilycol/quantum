'use client';
import React, { useState, useEffect } from 'react';
import { useRisk } from '@/lib/riskStore';
import { usePortfolio } from '@/lib/portfolioStore';
import { useEventBus } from '@/lib/eventBus';
import { useMarket } from '@/lib/marketStore';
import AssetSelector from './AssetSelector';

interface RiskManagerHorizontalProps {
  className?: string;
}

export default function RiskManagerHorizontal({ className = '' }: RiskManagerHorizontalProps) {
  const {
    level,
    limits,
    dailyPnL,
    dailyVolume,
    openPositions,
    killSwitch,
    whitelist,
    setLevel,
    setLimits,
    updateDailyStats,
    setOpenPositions,
    toggleKillSwitch,
    addToWhitelist,
    removeFromWhitelist,
    canTrade,
  } = useRisk();

  const { balance, calculateTotalPnL, positions, addPosition, closePosition } = usePortfolio();
  const { trades, wsConnected } = useEventBus();
  const { lastPrice, symbol: currentSymbol, setSymbol } = useMarket();
  const [riskAlerts, setRiskAlerts] = useState<string[]>([]);

  const riskLevels: { value: RiskLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Med', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
    { value: 'custom', label: 'Custom', color: 'bg-blue-500' },
  ];

  // Process trades for risk management
  useEffect(() => {
    if (trades.length > 0) {
      const latestTrade = trades[trades.length - 1];
      if (latestTrade.type === 'order/filled') {
        // Update open positions count
        const newCount = openPositions + (latestTrade.side === 'BUY' ? 1 : -1);
        setOpenPositions(Math.max(0, newCount));
        
        // Add position to portfolio
        if (latestTrade.side === 'BUY') {
          addPosition({
            symbol: latestTrade.symbol,
            side: 'LONG',
            quantity: latestTrade.quantity,
            entryPrice: latestTrade.price,
            currentPrice: latestTrade.price,
            pnl: 0,
            pnlPercent: 0,
            timestamp: latestTrade.t
          });
        }
        
        // Update daily stats
        updateDailyStats(latestTrade.quantity * latestTrade.price, latestTrade.pnl || 0);
      }
    }
  }, [trades, openPositions, setOpenPositions, addPosition, updateDailyStats]);

  // Update P&L for open positions
  useEffect(() => {
    if (lastPrice && positions.length > 0) {
      positions.forEach(position => {
        if (position.symbol === currentSymbol) {
          const pnl = (lastPrice - position.entryPrice) * position.quantity;
          const pnlPercent = ((lastPrice - position.entryPrice) / position.entryPrice) * 100;
          
          // Update position in portfolio
          // Note: This would need a proper updatePosition method in portfolioStore
        }
      });
    }
  }, [lastPrice, positions, currentSymbol]);

  // Check risk limits and generate alerts
  useEffect(() => {
    const alerts: string[] = [];
    
    if (dailyPnL < limits.dailyLossLimit) {
      alerts.push(`Daily loss limit reached: ${dailyPnL.toFixed(2)}%`);
    }
    
    if (openPositions >= limits.maxOpenPositions) {
      alerts.push(`Max open positions reached: ${openPositions}`);
    }
    
    if (Math.abs(dailyPnL) > limits.dailyLossLimit * 0.8) {
      alerts.push(`Approaching daily loss limit: ${dailyPnL.toFixed(2)}%`);
    }
    
    setRiskAlerts(alerts);
  }, [dailyPnL, openPositions, limits]);

  const handleRiskLevelChange = (newLevel: RiskLevel) => {
    setLevel(newLevel);
    
    // Apply preset limits based on risk level
    switch (newLevel) {
      case 'low':
        setLimits({
          maxOrderPct: 0.01, // 1%
          maxDailyPct: 0.05, // 5%
          maxOpenPositions: 2,
          stopLossPct: 0.02, // 2%
          dailyLossLimit: -0.03 // -3%
        });
        break;
      case 'medium':
        setLimits({
          maxOrderPct: 0.02, // 2%
          maxDailyPct: 0.10, // 10%
          maxOpenPositions: 5,
          stopLossPct: 0.03, // 3%
          dailyLossLimit: -0.05 // -5%
        });
        break;
      case 'high':
        setLimits({
          maxOrderPct: 0.05, // 5%
          maxDailyPct: 0.20, // 20%
          maxOpenPositions: 10,
          stopLossPct: 0.05, // 5%
          dailyLossLimit: -0.10 // -10%
        });
        break;
    }
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Risk Manager</h3>
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">Live</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Kill Switch:</span>
          <button
            onClick={toggleKillSwitch}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              killSwitch 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {killSwitch ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* Asset Selection */}
        <div className="space-y-2">
          <AssetSelector
            selectedSymbol={currentSymbol}
            onSymbolChange={setSymbol}
            className="w-full"
          />
          <div className="text-xs text-gray-400">
            Current: {currentSymbol} - ${lastPrice?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Risk Level */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Risk Level</label>
          <div className="flex gap-1">
            {riskLevels.map((risk) => (
              <button
                key={risk.value}
                onClick={() => handleRiskLevelChange(risk.value)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  level === risk.value
                    ? `${risk.color} text-white`
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {risk.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Limits */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Risk Limits</label>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Max Trade:</span>
              <span className="text-white">{(limits.maxOrderPct * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Daily:</span>
              <span className="text-white">{(limits.maxDailyPct * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Max Positions:</span>
              <span className="text-white">{limits.maxOpenPositions}</span>
            </div>
          </div>
        </div>

        {/* Status & Alerts */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Status</label>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Daily P&L:</span>
              <span className={`${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dailyPnL.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Positions:</span>
              <span className="text-white">{openPositions}/{limits.maxOpenPositions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Can Trade:</span>
              <span className={`${canTrade ? 'text-green-400' : 'text-red-400'}`}>
                {canTrade ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Market Data */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Market Data</label>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Price:</span>
              <span className="text-white">${lastPrice?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">24h Change:</span>
              <span className="text-green-400">+2.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume:</span>
              <span className="text-white">1.2M</span>
            </div>
          </div>
        </div>

        {/* Trading Performance */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Performance</label>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Trades:</span>
              <span className="text-white">{trades.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Win Rate:</span>
              <span className="text-green-400">75%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Balance:</span>
              <span className="text-white">${balance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h4 className="text-sm font-medium text-red-400 mb-2">Risk Alerts</h4>
          <ul className="text-xs text-red-300 space-y-1">
            {riskAlerts.map((alert, index) => (
              <li key={index}>• {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Whitelist Management - Full Width */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-300">Asset Whitelist</h4>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400">{whitelist.length} assets selected</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Quick Add:</span>
              <div className="flex gap-1">
                {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'].map(symbol => (
                  <button
                    key={symbol}
                    onClick={() => {
                      if (!whitelist.includes(symbol)) {
                        addToWhitelist(symbol);
                      }
                    }}
                    disabled={whitelist.includes(symbol)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      whitelist.includes(symbol)
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {whitelist.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {whitelist.map(symbol => (
              <span
                key={symbol}
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-lg border border-gray-600"
              >
                <span className="font-medium">{symbol}</span>
                <button
                  onClick={() => removeFromWhitelist(symbol)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">
            No assets in whitelist. Use the quick add buttons above or the asset selector to add assets.
          </div>
        )}
      </div>
    </div>
  );
}
