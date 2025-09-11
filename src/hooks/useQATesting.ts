// src/hooks/useQATesting.ts
// Hook for QA testing functionality

import { useState, useEffect } from 'react';
import { qaRiskMatrices, QATestResult, QAScenarioId } from '../lib/qaRiskMatrices';

export function useQATesting() {
  const [results, setResults] = useState<QATestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [passRate, setPassRate] = useState(0);

  useEffect(() => {
    // Load existing results
    const existingResults = qaRiskMatrices.getResults();
    setResults(existingResults);
    setPassRate(qaRiskMatrices.getPassRate());
  }, []);

  const runScenario = async (scenarioId: QAScenarioId) => {
    setIsRunning(true);
    try {
      const result = await qaRiskMatrices.runScenario(scenarioId);
      setResults(prev => [...prev.filter(r => r.scenarioId !== scenarioId), result]);
      setPassRate(qaRiskMatrices.getPassRate());
      return result;
    } finally {
      setIsRunning(false);
    }
  };

  const runAllScenarios = async () => {
    setIsRunning(true);
    try {
      const allResults = await qaRiskMatrices.runAllScenarios();
      setResults(allResults);
      setPassRate(qaRiskMatrices.getPassRate());
      return allResults;
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setPassRate(0);
  };

  const getResultsByCategory = (category: string) => {
    return qaRiskMatrices.getResultsByCategory(category);
  };

  return {
    results,
    isRunning,
    passRate,
    runScenario,
    runAllScenarios,
    clearResults,
    getResultsByCategory
  };
}
