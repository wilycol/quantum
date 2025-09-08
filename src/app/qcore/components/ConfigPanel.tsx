// src/app/qcore/components/ConfigPanel.tsx
// Configuration panel for QuantumCore v2

import React, { useState } from 'react';
import { 
  useBroker,
  useStrategy,
  useMode,
  useAssets,
  useVolumeOn,
  useRisk,
  useGrid,
  useBinary,
  useKPIs,
  useConnected,
  useKillSwitchActive,
  useQcoreActions,
  useAvailableAssets,
  useCanStart
} from '../hooks/useQcoreState';
import { formatTime, formatCurrency, formatPercentage, formatPnL, formatWinRate } from '../lib/formatters';
import { validateRisk, validateGrid, validateBinary, validateAssets } from '../lib/validators';

interface ConfigPanelProps {
  className?: string;
}

export default function ConfigPanel({ className = '' }: ConfigPanelProps) {
  // State from store
  const broker = useBroker();
  const strategy = useStrategy();
  const mode = useMode();
  const assets = useAssets();
  const volumeOn = useVolumeOn();
  const risk = useRisk();
  const grid = useGrid();
  const binary = useBinary();
  const kpis = useKPIs();
  const connected = useConnected();
  const killSwitchActive = useKillSwitchActive();
  const availableAssets = useAvailableAssets();
  const canStart = useCanStart();
  
  // Actions from store
  const { 
    setAssets, 
    setVolumeOn, 
    setRisk, 
    setGrid, 
    setBinary,
    setKillSwitchActive 
  } = useQcoreActions();

  // Local state
  const [isRunning, setIsRunning] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Validation
  const validateConfig = () => {
    const errors: string[] = [];
    
    // Validate risk
    const riskValidation = validateRisk(risk, mode);
    if (!riskValidation.valid) {
      errors.push(...riskValidation.errors);
    }
    
    // Validate assets
    const assetValidation = validateAssets(assets, broker);
    if (!assetValidation.valid) {
      errors.push(...assetValidation.errors);
    }
    
    // Validate broker-specific config
    if (broker === 'binance') {
      const gridValidation = validateGrid(grid);
      if (!gridValidation.valid) {
        errors.push(...gridValidation.errors);
      }
    } else if (broker === 'zaffer') {
      const binaryValidation = validateBinary(binary);
      if (!binaryValidation.valid) {
        errors.push(...binaryValidation.errors);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle asset toggle
  const handleAssetToggle = (assetSymbol: string) => {
    const newAssets = assets.includes(assetSymbol)
      ? assets.filter(a => a !== assetSymbol)
      : [...assets, assetSymbol];
    
    if (newAssets.length > 0) { // Keep at least one asset
      setAssets(newAssets);
    }
  };

  // Handle risk change
  const handleRiskChange = (field: keyof typeof risk, value: number) => {
    setRisk({ [field]: value });
  };

  // Handle grid change
  const handleGridChange = (field: keyof typeof grid, value: number) => {
    setGrid({ [field]: value });
  };

  // Handle binary change
  const handleBinaryChange = (field: keyof typeof binary, value: any) => {
    setBinary({ [field]: value });
  };

  // Handle start/stop
  const handleStart = () => {
    if (validateConfig() && canStart) {
      setIsRunning(true);
      // TODO: Start trading logic
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    // TODO: Stop trading logic
  };

  const handleReset = () => {
    setIsRunning(false);
    // TODO: Reset logic
  };

  const handleEmergencyStop = () => {
    setKillSwitchActive(true);
    setIsRunning(false);
    // TODO: Emergency stop logic
  };

  const handleExport = () => {
    // TODO: Export results logic
    console.log('Exporting results...');
  };

  // Format KPIs
  const pnlFormatted = formatPnL(kpis.pnl);
  const winRateFormatted = formatWinRate(kpis.winRate);

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Simulation Config */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Simulation Config</h3>
        
        <div className="space-y-4">
          {/* Initial Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Initial Amount ($)
            </label>
            <input
              type="number"
              value={kpis.balance}
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
            />
          </div>

          {/* Simulation Time */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Simulation Time
            </label>
            <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </div>

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Risk Tolerance
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔒</span>
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.01"
                value={risk.maxOrderPct}
                onChange={(e) => handleRiskChange('maxOrderPct', parseFloat(e.target.value))}
                disabled={mode === 'live'}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xl">⚡</span>
            </div>
            <div className="text-center text-sm text-gray-400 mt-1">
              {formatPercentage(risk.maxOrderPct * 100)}
            </div>
          </div>

          {/* Assets */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Assets (whitelist)
            </label>
            <div className="max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-2 space-y-1">
              {availableAssets.map((asset) => (
                <label key={asset.symbol} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assets.includes(asset.symbol)}
                    onChange={() => handleAssetToggle(asset.symbol)}
                    className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">{asset.symbol}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Volume Toggle */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={volumeOn}
                onChange={(e) => setVolumeOn(e.target.checked)}
                className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 rounded text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-300">Show Volume</span>
            </label>
          </div>
        </div>
      </div>

      {/* Broker-specific Configuration */}
      {broker === 'binance' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Grid Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Grid Size
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={grid.size}
                onChange={(e) => handleGridChange('size', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Lower Bound
              </label>
              <input
                type="number"
                value={grid.lower}
                onChange={(e) => handleGridChange('lower', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Upper Bound
              </label>
              <input
                type="number"
                value={grid.upper}
                onChange={(e) => handleGridChange('upper', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Step Percentage
              </label>
              <input
                type="number"
                min="0.01"
                max="1"
                step="0.01"
                value={grid.stepPct}
                onChange={(e) => handleGridChange('stepPct', parseFloat(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {broker === 'zaffer' && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Binary Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={binary.amount}
                onChange={(e) => handleBinaryChange('amount', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Expiry
              </label>
              <select
                value={binary.expiry}
                onChange={(e) => handleBinaryChange('expiry', parseInt(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              >
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={120}>2 minutes</option>
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Direction
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBinaryChange('direction', 'CALL')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    binary.direction === 'CALL' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  CALL
                </button>
                <button
                  onClick={() => handleBinaryChange('direction', 'PUT')}
                  className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition-colors ${
                    binary.direction === 'PUT' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  PUT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
          <div className="text-red-400 text-sm">
            <strong>Configuration Errors:</strong>
            <ul className="mt-1 list-disc list-inside">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bot Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Bot Controls</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={handleStart}
            disabled={!canStart || isRunning}
            className="px-3 py-2 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm font-semibold hover:bg-gray-500 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
          >
            Stop
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={handleReset}
            disabled={isRunning}
            className="px-3 py-2 bg-gray-700 text-white rounded text-sm font-semibold hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleEmergencyStop}
            disabled={killSwitchActive}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Emergency Stop
          </button>
        </div>
        
        <button
          onClick={handleExport}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Export Results
        </button>
      </div>

      {/* KPIs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Session KPIs</h3>
        
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <h4 className="text-sm text-gray-400 uppercase">Elapsed</h4>
            <p className="text-xl font-bold text-blue-500">{formatTime(kpis.elapsed)}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 uppercase">Balance</h4>
            <p className="text-xl font-bold text-white">{formatCurrency(kpis.balance)}</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 uppercase">P/L</h4>
            <p className={`text-xl font-bold ${pnlFormatted.color}`}>
              {pnlFormatted.text}
            </p>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 uppercase">Trades</h4>
            <p className="text-xl font-bold text-white">{kpis.trades}</p>
          </div>
          <div className="col-span-2">
            <h4 className="text-sm text-gray-400 uppercase">Win Rate</h4>
            <p className={`text-xl font-bold ${winRateFormatted.color}`}>
              {winRateFormatted.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
