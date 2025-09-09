// src/app/qcore/components/Topbar.tsx
// Topbar component for QuantumCore v2

import React, { useState } from 'react';
import { 
  useQcoreState,
  useKillSwitchActive,
  useQcoreActions,
  useCanSwitchToLive,
  Broker,
  Mode
} from '../hooks/useQcoreState';

type Strategy = 'grid' | 'binary';
import { formatStatus } from '../lib/formatters';

interface TopbarProps {
  className?: string;
}

export default function Topbar({ className = '' }: TopbarProps) {
  // State from store
  const broker = useQcoreState(s => s.broker);
  const strategy = useQcoreState(s => s.strategy);
  const mode = useQcoreState(s => s.mode);
  const wsStatus = useQcoreState(s => s.wsStatus);
  const killSwitchActive = useKillSwitchActive();
  const canSwitchToLive = useCanSwitchToLive();
  
  // Actions from store
  const { 
    setBroker, 
    setStrategy, 
    setMode, 
    toggleKill,
    setShowModeConfirmModal,
    setKillSwitchActive
  } = useQcoreActions();

  // Local state
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [showStrategyDropdown, setShowStrategyDropdown] = useState(false);

  // Broker options
  const brokerOptions: { value: Broker; label: string; strategy: Strategy }[] = [
    { value: 'binance', label: 'Binance Spot', strategy: 'grid' },
    { value: 'zaffer', label: 'Zaffer Binary', strategy: 'binary' }
  ];

  // Strategy options based on broker
  const strategyOptions: { value: Strategy; label: string }[] = 
    broker === 'binance' 
      ? [{ value: 'grid', label: 'Grid' }]
      : [{ value: 'binary', label: 'Binary' }];

  // Handle broker change
  const handleBrokerChange = (newBroker: Broker) => {
    setBroker(newBroker);
    setShowBrokerDropdown(false);
  };

  // Handle strategy change
  const handleStrategyChange = (newStrategy: Strategy) => {
    setStrategy(newStrategy);
    setShowStrategyDropdown(false);
  };

  // Handle mode toggle
  const handleModeToggle = () => {
    if (mode === 'shadow' && canSwitchToLive) {
      setShowModeConfirmModal(true);
    } else if (mode === 'live') {
      setMode('shadow');
    }
  };

  // Handle kill switch
  const handleKillSwitch = () => {
    setKillSwitchActive(!killSwitchActive);
  };

  // Get current broker option
  const currentBroker = brokerOptions.find(opt => opt.value === broker);
  const currentStrategy = strategyOptions.find(opt => opt.value === strategy);

  // Connection status
  const isConnected = connected[broker];
  const wsStatusFormatted = formatStatus(wsStatus);
  const modeStatusFormatted = formatStatus(mode);

  return (
    <div className={`bg-gray-900 border-b border-gray-700 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Title and Mode */}
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-white">QuantumCore</h1>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Mode:</span>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                mode === 'live' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {mode.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Paper:</span>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white">
                ON
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Feed:</span>
              <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500 text-white">
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Center - Broker and Strategy */}
        <div className="flex items-center space-x-4">
          {/* Broker Selector */}
          <div className="relative">
            <button
              onClick={() => setShowBrokerDropdown(!showBrokerDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-white">{currentBroker?.label}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showBrokerDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                {brokerOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleBrokerChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                      broker === option.value ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Strategy Selector */}
          <div className="relative">
            <button
              onClick={() => setShowStrategyDropdown(!showStrategyDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="text-white">{currentStrategy?.label}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showStrategyDropdown && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
                {strategyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleStrategyChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-700 transition-colors ${
                      strategy === option.value ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shadow/Live Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleModeToggle}
              disabled={!canSwitchToLive && mode === 'shadow'}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                mode === 'shadow' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-orange-500 text-white'
              } ${!canSwitchToLive && mode === 'shadow' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
            >
              {mode === 'shadow' ? 'Shadow' : 'Live'}
            </button>
          </div>
        </div>

        {/* Right side - Connectors and Kill Switch */}
        <div className="flex items-center space-x-4">
          {/* Connectors */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Connectors:</span>
            
            {/* Binance Connector */}
            <div className="flex items-center space-x-1">
              <span className="text-sm text-white">Binance API</span>
              <div className={`w-2 h-2 rounded-full ${
                connected.binance ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            
            {/* Zaffer Connector */}
            <div className="flex items-center space-x-1">
              <span className="text-sm text-white">Zaffer API</span>
              <div className={`w-2 h-2 rounded-full ${
                connected.zaffer ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
          </div>

          {/* Kill Switch */}
          <button
            onClick={handleKillSwitch}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              killSwitchActive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {killSwitchActive ? 'Kill-Switch: ON' : 'Kill-Switch: OFF'}
          </button>
        </div>
      </div>

      {/* Kill Switch Banner */}
      {killSwitchActive && (
        <div className="mt-2 px-4 py-2 bg-red-900 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-400 font-semibold">
              KILL-SWITCH ACTIVE - All trading operations are disabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
