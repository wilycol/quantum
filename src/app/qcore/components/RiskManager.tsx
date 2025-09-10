'use client';
import React, { useState, useEffect } from 'react';
import { useRisk } from '@/lib/riskStore';
import { usePortfolio } from '@/lib/portfolioStore';
import { useEventBus } from '@/lib/eventBus';
import { useMarket } from '@/lib/marketStore';

interface RiskManagerProps {
  className?: string;
}

export default function RiskManager({ className = '' }: RiskManagerProps) {
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
  const { lastPrice } = useMarket();
  const [newSymbol, setNewSymbol] = useState('');
  const [riskAlerts, setRiskAlerts] = useState<string[]>([]);

  const riskLevels: { value: RiskLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Low Risk', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium Risk', color: 'bg-yellow-500' },
    { value: 'high', label: 'High Risk', color: 'bg-red-500' },
    { value: 'custom', label: 'Custom', color: 'bg-blue-500' },
  ];

  const handleAddSymbol = () => {
    if (newSymbol.trim() && !whitelist.includes(newSymbol.toUpperCase())) {
      addToWhitelist(newSymbol.trim());
      setNewSymbol('');
    }
  };

  // Procesar eventos del EventBus en tiempo real
  useEffect(() => {
    if (!trades || trades.length === 0) return;

    const latestTrade = trades[trades.length - 1];
    
    // Actualizar posiciones abiertas
    const openPositionsCount = positions.filter(p => p.status === 'open').length;
    setOpenPositions(openPositionsCount);

    // Procesar trade ejecutado
    if (latestTrade.status === 'filled') {
      console.log('[RiskManager] Processing filled trade:', latestTrade);
      
      // Agregar posición al portfolio
      if (latestTrade.price && latestTrade.qty) {
        addPosition({
          symbol: latestTrade.symbol,
          side: latestTrade.side === 'BUY' ? 'long' : 'short',
          amount: latestTrade.qty,
          entryPrice: latestTrade.price,
          currentPrice: lastPrice || latestTrade.price,
        });
      }

      // Actualizar estadísticas diarias
      const tradePnL = latestTrade.pnl || 0;
      const tradeVolume = (latestTrade.price || 0) * (latestTrade.qty || 0);
      updateDailyStats(dailyPnL + tradePnL, dailyVolume + tradeVolume);
    }
  }, [trades, positions, lastPrice, dailyPnL, dailyVolume, addPosition, setOpenPositions, updateDailyStats]);

  // Actualizar precios de posiciones en tiempo real
  useEffect(() => {
    if (!lastPrice) return;

    positions.forEach(position => {
      if (position.status === 'open') {
        const newPnL = position.side === 'long' 
          ? (lastPrice - position.entryPrice) * position.amount
          : (position.entryPrice - lastPrice) * position.amount;
        
        const newPnLPercent = (newPnL / (position.entryPrice * position.amount)) * 100;
        
        // Actualizar posición con nuevo precio y PnL
        // Note: Esto requeriría una función updatePosition en el portfolioStore
      }
    });
  }, [lastPrice, positions]);

  // Verificar alertas de riesgo
  useEffect(() => {
    const alerts: string[] = [];
    
    // Verificar límites de riesgo
    if (Math.abs(dailyPnL) > (balance * limits.maxDailyPercent / 100)) {
      alerts.push(`Daily P&L limit exceeded: ${dailyPnL.toFixed(2)}`);
    }
    
    if (openPositions >= limits.maxOpenPositions) {
      alerts.push(`Maximum positions limit reached: ${openPositions}/${limits.maxOpenPositions}`);
    }
    
    // Verificar stop loss en posiciones
    positions.forEach(position => {
      if (position.status === 'open' && position.stopLoss) {
        const shouldStop = position.side === 'long' 
          ? lastPrice <= position.stopLoss
          : lastPrice >= position.stopLoss;
        
        if (shouldStop) {
          alerts.push(`Stop loss triggered for ${position.symbol}`);
        }
      }
    });
    
    setRiskAlerts(alerts);
  }, [dailyPnL, balance, limits, openPositions, positions, lastPrice]);

  const testTrade = (symbol: string, amount: number) => {
    const result = canTrade(symbol, amount);
    return result;
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Risk Manager</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {wsConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <span className="text-sm text-gray-400">Kill Switch:</span>
          <button
            onClick={toggleKillSwitch}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              killSwitch
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {killSwitch ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
          <h4 className="text-sm font-semibold text-red-400 mb-2">⚠️ Risk Alerts</h4>
          <div className="space-y-1">
            {riskAlerts.map((alert, index) => (
              <div key={index} className="text-xs text-red-300">
                • {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Level Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Risk Level
        </label>
        <div className="grid grid-cols-2 gap-2">
          {riskLevels.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setLevel(value)}
              className={`p-2 rounded text-sm font-medium transition-colors ${
                level === value
                  ? `${color} text-white`
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Limits */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Risk Limits</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Max Trade:</span>
            <span className="text-white ml-2">{limits.maxTradePercent}%</span>
          </div>
          <div>
            <span className="text-gray-400">Max Daily:</span>
            <span className="text-white ml-2">{limits.maxDailyPercent}%</span>
          </div>
          <div>
            <span className="text-gray-400">Max Positions:</span>
            <span className="text-white ml-2">{limits.maxOpenPositions}</span>
          </div>
          <div>
            <span className="text-gray-400">Stop Loss:</span>
            <span className="text-white ml-2">{limits.stopLossPercent}%</span>
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Portfolio Status</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Balance:</span>
            <span className="text-white ml-2">${balance.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-400">Total P&L:</span>
            <span className={`ml-2 ${calculateTotalPnL() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${calculateTotalPnL().toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Daily P&L:</span>
            <span className={`ml-2 ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${dailyPnL.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Open Positions:</span>
            <span className="text-white ml-2">{openPositions}/{limits.maxOpenPositions}</span>
          </div>
        </div>
      </div>

      {/* Active Positions */}
      {positions.filter(p => p.status === 'open').length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Active Positions</h4>
          <div className="space-y-2">
            {positions.filter(p => p.status === 'open').map(position => (
              <div key={position.id} className="bg-gray-700 rounded p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{position.symbol}</span>
                  <span className={`${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${position.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400 mt-1">
                  <span>{position.side.toUpperCase()} {position.amount}</span>
                  <span>@ ${position.entryPrice.toFixed(2)}</span>
                </div>
                {position.stopLoss && (
                  <div className="text-gray-500 mt-1">
                    SL: ${position.stopLoss.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Whitelist Management */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Asset Whitelist</h4>
        <div className="flex flex-wrap gap-2 mb-2">
          {whitelist.map(symbol => (
            <span
              key={symbol}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center"
            >
              {symbol}
              <button
                onClick={() => removeFromWhitelist(symbol)}
                className="ml-1 text-blue-200 hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Add symbol (e.g., ADAUSDT)"
            className="flex-1 px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
          />
          <button
            onClick={handleAddSymbol}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {/* Trade Test */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Trade Test</h4>
        <div className="text-xs text-gray-400">
          Test: 100 USDT trade on BTCUSDT
          {(() => {
            const result = testTrade('BTCUSDT', 100);
            return (
              <div className={`mt-1 ${result.allowed ? 'text-green-400' : 'text-red-400'}`}>
                {result.allowed ? '✅ Allowed' : `❌ ${result.reason}`}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Custom Limits (when custom level is selected) */}
      {level === 'custom' && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Custom Limits</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Trade %</label>
              <input
                type="number"
                value={limits.maxTradePercent}
                onChange={(e) => setLimits({ maxTradePercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Daily %</label>
              <input
                type="number"
                value={limits.maxDailyPercent}
                onChange={(e) => setLimits({ maxDailyPercent: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                step="0.1"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
