'use client';
import React from 'react';
import { useDatasetCollection } from '../hooks/useDatasetCollection';

interface DatasetPanelProps {
  className?: string;
}

export default function DatasetPanel({ className = '' }: DatasetPanelProps) {
  const {
    isCollecting,
    stats,
    startCollection,
    stopCollection,
    exportData,
    sendToAPI,
    clearData,
    generateSample
  } = useDatasetCollection();

  const handleGenerateSample = () => {
    const sample = generateSample('BTCUSDT', '5m');
    if (sample) {
      console.log('Generated sample:', sample);
    }
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Dataset Collection</h3>
        <p className="text-sm text-gray-400">Training data collection system</p>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${isCollecting ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-300">
            {isCollecting ? 'Collecting data...' : 'Collection stopped'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={isCollecting ? stopCollection : startCollection}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            isCollecting
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isCollecting ? 'Stop Collection' : 'Start Collection'}
        </button>
        
        <button
          onClick={exportData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Export Data
        </button>
        
        <button
          onClick={sendToAPI}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
        >
          Send to API
        </button>
        
        <button
          onClick={clearData}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          Clear Data
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Collection Stats</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Events:</span>
            <span className="text-white ml-2">{stats.events}</span>
          </div>
          <div>
            <span className="text-gray-400">Klines:</span>
            <span className="text-white ml-2">{stats.klines}</span>
          </div>
          <div>
            <span className="text-gray-400">Orders:</span>
            <span className="text-white ml-2">{stats.orders}</span>
          </div>
          <div>
            <span className="text-gray-400">Risk Checks:</span>
            <span className="text-white ml-2">{stats.riskChecks}</span>
          </div>
          <div>
            <span className="text-gray-400">Samples:</span>
            <span className="text-white ml-2">{stats.samples}</span>
          </div>
          <div>
            <span className="text-gray-400">Session:</span>
            <span className="text-white ml-2 text-xs">{stats.sessionId.slice(-8)}</span>
          </div>
        </div>
      </div>

      {/* Sample Generation */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Sample Generation</h4>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSample}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          >
            Generate Sample
          </button>
          <span className="text-xs text-gray-400 self-center">
            Creates mock 5m sample for testing
          </span>
        </div>
      </div>

      {/* Data Types Info */}
      <div className="text-xs text-gray-400">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Data Types</h4>
        <div className="space-y-1">
          <div>• <strong>Events:</strong> Real-time trading events</div>
          <div>• <strong>Klines:</strong> OHLCV market data</div>
          <div>• <strong>Orders:</strong> Trade execution records</div>
          <div>• <strong>Risk Checks:</strong> Risk validation decisions</div>
          <div>• <strong>Samples:</strong> 5m training windows</div>
        </div>
      </div>
    </div>
  );
}
