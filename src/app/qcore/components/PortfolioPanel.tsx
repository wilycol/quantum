'use client';
import React from 'react';
import { usePortfolio } from '@/lib/portfolioStore';
import { useRisk } from '@/lib/riskStore';

interface PortfolioPanelProps {
  className?: string;
}

export default function PortfolioPanel({ className = '' }: PortfolioPanelProps) {
  const {
    balance,
    positions,
    trades,
    totalPnL,
    dailyPnL,
    totalVolume,
    dailyVolume,
    calculateTotalPnL,
  } = usePortfolio();

  const { openPositions, limits } = useRisk();

  const recentTrades = trades.slice(-5).reverse();
  const totalPnLValue = calculateTotalPnL();

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Portfolio</h3>
        <div className="text-sm text-gray-400">
          Positions: {openPositions}/{limits.maxOpenPositions}
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Total Balance</div>
          <div className="text-lg font-semibold text-white">
            ${balance.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Total P&L</div>
          <div className={`text-lg font-semibold ${totalPnLValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalPnLValue.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Daily P&L</div>
          <div className={`text-lg font-semibold ${dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${dailyPnL.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Daily Volume</div>
          <div className="text-lg font-semibold text-white">
            ${dailyVolume.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Open Positions ({positions.length})
        </h4>
        {positions.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No open positions
          </div>
        ) : (
          <div className="space-y-2">
            {positions.map(position => (
              <div key={position.id} className="bg-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">
                      {position.symbol}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      position.side === 'long' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {position.side.toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${
                    position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${position.pnl.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                  <div>
                    <span>Amount:</span>
                    <span className="text-white ml-1">{position.amount}</span>
                  </div>
                  <div>
                    <span>Entry:</span>
                    <span className="text-white ml-1">${position.entryPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span>Current:</span>
                    <span className="text-white ml-1">${position.currentPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Recent Trades ({trades.length})
        </h4>
        {recentTrades.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No trades yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentTrades.map(trade => (
              <div key={trade.id} className="bg-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">
                      {trade.symbol}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.side === 'long' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {trade.side.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      trade.status === 'open' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-600 text-white'
                    }`}>
                      {trade.status.toUpperCase()}
                    </span>
                  </div>
                  <div className={`text-sm font-medium ${
                    trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${trade.pnl.toFixed(2)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                  <div>
                    <span>Amount:</span>
                    <span className="text-white ml-1">{trade.amount}</span>
                  </div>
                  <div>
                    <span>Price:</span>
                    <span className="text-white ml-1">${trade.price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span>Time:</span>
                    <span className="text-white ml-1">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
