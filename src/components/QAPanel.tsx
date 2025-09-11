'use client';
import React, { useState, useEffect } from 'react';
import { qaRiskMatrices, QA_SCENARIOS, QATestResult, QAScenarioId } from '../lib/qaRiskMatrices';

interface QAPanelProps {
  className?: string;
}

export default function QAPanel({ className = '' }: QAPanelProps) {
  const [results, setResults] = useState<QATestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<QAScenarioId | null>(null);

  const categories = [
    { id: 'all', name: 'All', color: 'bg-gray-500' },
    { id: 'connection', name: 'Connection', color: 'bg-blue-500' },
    { id: 'limits', name: 'Limits', color: 'bg-yellow-500' },
    { id: 'killswitch', name: 'Kill Switch', color: 'bg-red-500' },
    { id: 'broker', name: 'Broker', color: 'bg-purple-500' },
    { id: 'signals', name: 'Signals', color: 'bg-green-500' },
    { id: 'security', name: 'Security', color: 'bg-orange-500' }
  ];

  const filteredResults = selectedCategory === 'all' 
    ? results 
    : results.filter(result => {
        const scenario = QA_SCENARIOS[result.scenarioId];
        return scenario?.category === selectedCategory;
      });

  const passRate = qaRiskMatrices.getPassRate();

  const runSingleScenario = async (scenarioId: QAScenarioId) => {
    setIsRunning(true);
    try {
      const result = await qaRiskMatrices.runScenario(scenarioId);
      setResults(prev => [...prev.filter(r => r.scenarioId !== scenarioId), result]);
    } catch (error) {
      console.error('Failed to run scenario:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllScenarios = async () => {
    setIsRunning(true);
    try {
      const allResults = await qaRiskMatrices.runAllScenarios();
      setResults(allResults);
    } catch (error) {
      console.error('Failed to run all scenarios:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'PASS': return 'text-green-400';
      case 'FAIL': return 'text-red-400';
      case 'ERROR': return 'text-orange-400';
      case 'PENDING': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'ERROR': return '⚠️';
      case 'PENDING': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">QA Risk Matrices</h3>
          <p className="text-sm text-gray-400">Automated testing framework</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            Pass Rate: <span className={`font-medium ${passRate >= 80 ? 'text-green-400' : passRate >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {passRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={runAllScenarios}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Run All Tests'}
        </button>
        <button
          onClick={clearResults}
          disabled={isRunning}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? `${category.color} text-white`
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No test results yet. Run some tests to see results here.
          </div>
        ) : (
          filteredResults.map((result, index) => {
            const scenario = QA_SCENARIOS[result.scenarioId];
            return (
              <div
                key={`${result.scenarioId}-${index}`}
                className="bg-gray-700 rounded-lg p-3 border border-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {result.scenarioId}: {scenario?.name}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getResultColor(result.result)}`}>
                      {getResultIcon(result.result)} {result.result}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {result.duration}ms
                  </div>
                </div>

                <div className="text-xs text-gray-400 mb-2">
                  {scenario?.expectedResult}
                </div>

                {result.actualResult && (
                  <div className="text-xs text-gray-300 mb-2">
                    <strong>Actual:</strong> {result.actualResult}
                  </div>
                )}

                {result.logs.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                      Logs ({result.logs.length})
                    </summary>
                    <div className="mt-2 space-y-1 bg-gray-800 p-2 rounded">
                      {result.logs.map((log, i) => (
                        <div key={i} className="text-gray-300 font-mono">
                          {log}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {result.errors.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-400 hover:text-red-300">
                      Errors ({result.errors.length})
                    </summary>
                    <div className="mt-2 space-y-1 bg-red-900/20 p-2 rounded">
                      {result.errors.map((error, i) => (
                        <div key={i} className="text-red-300 font-mono">
                          {error}
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => runSingleScenario(result.scenarioId)}
                    disabled={isRunning}
                    className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 disabled:opacity-50"
                  >
                    Re-run
                  </button>
                  <span className="text-xs text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total:</span>
              <span className="text-white ml-2">{results.length}</span>
            </div>
            <div>
              <span className="text-gray-400">Passed:</span>
              <span className="text-green-400 ml-2">
                {results.filter(r => r.result === 'PASS').length}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Failed:</span>
              <span className="text-red-400 ml-2">
                {results.filter(r => r.result === 'FAIL').length}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Errors:</span>
              <span className="text-orange-400 ml-2">
                {results.filter(r => r.result === 'ERROR').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
