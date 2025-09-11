// src/hooks/useDatasetCollection.ts
// Hook for dataset collection functionality

import { useState, useEffect } from 'react';
import { datasetCollector, Sample5M } from '../lib/datasetCollector';

export function useDatasetCollection() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [stats, setStats] = useState(datasetCollector.getStats());

  useEffect(() => {
    // Update stats every 5 seconds
    const interval = setInterval(() => {
      setStats(datasetCollector.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const startCollection = () => {
    setIsCollecting(true);
    console.log('[DatasetCollection] Started data collection');
  };

  const stopCollection = () => {
    setIsCollecting(false);
    console.log('[DatasetCollection] Stopped data collection');
  };

  const exportData = () => {
    const data = datasetCollector.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum_dataset_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendToAPI = async () => {
    try {
      const success = await datasetCollector.sendToAPI();
      if (success) {
        console.log('[DatasetCollection] Data sent to API successfully');
      } else {
        console.error('[DatasetCollection] Failed to send data to API');
      }
      return success;
    } catch (error) {
      console.error('[DatasetCollection] Error sending data to API:', error);
      return false;
    }
  };

  const clearData = () => {
    datasetCollector.clear();
    setStats(datasetCollector.getStats());
    console.log('[DatasetCollection] Data cleared');
  };

  const generateSample = (symbol: string, horizon: '5m' | '15m' | '30m' = '5m'): Sample5M | null => {
    return datasetCollector.generateSample5M(symbol, Date.now(), horizon);
  };

  return {
    isCollecting,
    stats,
    startCollection,
    stopCollection,
    exportData,
    sendToAPI,
    clearData,
    generateSample
  };
}
